<script setup lang="ts">
import EngineForm from './EngineForm.vue'
import type { ElectricMotor, EngineSpec, PowertrainVariant } from '../types/vehicle'

const props = defineProps<{ modelValue: PowertrainVariant[] }>()
const emit = defineEmits<{ 'update:modelValue': [variants: PowertrainVariant[]] }>()

const updateVariant = (id: string, changes: Partial<PowertrainVariant>) => {
  emit('update:modelValue', props.modelValue.map((variant) =>
    variant.id === id ? { ...variant, ...changes } : variant,
  ))
}

const engineSpec = (variant: PowertrainVariant): EngineSpec => ({
  mode: 'single',
  engines: [variant.engine],
})

const updateEngine = (variant: PowertrainVariant, value: EngineSpec) => {
  const engine = value.engines[0]
  if (engine) updateVariant(variant.id, { engine })
}

const updateMotor = <K extends keyof ElectricMotor>(variant: PowertrainVariant, index: number, key: K, value: ElectricMotor[K]) => {
  const motors = [...variant.motors] as [ElectricMotor, ElectricMotor]
  const motor = motors[index]
  if (!motor) return
  motors[index] = { ...motor, [key]: value }
  updateVariant(variant.id, { motors })
}

const createVariant = (): PowertrainVariant => ({
  id: crypto.randomUUID(),
  type: 'combustion',
  plugInHybrid: false,
  engine: {
    id: crypto.randomUUID(),
    forcedInduction: [],
    intercooled: false,
    valvetrain: '',
    valves: '',
    descriptors: [],
    layout: '',
    cylinders: '',
    blockMaterial: '',
    headMaterial: '',
    pluralHeads: true,
    fuelInjection: '',
    displacementIn3: '',
    displacementCm3: '',
    displacementLiters: '',
    power: '',
    powerRpm: '',
    torque: '',
    torqueRpm: '',
  },
  motors: [
    { type: '', power: '', torque: '', powerRpm: '', torqueRpm: '' },
    { type: '', power: '', torque: '', powerRpm: '', torqueRpm: '' },
  ],
  motorCount: 2,
  motorCurrent: 'AC',
  combinedPower: '',
  combinedTorque: '',
  batteryChemistry: '',
  batteryCooling: '',
  batteryCapacity: '',
  peakChargeAC: '',
  peakChargeDC: '',
})

const addVariant = () => emit('update:modelValue', [...props.modelValue, createVariant()])
const removeVariant = (id: string) => emit('update:modelValue', props.modelValue.filter((item) => item.id !== id))
const moveVariant = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= props.modelValue.length) return
  const variants = [...props.modelValue]
  const current = variants[index]
  const next = variants[target]
  if (!current || !next) return
  variants[index] = next
  variants[target] = current
  emit('update:modelValue', variants)
}

const text = (event: Event) => (event.target as HTMLInputElement).value
const usesPowertrainEngineFormat = () => props.modelValue.length > 1
  || props.modelValue.some((variant) => variant.type !== 'combustion')
</script>

