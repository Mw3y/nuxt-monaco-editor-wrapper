import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addComponent,
  addImports,
} from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'

// Module options TypeScript interface definition
export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-monaco-editor-wrapper',
    configKey: 'nuxtMonacoEditorWrapper',
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    configureVite(_nuxt)

    addComponent({
      name: 'MonacoEditorWrapper',
      filePath: resolve('runtime/components/MonacoEditorWrapper.client.vue'),
    })

    addImports({
      name: 'useMonacoWrapper',
      from: resolve('composables/useMonacoWrapper'),
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolve('./runtime/plugin'))
  },
})

function configureVite(nuxt: Nuxt) {
  nuxt.options.vite ||= {}
  const vite = nuxt.options.vite

  vite.resolve ||= {}
  vite.resolve.dedupe ||= []
  vite.resolve.dedupe.push('vscode')

  // Allow to run the `new URL(..., import.meta.url)` syntax
  // This is needed for monaco-editor-wrapper
  vite.optimizeDeps ||= {}
  vite.optimizeDeps.esbuildOptions ||= {}
  vite.optimizeDeps.esbuildOptions.plugins ||= []
  vite.optimizeDeps.esbuildOptions.plugins.push(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importMetaUrlPlugin,
  )
}
