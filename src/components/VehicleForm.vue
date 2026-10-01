<script setup lang="ts">
import SpecFieldForm from './SpecFieldForm.vue'
import VehicleTypeForm from './VehicleTypeForm.vue'
import PriceForm from './PriceForm.vue'
import { sectionLabels } from '../data/fieldCatalog'
import type { PowertrainType, PriceValue, SectionKey, SpecField, Vehicle, VehicleTypeSpec } from '../types/vehicle'
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

const updateBodyStylePrices = (bodyStylePrices: Record<string, PriceValue>) =>
  updateVehicle({ bodyStylePrices })

const updatePowertrain = (powertrainType: PowertrainType) => {
  updateVehicle({ powertrainType })
}

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

const hiddenField = (field: SpecField) => {
  const electricOnly = ['front-motor', 'rear-motor', 'battery-pack', 'onboard-charger', 'peak-charge-rate']
  const combustionOnly = ['engine-description', 'displacement', 'engine-power', 'engine-torque']
  if (props.modelValue.powertrainType === 'combustion' && electricOnly.includes(field.id)) return true
  if (props.modelValue.powertrainType === 'electric' && combustionOnly.includes(field.id)) return true
  if (field.id === 'epa-electricity' && props.modelValue.powertrainType !== 'hybrid') return true
  return false
}

const visibleFields = (sectionKey: SectionKey) =>
  props.modelValue.sections[sectionKey].fields.filter((field) => !hiddenField(field))

const updateVisibleFields = (sectionKey: SectionKey, fields: SpecField[]) => {
  const hidden = props.modelValue.sections[sectionKey].fields.filter(hiddenField)
  updateSectionFields(sectionKey, [...fields, ...hidden])
}

const displaySectionLabel = (key: SectionKey) => {
  if (key === 'testing' && props.panelType === 'firstDrive') return 'Performance (C/D est)'
  if (key === 'testing' && props.panelType === 'longTerm') return 'C/D Test Results: New'
  if (key === 'fuelEconomy' && props.modelValue.powertrainType === 'electric') {
    return 'Fuel Economy and Charging'
  }
  if (key === 'powertrain') return 'Engine / Powertrain'
  return sectionLabels[key]
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

    <VehicleTypeForm
      :model-value="modelValue.identity.vehicleType"
      @update:model-value="updateVehicleType"
    />

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

    <section class="sections-section" aria-labelledby="sections-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Output controls</p>
          <h3 id="sections-heading">Included sections</h3>
        </div>
      </div>

      <div class="section-controls" role="group" aria-labelledby="sections-heading">
        <label v-for="sectionKey in sectionKeys" :key="sectionKey" class="section-control">
          <input
            type="checkbox"
            :checked="modelValue.sections[sectionKey].enabled"
            @change="updateSectionEnabled(sectionKey, ($event.target as HTMLInputElement).checked)"
          />
          <span>{{ displaySectionLabel(sectionKey) }}</span>
        </label>
      </div>
    </section>
    <section class="fields-section" aria-labelledby="fields-heading">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Structured data</p>
          <h3 id="fields-heading">Specification fields</h3>
        </div>
      </div>

      <p v-if="sectionKeys.every((key) => !modelValue.sections[key].enabled)" class="empty-text">
        Enable a section above to add specification fields.
      </p>

      <div class="field-sections">
        <PriceForm
          v-if="panelType === 'firstDrive' && modelValue.sections.price.enabled"
          :trims="modelValue.trims"
          :body-styles="modelValue.identity.vehicleType.bodyStyles"
          :body-style-prices="modelValue.bodyStylePrices"
          :include-trim-in-heading="modelValue.identity.includeTrimInHeading"
          @update:trims="updateTrims"
          @update:body-style-prices="updateBodyStylePrices"
          @update:include-trim-in-heading="updateIncludeTrimInHeading"
        />

        <SpecFieldForm
          v-for="sectionKey in sectionKeys.filter((key) =>
            modelValue.sections[key].enabled && !(panelType === 'firstDrive' && key === 'price'),
          )"
          :key="sectionKey"
          :section-label="displaySectionLabel(sectionKey)"
          :section-key="sectionKey"
          :panel-type="panelType"
          :fields="visibleFields(sectionKey)"
          @update:fields="updateVisibleFields(sectionKey, $event)"
        />
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

.sections-section {
  display: grid;
  gap: 1rem;
}

.section-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.section-control {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem;
  border: 1px solid #c8beb1;
  border-radius: 0.45rem;
  background: #fffdf9;
  color: #202124;
  cursor: pointer;
}

.section-control input {
  width: auto;
  margin: 0;
  accent-color: #202124;
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

.empty-text {
  margin: 0;
  color: #6a6258;
}

.fields-section {
  display: grid;
  gap: 1rem;
}

.field-sections {
  display: grid;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: start;
    flex-direction: column;
  }

  .section-controls {
    grid-template-columns: 1fr;
  }
}
</style>
