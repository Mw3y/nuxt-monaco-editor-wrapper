<template>
  <Suspense>
    <MonacoEditorWrapper
      v-model="code"
      style="height: 100vh; width: 100vw"
      :config="{
        wrapperConfig: {
          editorAppConfig: {
            codeResources: {
              main: {
                text: '',
                fileExt: 'cpp',
                enforceLanguageId: 'cpp',
              },
            },
          },
        },
      }"
    />
  </Suspense>
</template>

<script lang="ts" setup>
const code = defineModel<string>('')

watch(code, () => {
  console.log(code.value)
})
</script>
