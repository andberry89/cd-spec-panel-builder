<script setup lang="ts">
import { computed } from 'vue'
import type { SpecField } from '../types/vehicle'

const props = defineProps<{
  sectionLabel: string
  fields: SpecField[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: SpecField[]]
}>()

const headingId = computed(
  () => `section-fields-${props.sectionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
)

const createField = (): SpecField => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  label: '',
  value: '',
})

const addField = () => {
  emit('update:fields', [...props.fields, createField()])
}

const updateField = (fieldId: string, changes: Partial<SpecField>) => {
  emit(
    'update:fields',
    props.fields.map((field) => (field.id === fieldId ? { ...field, ...changes } : field)),
  )
}

const removeField = (fieldId: string) => {
  emit(
    'update:fields',
    props.fields.filter((field) => field.id !== fieldId),
  )
}
</script>

<template>
  <section class="field-editor" :aria-labelledby="headingId">
    <div class="field-heading">
      <h4 :id="headingId">{{ sectionLabel }}</h4>

      <button type="button" class="add-field-button" @click="addField">Add field</button>
    </div>

    <p v-if="fields.length === 0" class="empty-text">Add a structured field for this section.</p>

    <div v-else class="field-list">
      <fieldset v-for="(field, index) in fields" :key="field.id" class="field-row">
        <legend>Field {{ index + 1 }}</legend>

        <label>
          Label
          <input
            :value="field.label"
            type="text"
            placeholder="e.g. Base price"
            @input="
              updateField(field.id, {
                label: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </label>

        <label>
          Value
          <input
            :value="field.value"
            type="text"
            placeholder="e.g. $42,500"
            @input="
              updateField(field.id, {
                value: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </label>

        <label>
          Unit
          <input
            :value="field.unit ?? ''"
            type="text"
            placeholder="e.g. hp"
            @input="
              updateField(field.id, {
                unit: ($event.target as HTMLInputElement).value || undefined,
              })
            "
          />
        </label>

        <button type="button" class="remove-field-button" @click="removeField(field.id)">
          Remove
        </button>
      </fieldset>
    </div>
  </section>
</template>

<style scoped>
.field-editor {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
  background: #fffdf9;
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

h4 {
  margin: 0;
  font-size: 1rem;
}

.field-list {
  display: grid;
  gap: 1rem;
}

.field-row {
  display: grid;
  grid-template-columns:
    minmax(0, 1.2fr)
    minmax(0, 1.2fr)
    minmax(120px, 0.6fr)
    auto;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid #c8beb1;
  border-radius: 0.5rem;
}

legend {
  padding: 0 0.35rem;
  color: #6a6258;
  font-size: 0.8rem;
  font-weight: 700;
}

label {
  display: grid;
  gap: 0.4rem;
  color: #6a6258;
  font-size: 0.85rem;
  font-weight: 700;
}

input {
  width: 100%;
  padding: 0.65rem;
  border: 1px solid #c8beb1;
  border-radius: 0.4rem;
  background: #fffdf9;
  color: #202124;
  font: inherit;
}

.add-field-button,
.remove-field-button {
  align-self: end;
  padding: 0.6rem 0.8rem;
  border-radius: 0.45rem;
  font: inherit;
  cursor: pointer;
}

.add-field-button {
  border: 0;
  background: #202124;
  color: #fffdf9;
}

.remove-field-button {
  border: 1px solid #c8beb1;
  background: transparent;
  color: #6a6258;
}

.empty-text {
  margin: 0;
  color: #6a6258;
}

@media (max-width: 640px) {
  .field-heading {
    align-items: start;
    flex-direction: column;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .remove-field-button {
    justify-self: start;
  }
}
</style>
