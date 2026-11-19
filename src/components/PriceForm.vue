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
  <section class="price-form" aria-label="Base price by trim">
    <div class="price-form-heading">
      <div>
        <h4>
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
        :trim-index="index + 1"
        :can-remove="trims.length > 1"
        @remove="removeTrim(trim.id)"
        @update:name="updateTrim(trim.id, { name: $event })"
        @update:base-price="updateTrim(trim.id, { basePrice: $event })"
        @update:fields="updateTrim(trim.id, { fields: $event })"
      />
    </div>
  </section>
</template>

<style scoped>
.price-form {
  display: grid;
  gap: 0.65rem;
}

.price-form-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h4 {
  margin: 0;
  font-size: 1rem;
}

.add-button {
  min-height: 2.25rem;
  padding: 0.4rem 0.7rem;
  border: 1px solid #aeb5ac;
  border-radius: 0.25rem;
  background: transparent;
  color: #315443;
  cursor: pointer;
  font: inherit;
}

.trim-list {
  display: grid;
  gap: 0;
}

.heading-toggle {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #55574f;
  font-size: 0.82rem;
}

.heading-toggle input {
  width: auto;
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

</style>
