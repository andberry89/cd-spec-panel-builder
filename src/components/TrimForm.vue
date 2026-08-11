<script setup lang="ts">
import type { Trim } from '../types/vehicle'

defineProps<{
  trim: Trim
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
  'update:name': [name: string]
}>()
</script>

<template>
  <fieldset class="trim-form">
    <legend>Trim or configuration</legend>

    <label>
      Trim name
      <input
        :value="trim.name"
        type="text"
        placeholder="e.g. Sport"
        @input="emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <button v-if="canRemove" type="button" class="remove-button" @click="emit('remove')">
      Remove trim
    </button>
  </fieldset>
</template>

<style scoped>
.trim-form {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
}

legend {
  padding: 0 0.35rem;
  font-weight: 700;
}

label {
  display: grid;
  gap: 0.4rem;
  color: #6a6258;
  font-size: 0.9rem;
  font-weight: 700;
}

input {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #c8beb1;
  border-radius: 0.45rem;
  background: #fffdf9;
  color: #202124;
  font: inherit;
}

.remove-button {
  justify-self: start;
  padding: 0.55rem 0.8rem;
  border: 1px solid #c8beb1;
  border-radius: 0.45rem;
  background: transparent;
  color: #6a6258;
  cursor: pointer;
}
</style>
