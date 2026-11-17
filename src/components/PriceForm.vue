<script setup lang="ts">
import type { Trim } from '../types/vehicle'
import TrimForm from './TrimForm.vue'

const props = defineProps<{
  trims: Trim[]
  includeTrimInHeading: boolean
}>()

const emit = defineEmits<{
  'update:trims': [trims: Trim[]]
  'update:include-trim-in-heading': [include: boolean]
}>()

const updateTrim = (trimId: string, changes: Partial<Trim>) => {
  emit(
    'update:trims',
    props.trims.map((trim) => (trim.id === trimId ? { ...trim, ...changes } : trim)),
  )
}

const addTrim = () => {
  emit('update:trims', [
    ...props.trims,
    { id: `trim-${Date.now()}`, name: '', basePrice: { amount: '', estimated: false }, fields: [] },
  ])
}

const removeTrim = (trimId: string) => {
  emit('update:trims', props.trims.filter((trim) => trim.id !== trimId))
}

</script>

<template>
  <section class="price-form" aria-labelledby="price-form-heading">
    <div class="price-form-heading">
      <div>
        <p class="eyebrow">Price</p>
        <h4 id="price-form-heading">
          Base price by trim
        </h4>
      </div>
      <button type="button" class="add-button" @click="addTrim">
        Add trim
      </button>
    </div>

    <div class="trim-list">
      <label class="heading-toggle">
        <input
          :checked="includeTrimInHeading"
          type="checkbox"
          @change="emit('update:include-trim-in-heading', ($event.target as HTMLInputElement).checked)"
        />
        Include trim in vehicle heading
      </label>
      <TrimForm
        v-for="(trim, index) in trims"
        :key="trim.id"
        :trim="trim"
        :can-remove="trims.length > 1"
        @remove="removeTrim(trim.id)"
        @update:name="updateTrim(trim.id, { name: $event })"
        @update:base-price="updateTrim(trim.id, { basePrice: $event })"
      >
        <template #default>Trim {{ index + 1 }}</template>
      </TrimForm>
    </div>
  </section>
</template>

<style scoped>
.price-form {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
}

.price-form-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: #6a6258;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h4 {
  margin: 0;
  font-size: 1rem;
}

.add-button {
  padding: 0.6rem 0.8rem;
  border: 0;
  border-radius: 0.45rem;
  background: #202124;
  color: #fffdf9;
  cursor: pointer;
  font: inherit;
}

.trim-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 300px));
  gap: 0.75rem;
}

.heading-toggle {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6a6258;
  font-size: 0.9rem;
}

.heading-toggle input {
  width: auto;
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

@media (max-width: 640px) {
  .trim-list {
    grid-template-columns: minmax(0, 1fr);
  }
}

</style>
