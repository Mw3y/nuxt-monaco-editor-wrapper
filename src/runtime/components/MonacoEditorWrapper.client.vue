<script lang="ts" setup>
import { watch, onUnmounted, ref } from 'vue'
import {
  MonacoEditorLanguageClientWrapper,
  type UserConfig,
} from 'monaco-editor-wrapper'
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import { Uri } from 'vscode'
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override'
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override'
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services'
import { WORKSPACE_PATH } from '../workspace.config'
import { ClangdLanguageServer } from '../workers/cpp/ClangdLanguageServer'

// -------------------[ Language client ]------------------
const languageServer = await ClangdLanguageServer.initialize()

// ------------[ Monaco Editor Wrapper config ]------------
const wrapperConfig: UserConfig['wrapperConfig'] = {
  editorAppConfig: {
    $type: 'extended',
    useDiffEditor: false,
    codeResources: {
      main: {
        text: '#include <print>\n\nint main() {\n    std::println("Hello, {}!", "world");\n}\n',
        uri: `${WORKSPACE_PATH}/main.cpp`,
        // enforceLanguageId: languageServer.languageId,
      },
    },
    userConfiguration: {
      json: JSON.stringify({
        'workbench.colorTheme': 'GitHub Light',
        'editor.guides.bracketPairsHorizontal': 'active',
        'editor.wordBasedSuggestions': 'off',
        'editor.quickSuggestionsDelay': 200,
      }),
    },
  },
  serviceConfig: {
    userServices: {
      ...getConfigurationServiceOverride(),
      ...getEditorServiceOverride(useOpenEditorStub),
      ...getKeybindingsServiceOverride(),
    },
    workspaceConfig: {
      workspaceProvider: {
        trusted: true,
        workspace: {
          workspaceUri: Uri.file(WORKSPACE_PATH),
        },
        async open() {
          return false
        },
      },
    },
    debugLogging: true,
  },
}
const loggerConfig: UserConfig['loggerConfig'] = {
  enabled: true,
  debugEnabled: true,
}

// ------------[ Monaco Editor Wrapper Worker ]------------
useWorkerFactory({
  ignoreMapping: true,
  workerLoaders: {
    editorWorkerService: () => new EditorWorker(),
  },
})

// ----------------[ Launch Monaco Editor ]----------------
const monacoRef = ref<HTMLElement>()
const wrapper = new MonacoEditorLanguageClientWrapper()
const userConfig = {
  wrapperConfig: wrapperConfig,
  languageClientConfig: languageServer?.createMonacoConfig(),
  loggerConfig: loggerConfig,
}

// onMounted(async () => {
//   await wrapper.initAndStart(userConfig, monacoRef.value!)
// })

watch(monacoRef, async () => {
  if (monacoRef.value) {
    await wrapper.initAndStart(userConfig, monacoRef.value!)
  }
})

onUnmounted(() => {
  wrapper.dispose()
  languageServer?.dispose()
})
</script>

<template>
  <div ref="monacoRef" />
</template>
