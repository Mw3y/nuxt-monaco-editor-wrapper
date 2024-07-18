<script lang="ts" setup>
import { watch, onUnmounted, ref } from 'vue'
import {
  MonacoEditorLanguageClientWrapper,
  type UserConfig,
} from 'monaco-editor-wrapper'
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import defu from 'defu'
import { ClangdLanguageServer } from '../workers/cpp/ClangdLanguageServer'
import { createDefaultWrapperConfig } from './wrapperConfig.default'
import { useRuntimeConfig } from '#app'

interface Emits {
  (event: 'update:modelValue', value: string): void
}

interface Props {
  modelValue?: string
  language?: string
  config?: UserConfig
  options?: UserConfig
}

const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
  modelValue: () => '',
  language: () => 'plaintext',
})

// -------------------[ Language client ]------------------
const languageServer = await ClangdLanguageServer.initialize()

// ------------[ Monaco Editor Wrapper config ]------------
const { monacoWorkspacePath } = useRuntimeConfig().public
const loggerConfig: UserConfig['loggerConfig'] = {
  enabled: true,
  debugEnabled: import.meta.dev,
}
const defaultConfig: UserConfig = {
  wrapperConfig: createDefaultWrapperConfig(monacoWorkspacePath),
  languageClientConfig: languageServer?.createMonacoConfig(),
  loggerConfig: loggerConfig,
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

const userConfig = defu(props.config, defaultConfig)
watch(monacoRef, async () => {
  await wrapper.initAndStart(userConfig, monacoRef.value!)
  // Handle model value changes
  const textModels = wrapper.getTextModels()
  if (textModels && textModels.text) {
    const text = textModels.text
    // Emit v-model changes
    text.onDidChangeContent((_) => {
      emit('update:modelValue', text.getValue())
    })
    // Apply v-model changes
    watch(() => props.modelValue, (modelValue) => {
      if (text.getValue() !== modelValue) {
        text.setValue(modelValue)
      }
    })
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
