import type { UserConfig } from 'monaco-editor-wrapper'
import type { MessageTransports } from 'vscode-languageclient'
import { CloseAction, ErrorAction } from 'vscode-languageclient'
import { Uri } from 'vscode'

export abstract class LanguageServer {
  protected _languageId: string
  protected _worker!: Worker
  protected _transports!: MessageTransports
  protected _initializationOptions?: object

  protected constructor({
    languageId,
    worker,
    transports,
    initializationOptions,
  }: {
    languageId: string
    worker: Worker
    transports: MessageTransports
    initializationOptions?: object
  }) {
    this._languageId = languageId
    this._worker = worker
    this._transports = transports
    this._initializationOptions = initializationOptions
  }

  /**
   * Waits for the first message of a worker.
   * @param worker the worker to wait for
   * @param failAfterMs the maximum time to wait for
   * @returns a promise which resolves on the first worker message
   */
  static async awaitWorkerLoad(worker: Worker, failAfterMs = 8000) {
    let markAsReady = (_: unknown) => {}
    let markAsFailed = () => {}

    const timeout = setTimeout(() => markAsFailed(), failAfterMs)
    worker.addEventListener('message', (message) => {
      if (message.data.type === 'ready') {
        clearTimeout(timeout)
        markAsReady(true)
      }
    })

    return new Promise((resolve, reject) => {
      markAsReady = resolve
      markAsFailed = reject
    })
  }

  /**
   * Creates the language client config for the monaco editor wrapper.
   * @returns the language client config
   */
  createMonacoConfig(): UserConfig['languageClientConfig'] {
    return {
      name: `${this._languageId}-language-client`,
      languageId: this._languageId,
      options: {
        $type: 'WorkerDirect',
        worker: this._worker,
      },
      clientOptions: {
        documentSelector: [this._languageId],
        initializationOptions: this._initializationOptions,
        errorHandler: {
          error: () => ({ action: ErrorAction.Continue }),
          closed: () => ({ action: CloseAction.DoNotRestart }),
        },
        workspaceFolder: {
          index: 0,
          name: 'workspace',
          uri: Uri.file('workspace'),
        },
      },
      connectionProvider: {
        get: async () => this._transports,
      },
    }
  }

  dispose() {
    this._worker.terminate()
  }

  get languageId() {
    return this._languageId
  }

  get worker() {
    return this._worker
  }

  get transports() {
    return this._transports
  }

  get initializationOptions() {
    return this._initializationOptions
  }
}
