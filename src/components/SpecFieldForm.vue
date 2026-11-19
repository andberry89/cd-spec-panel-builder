<script setup lang="ts">
import type { SpecField } from '../types/vehicle'
import type { PanelType } from '../types/panel'

const props = defineProps<{
  sectionLabel: string
  panelType: PanelType
  fields: SpecField[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: SpecField[]]
}>()

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
  <section class="field-editor" :aria-label="`${sectionLabel} fields`">
    <p v-if="fields.length === 0" class="empty-text">No fields are available in this section.</p>

    <div v-else class="field-list">
      <div v-for="field in fields" :key="field.id" class="field-row">
        <label>
          <span>{{ displayFieldLabel(field) }}<small v-if="field.unit"> · {{ field.unit }}</small></span>
          <input
            :value="field.value"
            type="text"
            :placeholder="field.id === 'tire-size' ? 'Front / rear (separate with  /  )' : field.unit ? `Enter value (${field.unit})` : 'Enter value'"
            @input="
              updateField(field.id, {
                value: ($event.target as HTMLInputElement).value,
              })
            "
          />
        </label>

        <fieldset class="qualifier-control">
          <legend class="qualifier-label">Qualifier for {{ displayFieldLabel(field) }}</legend>

          <div class="qualifier-options" role="radiogroup" :aria-label="`Qualifier for ${displayFieldLabel(field)}`">
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
        </fieldset>
      </div>
    </div>
  </section>
</template>

<style scoped>
.field-editor {
  display: grid;
  gap: 0.5rem;
}

.field-list {
  display: grid;
  gap: 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) auto;
  min-width: 0;
  align-items: center;
  gap: 0.8rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid #ecece7;
}

label {
  display: grid;
  grid-template-columns: minmax(115px, 0.7fr) minmax(130px, 1fr);
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  color: #343530;
  font-size: 0.85rem;
  font-weight: 550;
}

small {
  color: #777970;
  font-weight: 400;
}

input {
  width: 100%;
  min-height: 2.2rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #b8b8b2;
  border-radius: 0.25rem;
  background: #fff;
  color: #20211f;
  font: inherit;
}

.empty-text {
  margin: 0;
  color: #6a6258;
}

.qualifier-control {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
}

.qualifier-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.qualifier-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.qualifier-option {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #55574f;
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
}

.qualifier-option input {
  width: auto;
  margin: 0;
  accent-color: #315443;
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }

  label {
    grid-template-columns: 105px minmax(0, 1fr);
  }

  .qualifier-control {
    padding-left: 105px;
  }

}
</style>
