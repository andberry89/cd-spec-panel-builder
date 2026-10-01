<script setup lang="ts">
import { computed } from 'vue'
import type { SectionKey, SpecField } from '../types/vehicle'
import type { PanelType } from '../types/panel'

const props = defineProps<{
  sectionLabel: string
  sectionKey: SectionKey
  panelType: PanelType
  fields: SpecField[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: SpecField[]]
}>()

const headingId = computed(
  () => `section-fields-${props.sectionLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
)

const updateField = (fieldId: string, changes: Partial<SpecField>) => {
  emit(
    'update:fields',
    props.fields.map((field) => (field.id === fieldId ? { ...field, ...changes } : field)),
  )
}

const updateQualifier = (fieldId: string, qualifier: string | undefined) => {
  updateField(fieldId, { qualifier })
}

const displayFieldLabel = (field: SpecField) => {
  if (field.id === 'base-price' && props.panelType === 'testedSpecs') return 'Base/As Tested'
  if (field.id === 'base-price') return 'Base'
  return field.label
}
</script>

<template>
  <section class="field-editor" :aria-labelledby="headingId">
    <div class="field-heading">
      <h4 :id="headingId">{{ sectionLabel }}</h4>

    </div>

    <p v-if="fields.length === 0" class="empty-text">No fields are available in this section.</p>

    <div v-else class="field-list">
      <fieldset v-for="field in fields" :key="field.id" class="field-row">
        <legend>{{ displayFieldLabel(field) }}</legend>

        <label>
          Value
          <input
            :value="field.value"
            type="text"
            :placeholder="field.unit ? `Enter value (${field.unit})` : 'Enter value'"
            @input="
              updateField(field.id, {
                value: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </label>

        <div class="qualifier-control">
          <span class="qualifier-label">Qualifier</span>

          <div class="qualifier-options" role="radiogroup" aria-label="Qualifier">
            <label class="qualifier-option">
              <input
                :name="`qualifier-${field.id}`"
                type="radio"
                value=""
                :checked="!field.qualifier"
                @change="updateQualifier(field.id, undefined)"
              />
              <span>None</span>
            </label>

            <label class="qualifier-option">
              <input
                :name="`qualifier-${field.id}`"
                type="radio"
                value="C/D est"
                :checked="field.qualifier === 'C/D est'"
                @change="updateQualifier(field.id, 'C/D est')"
              />
              <span><em>C/D</em> est</span>
            </label>

            <label class="qualifier-option">
              <input
                :name="`qualifier-${field.id}`"
                type="radio"
                value="gov ltd"
                :checked="field.qualifier === 'gov ltd'"
                @change="updateQualifier(field.id, 'gov ltd')"
              />
              <span>gov ltd</span>
            </label>
          </div>
        </div>
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
  grid-template-columns: minmax(0, 1fr) minmax(180px, 1fr);
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

.empty-text {
  margin: 0;
  color: #6a6258;
}

.qualifier-control {
  display: grid;
  align-content: end;
  gap: 0.4rem;
}

.qualifier-label {
  color: #6a6258;
  font-size: 0.85rem;
  font-weight: 700;
}

.qualifier-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.qualifier-option {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: #202124;
  font-size: 0.8rem;
  font-weight: 400;
  cursor: pointer;
}

.qualifier-option input {
  width: auto;
  margin: 0;
  accent-color: #202124;
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
