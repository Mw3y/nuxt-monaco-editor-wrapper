/**
 * Original code: https://github.com/e-chan1007/nuxt-monaco-editor/blob/main/src/runtime/composables.ts
 * Written by https://github.com/e-chan1007
 */
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper'
import { useState } from '#imports'

export const _useMonacoWrapperState = () =>
  useState<MonacoEditorLanguageClientWrapper | null>('MonacoWrapperNameSpace',
    () => import.meta.client ? new MonacoEditorLanguageClientWrapper() : null)

/**
 * Get the monaco editor wrapper
 * @returns `monaco-wrapper` instance: if unavailable (server-side), returns `null`
 */
export const useMonacoWrapper = (): MonacoEditorLanguageClientWrapper | null =>
  _useMonacoWrapperState().value
