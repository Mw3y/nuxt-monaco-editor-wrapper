import {
  defineNuxtModule,
  addPlugin,
  createResolver,
  addComponent,
} from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'

// Module options TypeScript interface definition
export interface ModuleOptions {
  workspacePath: string
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-monaco-wrapper',
    configKey: 'nuxtMonacoWrapper',
    compatibility: {
      // Semver version of supported nuxt versions
      nuxt: '>=3.0.0',
    },
  },
  // Default configuration options of the Nuxt module
  defaults: {
    workspacePath: 'workspace',
  },
  setup(_options, _nuxt) {
    const { resolve } = createResolver(import.meta.url)

    // Necessary setup for the module to work properly
    configureCrossOriginPolicy(_nuxt)
    configureVite(_nuxt)

    addComponent({
      name: 'MonacoEditorWrapper',
      filePath: resolve('runtime/components/MonacoEditorWrapper.client.vue'),
    })

    // Add public assets
    _nuxt.hook('nitro:config', async (nitroConfig) => {
      nitroConfig.publicAssets ||= []
      nitroConfig.publicAssets.push({
        dir: resolve('./runtime/public'),
        maxAge: 60 * 60 * 24 * 1, // 1 day
      })
    })

    // Do not add the extension since the `.ts` will be transpiled to `.mjs` after `npm run prepack`
    addPlugin(resolve('./runtime/plugin'))
  },
})

function configureCrossOriginPolicy(nuxt: Nuxt) {
  nuxt.options.routeRules ||= {}
  nuxt.options.routeRules['/**'] ||= {}

  const rule = nuxt.options.routeRules['/**']
  rule.headers ||= {}
  // Fix SharedArrayBuffer is not defined in production
  rule.headers['Cross-Origin-Opener-Policy'] = 'same-origin'
  rule.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
}

function configureVite(nuxt: Nuxt) {
  nuxt.options.vite ||= {}
  const vite = nuxt.options.vite

  vite.resolve ||= {}
  vite.resolve.dedupe ||= []
  vite.resolve.dedupe.push('vscode')

  // Allow top level await usage in worker
  vite.build ||= {}
  vite.build.target = 'esnext'
  vite.worker ||= {}
  vite.worker.format = 'es'

  // Allow to run the `new URL(..., import.meta.url)` syntax
  // This is needed for monaco-editor-wrapper
  vite.optimizeDeps ||= {}
  vite.optimizeDeps.esbuildOptions ||= {}
  vite.optimizeDeps.esbuildOptions.plugins ||= []
  vite.optimizeDeps.esbuildOptions.plugins.push(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    importMetaUrlPlugin
  )

  // Fix SharedArrayBuffer is not defined in development
  vite.plugins ||= []
  vite.plugins.push({
    name: 'configure-response-headers',
    configureServer: (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        next()
      })
    },
  })
}
