<script setup lang="ts">
import type { EngineEntry } from '../types/vehicle'

const props = defineProps<{
  modelValue: EngineEntry
  format: 'classic' | 'powertrain'
}>()
const emit = defineEmits<{ 'update:modelValue': [engine: EngineEntry] }>()
type ForcedInduction = EngineEntry['forcedInduction'][number]
const forcedInductionOptions: ForcedInduction[] = ['twin-turbocharged', 'turbocharged', 'supercharged']

const updateEntry = <K extends keyof EngineEntry>(key: K, value: EngineEntry[K]) =>
  emit('update:modelValue', { ...props.modelValue, [key]: value })

const updateDescriptor = (descriptor: string, checked: boolean) => {
  const current = props.modelValue.descriptors
  const descriptors = checked
    ? [...current, descriptor]
    : current.filter((item) => item !== descriptor)
  updateEntry('descriptors', descriptors)
}

const updateForcedInduction = (option: ForcedInduction, isChecked: boolean) => {
  const current = props.modelValue.forcedInduction
  const forcedInduction = isChecked
    ? [...current, option]
    : current.filter((item) => item !== option)
  updateEntry('forcedInduction', forcedInduction)
}

const text = (event: Event) => (event.target as HTMLInputElement).value
const checked = (event: Event) => (event.target as HTMLInputElement).checked
const usesLiterFormat = () => props.format === 'powertrain'
</script>

<template>
  <section class="engine-form">
    <fieldset class="engine-entry">
      <legend class="visually-hidden">Engine details</legend>

      <div class="engine-grid">
        <fieldset class="forced-induction-options">
          <legend>Forced induction</legend>
          <label v-for="option in forcedInductionOptions" :key="option" class="check-option">
            <input
              type="checkbox"
              :checked="modelValue.forcedInduction.includes(option)"
              @change="updateForcedInduction(option, checked($event))"
            />
            {{ option }}
          </label>
          <label class="check-option">
            <input
              type="checkbox"
              :checked="modelValue.intercooled"
              :disabled="modelValue.forcedInduction.length === 0"
              @change="updateEntry('intercooled', checked($event))"
            />
            Intercooled
          </label>
        </fieldset>

        <label>
          Valvetrain
          <select :value="modelValue.valvetrain" @change="updateEntry('valvetrain', text($event) as EngineEntry['valvetrain'])">
            <option value="">Select</option>
            <option value="DOHC">DOHC</option>
            <option value="SOHC">SOHC</option>
            <option value="pushrod">Pushrod</option>
          </select>
        </label>

        <label>
          Number of valves
          <input :value="modelValue.valves" type="text" inputmode="numeric" placeholder="32" @input="updateEntry('valves', text($event))" />
        </label>

        <label>
          Cylinder layout
          <select :value="modelValue.layout" @change="updateEntry('layout', text($event) as EngineEntry['layout'])">
            <option value="">Select</option>
            <option value="V">V</option>
            <option value="inline">Inline</option>
            <option value="flat">Flat</option>
            <option value="W">W</option>
          </select>
        </label>

        <label>
          Number of cylinders
          <input :value="modelValue.cylinders" type="text" inputmode="numeric" placeholder="8" @input="updateEntry('cylinders', text($event))" />
        </label>

        <label v-if="!usesLiterFormat()">
          Block material
          <select :value="modelValue.blockMaterial" @change="updateEntry('blockMaterial', text($event) as EngineEntry['blockMaterial'])">
            <option value="">Select</option>
            <option value="iron">Iron</option>
            <option value="aluminum">Aluminum</option>
            <option value="aluminum-and-magnesium">Aluminum and magnesium</option>
            <option value="iron-and-aluminum">Iron and aluminum</option>
          </select>
        </label>

        <label v-if="!usesLiterFormat()">
          Head material
          <select :value="modelValue.headMaterial" @change="updateEntry('headMaterial', text($event) as EngineEntry['headMaterial'])">
            <option value="">Select</option>
            <option value="iron">Iron</option>
            <option value="aluminum">Aluminum</option>
          </select>
        </label>

        <label v-if="!usesLiterFormat() && modelValue.headMaterial" class="check-option">
          <input type="checkbox" :checked="modelValue.pluralHeads" @change="updateEntry('pluralHeads', checked($event))" />
          Multiple cylinder heads
        </label>

        <label v-if="!usesLiterFormat()">
          Fuel injection
          <select :value="modelValue.fuelInjection" @change="updateEntry('fuelInjection', text($event) as EngineEntry['fuelInjection'])">
            <option value="">Select</option>
            <option value="port">Port</option>
            <option value="direct">Direct</option>
            <option value="port and direct">Port and direct</option>
          </select>
        </label>
      </div>

      <fieldset class="descriptor-options">
        <legend>Engine type (optional)</legend>
        <label v-for="descriptor in ['diesel', 'Atkinson/Miller-cycle', 'CNG', 'hydrogen']" :key="descriptor" class="check-option">
          <input
            type="checkbox"
            :checked="modelValue.descriptors.includes(descriptor)"
            @change="updateDescriptor(descriptor, checked($event))"
          />
          {{ descriptor }}
        </label>
      </fieldset>

      <div class="engine-grid output-grid">
        <template v-if="!usesLiterFormat()">
          <label>
            Displacement (in³)
          <input :value="modelValue.displacementIn3" type="text" inputmode="decimal" placeholder="409" @input="updateEntry('displacementIn3', text($event))" />
          </label>
          <label>
            Displacement (cm³)
          <input :value="modelValue.displacementCm3" type="text" inputmode="numeric" placeholder="6698" @input="updateEntry('displacementCm3', text($event))" />
          </label>
        </template>
        <label v-else>
          Displacement (liters)
          <input :value="modelValue.displacementLiters" type="text" inputmode="decimal" placeholder="3.0" @input="updateEntry('displacementLiters', text($event))" />
        </label>
        <label>
          Power (hp)
          <input :value="modelValue.power" type="text" inputmode="numeric" placeholder="535" @input="updateEntry('power', text($event))" />
        </label>
        <label v-if="!usesLiterFormat()">
          Power at (rpm)
          <input :value="modelValue.powerRpm" type="text" inputmode="numeric" placeholder="6100" @input="updateEntry('powerRpm', text($event))" />
        </label>
        <label>
          Torque (lb-ft)
          <input :value="modelValue.torque" type="text" inputmode="numeric" placeholder="520" @input="updateEntry('torque', text($event))" />
        </label>
        <label v-if="!usesLiterFormat()">
          Torque at (rpm)
          <input :value="modelValue.torqueRpm" type="text" inputmode="numeric" placeholder="4600" @input="updateEntry('torqueRpm', text($event))" />
        </label>
      </div>

    </fieldset>
  </section>
