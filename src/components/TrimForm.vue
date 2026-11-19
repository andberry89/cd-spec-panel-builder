<script setup lang="ts">
import type { PriceValue, SpecField, Trim } from '../types/vehicle'

const props = defineProps<{
  trim: Trim
  canRemove: boolean
}>()

const emit = defineEmits<{
  remove: []
  'update:name': [name: string]
  'update:base-price': [price: PriceValue]
  'update:fields': [fields: SpecField[]]
}>()

const updateBasePrice = (changes: Partial<PriceValue>) => {
  emit('update:base-price', { ...props.trim.basePrice, ...changes })
}

const updateField = (fieldId: string, changes: Partial<SpecField>) => {
  emit(
    'update:fields',
    props.trim.fields.map((field) => (field.id === fieldId ? { ...field, ...changes } : field)),
  )
}

const addField = () => {
  emit('update:fields', [
    ...props.trim.fields,
    {
      id: `trim-field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: '',
      value: '',
    },
  ])
}

const removeField = (fieldId: string) => {
  emit('update:fields', props.trim.fields.filter((field) => field.id !== fieldId))
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

    <div class="trim-specs">
      <div class="trim-specs-heading">
        <span>Trim-specific details</span>
        <button type="button" class="add-field-button" @click="addField">Add detail</button>
      </div>
      <div v-for="field in trim.fields" :key="field.id" class="trim-spec-row">
        <label>
          Label
          <input
            :value="field.label"
            type="text"
            placeholder="e.g. Options"
            @input="updateField(field.id, { label: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label>
          Value
          <input
            :value="field.value"
            type="text"
            placeholder="Enter a value, range, or alternatives"
            @input="updateField(field.id, { value: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <button
          type="button"
          class="remove-field-button"
          :aria-label="`Remove ${field.label || 'trim detail'}`"
          @click="removeField(field.id)"
        >
          Remove
        </button>
      </div>
      <p v-if="trim.fields.length === 0" class="trim-specs-empty">
        Add details that apply only to this trim.
      </p>
    </div>

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

.trim-specs {
  grid-column: 1 / -1;
  display: grid;
  gap: 0.4rem;
  padding: 0.55rem 0;
}

.trim-specs-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #55574f;
  font-size: 0.8rem;
  font-weight: 650;
}

.trim-spec-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.65fr) minmax(180px, 1fr) auto;
  align-items: end;
  gap: 0.6rem;
}

.add-field-button,
.remove-field-button {
  min-height: 2rem;
  padding: 0.3rem 0.55rem;
  border: 1px solid #b8b9b1;
  border-radius: 0.25rem;
  background: transparent;
  color: #315443;
  font: inherit;
  font-size: 0.76rem;
  cursor: pointer;
}

.remove-field-button {
  color: #873e36;
}

.trim-specs-empty {
  margin: 0;
  color: #777970;
  font-size: 0.76rem;
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

  .trim-spec-row {
    grid-template-columns: 1fr;
  }
}

</style>
