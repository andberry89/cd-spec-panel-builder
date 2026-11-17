<script setup lang="ts">
import SpecFieldForm from './SpecFieldForm.vue'
import VehicleTypeForm from './VehicleTypeForm.vue'
import PriceForm from './PriceForm.vue'
import CombinedPowertrainsForm from './CombinedPowertrainsForm.vue'
import { sectionLabels } from '../data/fieldCatalog'
import type { PowertrainVariant, SectionKey, SpecField, Vehicle, VehicleTypeSpec } from '../types/vehicle'
import type { PanelType } from '../types/panel'

const props = defineProps<{
  modelValue: Vehicle
  panelType: PanelType
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

const updateIdentity = (field: 'year' | 'make' | 'model', value: string) => {
  updateVehicle({
    identity: {
      ...props.modelValue.identity,
      [field]: value,
    },
  })
}

const updateVehicleType = (vehicleType: VehicleTypeSpec) => {
  updateVehicle({ identity: { ...props.modelValue.identity, vehicleType } })
}

const updateIncludeTrimInHeading = (includeTrimInHeading: boolean) => {
  updateVehicle({ identity: { ...props.modelValue.identity, includeTrimInHeading } })
}

const updateTrims = (trims: Vehicle['trims']) => updateVehicle({ trims })

const updatePowertrainVariants = (powertrainVariants: PowertrainVariant[]) =>
  updateVehicle({ powertrainVariants })

const sectionKeys: SectionKey[] = [
  'price',
  'powertrain',
  'transmission',
  'chassis',
  'dimensions',
  'testing',
  'interiorSound',
  'fuelEconomy',
]

const updateSectionEnabled = (sectionKey: SectionKey, enabled: boolean) => {
  updateVehicle({
    sections: {
      ...props.modelValue.sections,
      [sectionKey]: {
        ...props.modelValue.sections[sectionKey],
        enabled,
      },
    },
  })
}

const updateSectionFields = (sectionKey: SectionKey, fields: SpecField[]) => {
  updateVehicle({
    sections: {
      ...props.modelValue.sections,
      [sectionKey]: {
        ...props.modelValue.sections[sectionKey],
        fields,
      },
    },
  })
}

const visibleFields = (sectionKey: SectionKey) => props.modelValue.sections[sectionKey].fields

const updateVisibleFields = (sectionKey: SectionKey, fields: SpecField[]) => {
  updateSectionFields(sectionKey, fields)
}

const displaySectionLabel = (key: SectionKey) => {
  if (key === 'testing' && props.panelType === 'firstDrive') return 'Performance (C/D est)'
  if (key === 'testing' && props.panelType === 'longTerm') return 'C/D Test Results: New'
  if (key === 'fuelEconomy' && props.modelValue.powertrainVariants.some((variant) => variant.type === 'electric')) {
    return 'Fuel Economy and Charging'
  }
  if (key === 'powertrain') {
    return props.modelValue.powertrainVariants.some((variant) => variant.type !== 'combustion')
      ? 'Powertrains'
      : 'Engines'
  }
  if (key === 'transmission' && props.modelValue.powertrainVariants.some((variant) => variant.type !== 'combustion')) return 'Transmission(s)'
  return sectionLabels[key]
}
</script>

<template>
  <form class="vehicle-form" @submit.prevent>
    <section class="identity-section" aria-label="Vehicle identity">
      <div class="identity-grid">
        <label>
          Year
          <input :value="modelValue.identity.year" type="text" inputmode="numeric" placeholder="2026" @input="updateIdentity('year', ($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          Make
          <input :value="modelValue.identity.make" type="text" placeholder="Porsche" @input="updateIdentity('make', ($event.target as HTMLInputElement).value)" />
        </label>
        <label>
          Model
          <input :value="modelValue.identity.model" type="text" placeholder="Macan" @input="updateIdentity('model', ($event.target as HTMLInputElement).value)" />
        </label>
      </div>
      <details class="vehicle-type-details">
        <summary>Vehicle type details</summary>
        <VehicleTypeForm :model-value="modelValue.identity.vehicleType" @update:model-value="updateVehicleType" />
      </details>
    </section>

    <section class="fields-section" aria-label="Vehicle specification sections">
      <details v-for="sectionKey in sectionKeys" :key="sectionKey" class="section-editor" :open="sectionKey === 'powertrain' || sectionKey === 'price'">
        <summary>
          <input
            type="checkbox"
            :checked="modelValue.sections[sectionKey].enabled"
            aria-label="Include section"
            @click.stop
            @change="updateSectionEnabled(sectionKey, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ displaySectionLabel(sectionKey) }}</span>
        </summary>

        <div v-if="modelValue.sections[sectionKey].enabled" class="section-editor-content">
          <PriceForm
            v-if="sectionKey === 'price' && panelType === 'firstDrive'"
            :trims="modelValue.trims"
            :include-trim-in-heading="modelValue.identity.includeTrimInHeading"
            @update:trims="updateTrims"
            @update:include-trim-in-heading="updateIncludeTrimInHeading"
          />
          <CombinedPowertrainsForm
            v-else-if="sectionKey === 'powertrain'"
            :model-value="modelValue.powertrainVariants"
            @update:model-value="updatePowertrainVariants"
          />
          <SpecFieldForm
            v-else
            :section-label="displaySectionLabel(sectionKey)"
            :panel-type="panelType"
            :fields="visibleFields(sectionKey)"
            @update:fields="updateVisibleFields(sectionKey, $event)"
          />
        </div>
      </details>
    </section>
  </form>
</template>

<style scoped>
.vehicle-form {
  display: grid;
  gap: 1rem;
}

.identity-section {
  display: grid;
  gap: 0.75rem;
}

.identity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(110px, 1fr));
  gap: 0.75rem;
}

label {
  display: grid;
  gap: 0.4rem;
  color: #6a6258;
  font-size: 0.9rem;
  font-weight: 700;
}

input:not([type="checkbox"]),
select {
  width: 100%;
  min-height: 2.4rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid #b8b8b2;
  border-radius: 0.25rem;
  background: #fff;
  color: #20211f;
  font: inherit;
}

.vehicle-type-details,
.section-editor {
  border-bottom: 1px solid #deded8;
}

.vehicle-type-details > summary,
.section-editor > summary {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.75rem;
  color: #262724;
  font-size: 0.92rem;
  font-weight: 650;
  cursor: pointer;
  list-style-position: outside;
}

.section-editor > summary input[type="checkbox"] {
  accent-color: #315443;
}

.section-editor-content {
  padding: 0.15rem 0 1rem 1.25rem;
}

.vehicle-type-details > .vehicle-type-form {
  margin: 0.25rem 0 0.75rem;
}

.fields-section {
  display: grid;
  gap: 0;
}

@media (max-width: 640px) {
  .identity-grid {
    grid-template-columns: 1fr;
  }
}
</style>
