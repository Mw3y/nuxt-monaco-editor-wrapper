export default defineNuxtConfig({
  modules: ['../src/module'],
  devtools: { enabled: true },
  compatibilityDate: '2024-07-11',

  vite: {
    resolve: {
      dedupe: ['vscode'],
    },
  },
})