</template>

<style scoped>
.engine-form { display: grid; gap: 0.65rem; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.engine-entry { display: grid; min-width: 0; gap: 0.65rem; margin: 0; padding: 0.55rem 0; border: 0; }
.descriptor-options, .forced-induction-options { display: grid; gap: 0.5rem; margin: 0; padding: 0.55rem 0; border: 0; border-top: 1px solid #ecece7; }
.engine-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; }
.engine-grid > * { min-width: 0; }
.output-grid { margin-top: 0.2rem; }
label { display: grid; gap: 0.3rem; color: #55574f; font-size: 0.8rem; font-weight: 600; }
input:not([type="checkbox"]), select { width: 100%; min-height: 2.25rem; padding: 0.4rem 0.5rem; border: 1px solid #b8b9b1; border-radius: 0.25rem; background: #fff; color: #20211f; font: inherit; }
.check-option { display: flex; align-items: center; gap: 0.45rem; }
.check-option input { width: auto; margin: 0; accent-color: #315443; }
.descriptor-options { grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); align-items: center; }
.descriptor-options legend, .forced-induction-options legend { grid-column: 1 / -1; padding: 0 0.3rem 0 0; color: #55574f; font-size: 0.78rem; font-weight: 600; }
.forced-induction-options { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); align-items: center; }
@media (max-width: 640px) { .engine-grid { grid-template-columns: 1fr; } .engine-entry, .descriptor-options, .forced-induction-options { min-width: 0; } }
</style>
