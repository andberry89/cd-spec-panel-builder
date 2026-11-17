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
    <legend class="visually-hidden">Trim or configuration</legend>

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
  grid-template-columns: minmax(110px, 1fr) minmax(130px, 1fr) minmax(130px, auto) auto;
  align-items: end;
  gap: 0.75rem;
  padding: 0.7rem 0;
  border: 0;
  border-bottom: 1px solid #ecece7;
}

legend {
  padding: 0 0.35rem;
  font-weight: 700;
}

label {
  display: grid;
  gap: 0.3rem;
  color: #55574f;
  font-size: 0.8rem;
  font-weight: 600;
}

input {
  width: 100%;
  min-height: 2.3rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #b8b9b1;
  border-radius: 0.25rem;
  background: #fff;
  color: #20211f;
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

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.remove-button {
  min-height: 2.2rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #c6a8a2;
  border-radius: 0.25rem;
  background: transparent;
  color: #873e36;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

@media (max-width: 640px) {
  .trim-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

</style>
