<script setup lang="ts">
import EasingEditor from './components/EasingEditor.vue'
import {ref} from 'vue';
const easing = ref('cubic-bezier(0.65, 0.05, 0.36, 1)')
</script>

<template>
  <easing-editor v-model="easing" />
</template>

<style scoped>

</style>
