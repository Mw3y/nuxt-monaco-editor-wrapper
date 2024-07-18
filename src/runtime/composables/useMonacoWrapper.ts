/**
 * Original code: https://github.com/e-chan1007/nuxt-monaco-editor/blob/main/src/runtime/composables.ts
 * Written by https://github.com/e-chan1007
 */
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { useState } from '#imports'

export const _useMonacoWrapperState = () =>
  useState<MonacoEditorLanguageClientWrapper | null>('MonacoWrapperNameSpace',
    () => new MonacoEditorLanguageClientWrapper())

/**
 * Get the monaco editor namespace
 * @returns `monaco-wrapper` namespace: if unavailable (server-side), returns `null`
 */
export const useMonacoWrapper = (): MonacoEditorLanguageClientWrapper | null =>
  _useMonacoWrapperState().value
