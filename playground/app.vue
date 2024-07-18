<template>
  <Suspense>
    <MonacoEditorWrapper
      v-model="code"
      style="height: 100vh; width: 100vw"
    />
  </Suspense>
</template>

<script lang="ts" setup>
const code = defineModel<string>()
watch(code, () => {
  console.log(code.value)
})
</script>
