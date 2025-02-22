<script lang="ts" setup>
import defu from 'defu'
import { type UserConfig, type WrapperConfig } from 'monaco-editor-wrapper'
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import type { LoggerConfig } from 'monaco-languageclient/tools'
import { computed, onUnmounted, ref, watch } from 'vue'
import getConfigurationServiceOverride from '@codingame/monaco-vscode-configuration-service-override'
import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override'
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override'
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services'
import { useMonacoWrapper } from '../composables/useMonacoWrapper'

interface Emits {
  (event: 'update:modelValue', value: string): void
}

interface Props {
  modelValue?: string
  config?: UserConfig
}

const emit = defineEmits<Emits>()
const props = withDefaults(defineProps<Props>(), {
  modelValue: () => '',
})

// ------------[ Monaco Editor Wrapper config ]------------
const wrapperConfig: WrapperConfig = {
  editorAppConfig: {
    $type: 'extended',
    useDiffEditor: false,
    codeResources: {},
  },
  serviceConfig: {
    userServices: {
      ...getConfigurationServiceOverride(),
      ...getEditorServiceOverride(useOpenEditorStub),
      ...getKeybindingsServiceOverride(),
    },
    debugLogging: import.meta.dev,
  },
}
const loggerConfig: LoggerConfig = {
  enabled: true,
  debugEnabled: import.meta.dev,
}
const defaultConfig: UserConfig = {
  wrapperConfig: wrapperConfig,
  languageClientConfig: undefined,
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
const userConfig = computed(() => defu(() => props.config, defaultConfig))
const wrapper = useMonacoWrapper()!

// Initialize monaco when the html element is available
watch(monacoRef, async () => {
  await wrapper.initAndStart(userConfig.value, monacoRef.value!)
  // Handle model value changes
  const textModels = wrapper.getTextModels()
  if (textModels && textModels.text) {
    const text = textModels.text
    // Emit v-model changes
    text.onDidChangeContent((_) => {
      emit('update:modelValue', text.getValue())
    })
    // Apply v-model changes
    watch(
      () => props.modelValue,
      (modelValue) => {
        if (text.getValue() !== modelValue) {
          text.setValue(modelValue)
        }
      },
    )
  }

  // Restart wrapper when needed
  watch(userConfig, async (oldConfig, newConfig) => {
    if (wrapper.isReInitRequired(newConfig, oldConfig)) {
      if (wrapper.isInitDone()) {
        await wrapper.dispose()
      }
      await wrapper.initAndStart(userConfig.value, monacoRef.value!)
    }
  })
})

onUnmounted(() => {
  wrapper.dispose()
})
</script>

<template>
  <div ref="monacoRef" />
</template>
