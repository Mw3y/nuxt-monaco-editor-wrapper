/// <reference lib="WebWorker" />
/**
 * A huge part of this worker code has been made by Guyutongxue.
 * https://github.com/Guyutongxue/clangd-in-browser
 */
import {
  BrowserMessageReader,
  BrowserMessageWriter,
} from 'vscode-languageserver-protocol/browser'
import { WORKSPACE_PATH } from '../../workspace.config'
import { JsonStream, LF } from './JsonStream'

declare var self: DedicatedWorkerGlobalScope

// const IS_DEV = import.meta.env.DEV
const IS_DEV = true
const COMPILE_ARGS = ['-xc++', '-std=c++2b', '-pedantic-errors', '-Wall']
const FLAGS = [
  ...COMPILE_ARGS,
  '--target=wasm32-wasi',
  '-isystem/usr/include/c++/v1',
  '-isystem/usr/include/wasm32-wasi/c++/v1',
  '-isystem/usr/include',
  '-isystem/usr/include/wasm32-wasi',
]

const stdinChunks: string[] = []
const currentStdinChunk: (number | null)[] = []
const textEncoder = new TextEncoder()
let resolveStdinReady = () => {}

const stdin = (): number | null => {
  if (currentStdinChunk.length === 0) {
    if (stdinChunks.length === 0) {
      // Should not reach here
      // stdinChunks.push("Content-Length: 0\r\n", "\r\n");
      console.error('Try to fetch exhausted stdin')
      return null
    }
    const nextChunk = stdinChunks.shift()!
    currentStdinChunk.push(...textEncoder.encode(nextChunk), null)
  }
  return currentStdinChunk.shift()!
}

const jsonStream = new JsonStream()
const stdout = (charCode: number) => {
  const jsonOrNull = jsonStream.insert(charCode)
  if (jsonOrNull !== null) {
    if (IS_DEV) {
      console.log('%c%s', 'color: green', jsonOrNull)
    }
    writer.write(JSON.parse(jsonOrNull))
  }
}

let stderrLine = ''
const stderr = (charCode: number) => {
  if (charCode === LF) {
    if (IS_DEV) {
      console.log('%c%s', 'color: darkorange', stderrLine)
    }
    stderrLine = ''
  } else {
    stderrLine += String.fromCharCode(charCode)
  }
}

const stdinReady = async () => {
  if (stdinChunks.length === 0)
    return new Promise<void>((r) => (resolveStdinReady = r))
}

const onAbort = () => {
  writer.end()
  self.reportError('clangd aborted')
}

const wasmBase = `/cpp/`
const wasmDataUrl = `${wasmBase}clangd.wasm`
const jsModule = import(/* @vite-ignore */ `${wasmBase}clangd.js`)

const { default: Clangd } = await jsModule

const clangd = await Clangd({
  thisProgram: '/usr/bin/clangd',
  locateFile: (path: string, prefix: string) => {
    return path.endsWith('.wasm') ? wasmDataUrl : `${prefix}${path}`
  },
  stdinReady: stdinReady,
  stdin: stdin,
  stdout: stdout,
  stderr: stderr,
  onExit: onAbort,
  onAbort: onAbort,
})

// Create the Emscripten workspace
clangd.FS.mkdir(WORKSPACE_PATH)
clangd.FS.writeFile(
  `${WORKSPACE_PATH}/.clangd`,
  JSON.stringify({ CompileFlags: { Add: FLAGS } }),
)

console.log('%c%s', 'font-size: 2em; color: green', 'clangd started')
clangd.callMain([])

// Notify main thread that the worker is ready
self.postMessage({ type: 'ready' })

const reader = new BrowserMessageReader(self)
const writer = new BrowserMessageWriter(self)

reader.listen((data) => {
  console.log(data)
  // Non-ASCII characters cause bad Content-Length. Just escape them.
  const body = JSON.stringify(data).replace(/[\u007F-\uFFFF]/g, (ch) => {
    return '\\u' + ch.codePointAt(0)!.toString(16).padStart(4, '0')
  })
  const header = `Content-Length: ${body.length}\r\n`
  const delimiter = '\r\n'
  stdinChunks.push(header, delimiter, body)
  resolveStdinReady()
})
