<script setup lang="ts">
import type { PriceValue, Trim } from '../types/vehicle'

const props = defineProps<{
  trim: Trim
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
  'update:name': [name: string]
  'update:base-price': [price: PriceValue]
}>()

const updateBasePrice = (changes: Partial<PriceValue>) => {
  emit('update:base-price', { ...props.trim.basePrice, ...changes })
}
</script>

<template>
  <fieldset class="trim-form">
    <legend>Trim or configuration</legend>

    <label>
      Trim or configuration
      <input
        :value="trim.name"
        type="text"
        placeholder="e.g. Sport"
        @input="emit('update:name', ($event.target as HTMLInputElement).value)"
      />
    </label>

    <label>
      Base price
      <input
        :value="trim.basePrice.amount"
        type="text"
        inputmode="decimal"
        placeholder="$68,990"
        @input="updateBasePrice({ amount: ($event.target as HTMLInputElement).value })"
      />
    </label>

    <label class="estimate-toggle">
      <input
        :checked="trim.basePrice.estimated"
        type="checkbox"
        @change="updateBasePrice({ estimated: ($event.target as HTMLInputElement).checked })"
      />
      This price is a <em>C/D</em> estimate
    </label>

    <button v-if="canRemove" type="button" class="remove-button" @click="emit('remove')">
      Remove configuration
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

.estimate-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 400;
}

.estimate-toggle input {
  width: auto;
}

</style>
