<script setup lang="ts">
import { computed } from 'vue'
import SpecFieldForm from './SpecFieldForm.vue'
import type { SpecField } from '../types/vehicle'

interface ChargingFieldDefinition {
  id: string
  label: string
  placeholder: string
}

const definitions: ChargingFieldDefinition[] = [
  { id: 'battery-pack', label: 'Battery Pack', placeholder: 'e.g. 84 kWh lithium-ion' },
  { id: 'onboard-charger', label: 'Onboard Charger', placeholder: 'e.g. 11 kW' },
  {
    id: 'peak-charge-rate',
    label: 'Peak Charge Rate, AC/DC',
    placeholder: 'e.g. 11/250 kW',
  },
  { id: 'observed-mpge', label: 'Observed MPGe', placeholder: 'e.g. 93' },
  {
    id: 'highway-range',
    label: '75-mph Highway Range',
    placeholder: 'e.g. 250 miles',
  },
  {
    id: 'average-dc-rate',
    label: 'Average DC Fast-Charge Rate, 10–90%',
    placeholder: 'e.g. 145 kW',
  },
  {
    id: 'dc-charge-time',
    label: 'DC Fast-Charge Time, 10–90%',
    placeholder: 'e.g. 30 minutes',
  },
]

const props = defineProps<{
  fields: SpecField[]
}>()

const emit = defineEmits<{
  'update:fields': [fields: SpecField[]]
}>()

const getId = (definition: ChargingFieldDefinition) => `charging-${definition.id}`

const findField = (definition: ChargingFieldDefinition) =>
  props.fields.find((field) => field.id === getId(definition) || field.label === definition.label)

const isChargingField = (field: SpecField) =>
  field.id.startsWith('charging-') ||
  definitions.some((definition) => field.label === definition.label)

const additionalFields = computed(() => props.fields.filter((field) => !isChargingField(field)))

const updateChargingField = (definition: ChargingFieldDefinition, value: string) => {
  const existingField = findField(definition)

  const remainingFields = props.fields.filter(
    (field) => field.id !== existingField?.id && field.label !== definition.label,
  )

  if (!value.trim()) {
    emit('update:fields', remainingFields)
    return
  }

  emit('update:fields', [
    ...remainingFields,
    {
      id: getId(definition),
      label: definition.label,
      value,
      ...(existingField?.qualifier ? { qualifier: existingField.qualifier } : {}),
    },
  ])
}

const updateAdditionalFields = (fields: SpecField[]) => {
  emit('update:fields', [...props.fields.filter(isChargingField), ...fields])
}
</script>

<template>
  <section class="charging-editor" aria-labelledby="charging-heading">
    <div>
      <p class="eyebrow">Electric vehicle</p>
      <h4 id="charging-heading">Charging and EV fuel-economy fields</h4>
    </div>

    <div class="charging-fields">
      <label v-for="definition in definitions" :key="definition.id">
        {{ definition.label }}
        <input
          :value="findField(definition)?.value ?? ''"
          type="text"
          :placeholder="definition.placeholder"
          @input="updateChargingField(definition, ($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <SpecFieldForm
      section-label="Additional fuel-economy fields"
      :fields="additionalFields"
      @update:fields="updateAdditionalFields"
    />
  </section>
</template>

<style scoped>
.charging-editor {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
  background: #fffdf9;
}

.eyebrow {
  margin: 0 0 0.35rem;
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

.charging-fields {
  display: grid;
  gap: 1rem;
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
</style>