<template>
  <section class="variants-form" aria-labelledby="variants-heading">
    <div class="variants-header">
      <h4 id="variants-heading">Engine / powertrain options</h4>
      <button type="button" class="add-button" @click="addVariant">Add engine / powertrain</button>
    </div>

    <fieldset v-for="(variant, index) in modelValue" :key="variant.id" class="variant-entry">
      <legend>{{ variant.type === 'combustion' ? `Engine ${index + 1}` : `Powertrain ${index + 1}` }}</legend>
      <label>
        System type
        <select :value="variant.type" @change="updateVariant(variant.id, { type: text($event) as PowertrainVariant['type'] })">
          <option value="combustion">Combustion engine</option>
          <option value="hybrid">Hybrid</option>
          <option value="electric">EV</option>
        </select>
      </label>

      <EngineForm v-if="variant.type !== 'electric'"
        :model-value="engineSpec(variant)"
        :powertrain-type="variant.type === 'combustion' && !usesPowertrainEngineFormat() ? 'combustion' : 'combined'"
        :show-mode-selector="false"
        @update:model-value="updateEngine(variant, $event)"
      />

      <template v-if="variant.type !== 'combustion'">
        <div class="variant-grid">
          <label>
            Number of electric motors
            <select :value="variant.motorCount" @change="updateVariant(variant.id, { motorCount: Number(text($event)) as 1 | 2 })">
              <option :value="1">1</option>
              <option :value="2">2</option>
            </select>
          </label>
          <label>
            Motor current
            <select :value="variant.motorCurrent" @change="updateVariant(variant.id, { motorCurrent: text($event) as 'AC' | 'DC' })">
              <option value="AC">AC</option>
              <option value="DC">DC</option>
            </select>
          </label>
        </div>

        <div class="motor-grid">
          <fieldset v-for="motorIndex in variant.motorCount" :key="motorIndex" class="motor-entry">
            <legend>{{ variant.motorCount === 1 ? 'Electric motor' : `Motor ${motorIndex}` }}</legend>
            <div class="variant-grid">
              <label v-if="variant.type === 'electric'">
                Motor type
                <select :value="variant.motors[motorIndex - 1]?.type" @change="updateMotor(variant, motorIndex - 1, 'type', text($event) as ElectricMotor['type'])">
                  <option value="">Select</option>
                  <option value="permanent-magnet synchronous AC">Permanent-magnet synchronous AC</option>
                  <option value="current-excited synchronous AC">Current-excited synchronous AC</option>
                  <option value="induction AC">Induction AC</option>
                  <option value="DC">DC</option>
                </select>
              </label>
              <label>
                Power (hp)
                <input :value="variant.motors[motorIndex - 1]?.power" inputmode="numeric" @input="updateMotor(variant, motorIndex - 1, 'power', text($event))" />
              </label>
              <label>
                Torque (lb-ft)
                <input :value="variant.motors[motorIndex - 1]?.torque" inputmode="numeric" @input="updateMotor(variant, motorIndex - 1, 'torque', text($event))" />
              </label>
            </div>
          </fieldset>
        </div>

        <fieldset class="system-output">
          <legend>Combined system output (if provided)</legend>
          <div class="variant-grid">
            <label>
              Total power (hp)
              <input :value="variant.combinedPower" inputmode="numeric" placeholder="232" @input="updateVariant(variant.id, { combinedPower: text($event) })" />
            </label>
            <label>
              Total torque (lb-ft)
              <input :value="variant.combinedTorque" inputmode="numeric" placeholder="271" @input="updateVariant(variant.id, { combinedTorque: text($event) })" />
            </label>
          </div>
        </fieldset>

        <div class="variant-grid">
          <label v-if="variant.type === 'hybrid'" class="check-option">
            <input :checked="variant.plugInHybrid" type="checkbox" @change="updateVariant(variant.id, { plugInHybrid: ($event.target as HTMLInputElement).checked })" />
            Plug-in hybrid
          </label>
          <label v-if="variant.type === 'electric'">
            Battery cooling
            <select :value="variant.batteryCooling" @change="updateVariant(variant.id, { batteryCooling: text($event) as PowertrainVariant['batteryCooling'] })">
              <option value="">Select</option>
              <option value="air">Air-cooled</option>
              <option value="liquid">Liquid-cooled</option>
            </select>
          </label>
          <label>
            Battery chemistry
            <select :value="variant.batteryChemistry" @change="updateVariant(variant.id, { batteryChemistry: text($event) as PowertrainVariant['batteryChemistry'] })">
              <option value="">Select</option>
              <option value="lithium-ion">Lithium-ion</option>
              <option value="nickel-metal hydride">Nickel-metal hydride</option>
            </select>
          </label>
          <template v-if="variant.type === 'electric' || variant.plugInHybrid">
            <label>
              Battery capacity (kWh)
              <input :value="variant.batteryCapacity" inputmode="decimal" @input="updateVariant(variant.id, { batteryCapacity: text($event) })" />
            </label>
            <label>
              Peak charge rate, AC (kW)
              <input :value="variant.peakChargeAC" inputmode="decimal" @input="updateVariant(variant.id, { peakChargeAC: text($event) })" />
            </label>
            <label>
              Peak charge rate, DC (kW)
              <input :value="variant.peakChargeDC" inputmode="decimal" @input="updateVariant(variant.id, { peakChargeDC: text($event) })" />
            </label>
          </template>
        </div>
      </template>

      <div class="variant-actions">
        <button type="button" :disabled="index === 0" @click="moveVariant(index, -1)">Move up</button>
        <button type="button" :disabled="index === modelValue.length - 1" @click="moveVariant(index, 1)">Move down</button>
        <button v-if="modelValue.length > 1" type="button" class="remove-button" @click="removeVariant(variant.id)">Remove option</button>
      </div>
    </fieldset>
    <p class="help-text">All combustion entries output under ENGINES. If any entry is hybrid or EV, the heading is POWERTRAINS. Entries and the shared transmission output in this order.</p>
  </section>
</template>

<style scoped>
.variants-form { display: grid; gap: 1rem; }
.variants-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
h4 { margin: 0; }
.variant-entry, .motor-entry, .system-output { display: grid; gap: 1rem; padding: 1rem; border: 1px solid #c8beb1; border-radius: 0.5rem; }
.check-option { display: flex; align-items: center; gap: 0.5rem; }
.check-option input { width: auto; }
.variant-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.motor-grid { display: grid; gap: 0.75rem; }
label { display: grid; gap: 0.4rem; color: #6a6258; font-size: 0.85rem; font-weight: 700; }
input, select { width: 100%; padding: 0.65rem; border: 1px solid #c8beb1; border-radius: 0.4rem; background: #fffdf9; color: #202124; font: inherit; }
.variant-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.variant-actions button, .add-button { padding: 0.5rem 0.75rem; border: 1px solid #c8beb1; border-radius: 0.4rem; background: #fffdf9; cursor: pointer; font: inherit; }
.variant-actions button:disabled { opacity: 0.5; cursor: default; }
.variant-actions .remove-button { border-color: #8f3328; color: #8f3328; }
.add-button { border-color: #536246; background: #f5f7f0; color: #34402b; }
.help-text { margin: 0; color: #6a6258; font-size: 0.85rem; }
@media (max-width: 640px) { .variants-header { align-items: stretch; flex-direction: column; } .variant-grid { grid-template-columns: 1fr; } }
</style>
