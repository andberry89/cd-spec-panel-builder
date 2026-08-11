<script setup lang="ts">
import TrimForm from './TrimForm.vue'
import type { PowertrainType, Trim, Vehicle } from '../types/vehicle'

const props = defineProps<{
  modelValue: Vehicle
}>()

const emit = defineEmits<{
  'update:modelValue': [vehicle: Vehicle]
}>()

const updateVehicle = (changes: Partial<Vehicle>) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...changes,
  })
}

const updateIdentity = (field: keyof Vehicle['identity'], value: string) => {
  updateVehicle({
    identity: {
      ...props.modelValue.identity,
      [field]: value,
    },
  })
}

const createTrim = (): Trim => ({
  id: `trim-${Date.now()}`,
  name: '',
  fields: [],
})

const addTrim = () => {
  updateVehicle({
    trims: [...props.modelValue.trims, createTrim()],
  })
}

const removeTrim = (trimId: string) => {
  updateVehicle({
    trims: props.modelValue.trims.filter((trim) => trim.id !== trimId),
  })
}

const updateTrimName = (trimId: string, name: string) => {
  updateVehicle({
    trims: props.modelValue.trims.map((trim) => (trim.id === trimId ? { ...trim, name } : trim)),
  })
}

const updatePowertrain = (powertrainType: PowertrainType) => {
  updateVehicle({ powertrainType })
}
</script>

<template>
  <form class="vehicle-form" @submit.prevent>
    <div class="form-grid">
      <label>
        Year
        <input
          :value="modelValue.identity.year"
          type="text"
          inputmode="numeric"
          placeholder="2026"
          @input="updateIdentity('year', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label>
        Make
        <input
          :value="modelValue.identity.make"
          type="text"
          placeholder="Ford"
          @input="updateIdentity('make', ($event.target as HTMLInputElement).value)"
        />
      </label>

      <label>
        Model
        <input
          :value="modelValue.identity.model"
          type="text"
          placeholder="Mustang"
          @input="updateIdentity('model', ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <label>
      Powertrain
      <select
        :value="modelValue.powertrainType"
        @change="updatePowertrain(($event.target as HTMLSelectElement).value as PowertrainType)"
      >
        <option value="combustion">Combustion</option>
        <option value="hybrid">Hybrid</option>
        <option value="electric">Electric</option>
      </select>
    </label>

    <section class="trims-section" aria-labelledby="trims-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Configurations</p>
          <h3 id="trims-heading">Trims</h3>
        </div>

        <button type="button" class="add-button" @click="addTrim">Add trim</button>
      </div>

      <p v-if="modelValue.trims.length === 0" class="empty-text">
        Add at least one trim or configuration.
      </p>

      <div class="trim-list">
        <TrimForm
          v-for="(trim, index) in modelValue.trims"
          :key="trim.id"
          :trim="trim"
          :can-remove="modelValue.trims.length > 1"
          @remove="removeTrim(trim.id)"
          @update:name="updateTrimName(trim.id, $event)"
        >
          <template #default> Trim {{ index + 1 }} </template>
        </TrimForm>
      </div>
    </section>
  </form>
</template>

<style scoped>
.vehicle-form {
  display: grid;
  gap: 1.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

label {
  display: grid;
  gap: 0.4rem;
  color: #6a6258;
  font-size: 0.9rem;
  font-weight: 700;
}

input,
select {
  width: 100%;
  padding: 0.7rem;
  border: 1px solid #c8beb1;
  border-radius: 0.45rem;
  background: #fffdf9;
  color: #202124;
  font: inherit;
}

.trims-section {
  display: grid;
  gap: 1rem;
}

.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  color: #6a6258;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  font-size: 1.1rem;
}

.add-button {
  padding: 0.6rem 0.8rem;
  border: 0;
  border-radius: 0.45rem;
  background: #202124;
  color: #fffdf9;
  cursor: pointer;
}

.trim-list {
  display: grid;
  gap: 1rem;
}

.empty-text {
  margin: 0;
  color: #6a6258;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }
}
</style>
