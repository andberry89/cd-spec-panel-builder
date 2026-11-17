<script setup lang="ts">
import type { EngineEntry, EngineSpec } from '../types/vehicle'
import type { PowertrainType } from '../types/vehicle'

const props = defineProps<{
  modelValue: EngineSpec
  powertrainType: PowertrainType
  showModeSelector: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [engine: EngineSpec] }>()
type ForcedInduction = EngineEntry['forcedInduction'][number]
const forcedInductionOptions: ForcedInduction[] = ['twin-turbocharged', 'turbocharged', 'supercharged']

const update = (changes: Partial<EngineSpec>) =>
  emit('update:modelValue', { ...props.modelValue, ...changes })

const updateEntry = <K extends keyof EngineEntry>(index: number, key: K, value: EngineEntry[K]) => {
  const engines = props.modelValue.engines.map((engine, entryIndex) =>
    entryIndex === index ? { ...engine, [key]: value } : engine,
  )
  update({ engines })
}

const updateDescriptor = (index: number, descriptor: string, checked: boolean) => {
  const current = props.modelValue.engines[index]?.descriptors ?? []
  const descriptors = checked
    ? [...current, descriptor]
    : current.filter((item) => item !== descriptor)
  updateEntry(index, 'descriptors', descriptors)
}

const updateForcedInduction = (index: number, option: ForcedInduction, isChecked: boolean) => {
  const current = props.modelValue.engines[index]?.forcedInduction ?? []
  const forcedInduction = isChecked
    ? [...current, option]
    : current.filter((item) => item !== option)
  updateEntry(index, 'forcedInduction', forcedInduction)
}

const createEntry = (): EngineEntry => ({
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
})

const addEngine = () => update({ engines: [...props.modelValue.engines, createEntry()] })
const removeEngine = (index: number) =>
  update({ engines: props.modelValue.engines.filter((_, entryIndex) => entryIndex !== index) })

const moveEngine = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= props.modelValue.engines.length) return
  const engines = [...props.modelValue.engines]
  const currentEngine = engines[index]
  const targetEngine = engines[target]
  if (!currentEngine || !targetEngine) return
  engines[index] = targetEngine
  engines[target] = currentEngine
  update({ engines })
}

const text = (event: Event) => (event.target as HTMLInputElement).value
const checked = (event: Event) => (event.target as HTMLInputElement).checked
const usesLiterFormat = () => props.modelValue.mode === 'multiple' || props.powertrainType === 'hybrid' || props.powertrainType === 'combined'
</script>

<template>
  <section class="engine-form" aria-labelledby="engine-heading">
    <div class="engine-heading">
      <h4 id="engine-heading">{{ modelValue.mode === 'multiple' ? 'Engines' : 'Engine' }}</h4>
      <label v-if="showModeSelector">
        Engine setup
        <select
          :value="modelValue.mode"
          @change="update({ mode: ($event.target as HTMLSelectElement).value as EngineSpec['mode'] })"
        >
          <option value="single">Single engine</option>
          <option value="multiple">Multiple engines in one vehicle</option>
        </select>
      </label>
    </div>

    <fieldset
      v-for="(engine, index) in (modelValue.mode === 'single' ? modelValue.engines.slice(0, 1) : modelValue.engines)"
      :key="engine.id"
      class="engine-entry"
    >
      <legend>{{ modelValue.mode === 'multiple' ? `Engine ${index + 1}` : 'Engine details' }}</legend>

      <div class="engine-grid">
        <fieldset class="forced-induction-options">
          <legend>Forced induction</legend>
          <label v-for="option in forcedInductionOptions" :key="option" class="check-option">
            <input
              type="checkbox"
              :checked="engine.forcedInduction.includes(option)"
              @change="updateForcedInduction(index, option, checked($event))"
            />
            {{ option }}
          </label>
          <label class="check-option">
            <input
              type="checkbox"
              :checked="engine.intercooled"
              :disabled="engine.forcedInduction.length === 0"
              @change="updateEntry(index, 'intercooled', checked($event))"
            />
            Intercooled
          </label>
        </fieldset>

        <label>
          Valvetrain
          <select :value="engine.valvetrain" @change="updateEntry(index, 'valvetrain', text($event) as EngineEntry['valvetrain'])">
            <option value="">Select</option>
            <option value="DOHC">DOHC</option>
            <option value="SOHC">SOHC</option>
            <option value="pushrod">Pushrod</option>
          </select>
        </label>

        <label>
          Number of valves
          <input :value="engine.valves" type="text" inputmode="numeric" placeholder="32" @input="updateEntry(index, 'valves', text($event))" />
        </label>

        <label>
          Cylinder layout
          <select :value="engine.layout" @change="updateEntry(index, 'layout', text($event) as EngineEntry['layout'])">
            <option value="">Select</option>
            <option value="V">V</option>
            <option value="inline">Inline</option>
            <option value="flat">Flat</option>
            <option value="W">W</option>
          </select>
        </label>

        <label>
          Number of cylinders
          <input :value="engine.cylinders" type="text" inputmode="numeric" placeholder="8" @input="updateEntry(index, 'cylinders', text($event))" />
        </label>

        <label v-if="!usesLiterFormat()">
          Block material
          <select :value="engine.blockMaterial" @change="updateEntry(index, 'blockMaterial', text($event) as EngineEntry['blockMaterial'])">
            <option value="">Select</option>
            <option value="iron">Iron</option>
            <option value="aluminum">Aluminum</option>
            <option value="aluminum-and-magnesium">Aluminum and magnesium</option>
          </select>
        </label>

        <label v-if="!usesLiterFormat()">
          Head material
          <select :value="engine.headMaterial" @change="updateEntry(index, 'headMaterial', text($event) as EngineEntry['headMaterial'])">
            <option value="">Select</option>
            <option value="iron">Iron</option>
            <option value="aluminum">Aluminum</option>
          </select>
        </label>

        <label v-if="!usesLiterFormat() && engine.headMaterial" class="check-option">
          <input type="checkbox" :checked="engine.pluralHeads" @change="updateEntry(index, 'pluralHeads', checked($event))" />
          Multiple cylinder heads
        </label>

        <label v-if="!usesLiterFormat()">
          Fuel injection
          <select :value="engine.fuelInjection" @change="updateEntry(index, 'fuelInjection', text($event) as EngineEntry['fuelInjection'])">
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
            :checked="engine.descriptors.includes(descriptor)"
            @change="updateDescriptor(index, descriptor, checked($event))"
          />
          {{ descriptor }}
        </label>
      </fieldset>

      <div class="engine-grid output-grid">
        <template v-if="!usesLiterFormat()">
          <label>
            Displacement (in³)
            <input :value="engine.displacementIn3" type="text" inputmode="decimal" placeholder="409" @input="updateEntry(index, 'displacementIn3', text($event))" />
          </label>
          <label>
            Displacement (cm³)
            <input :value="engine.displacementCm3" type="text" inputmode="numeric" placeholder="6698" @input="updateEntry(index, 'displacementCm3', text($event))" />
          </label>
        </template>
        <label v-else>
          Displacement (liters)
          <input :value="engine.displacementLiters" type="text" inputmode="decimal" placeholder="3.0" @input="updateEntry(index, 'displacementLiters', text($event))" />
        </label>
        <label>
          Power (hp)
          <input :value="engine.power" type="text" inputmode="numeric" placeholder="535" @input="updateEntry(index, 'power', text($event))" />
        </label>
        <label v-if="!usesLiterFormat()">
          Power at (rpm)
          <input :value="engine.powerRpm" type="text" inputmode="numeric" placeholder="6100" @input="updateEntry(index, 'powerRpm', text($event))" />
        </label>
        <label>
          Torque (lb-ft)
          <input :value="engine.torque" type="text" inputmode="numeric" placeholder="520" @input="updateEntry(index, 'torque', text($event))" />
        </label>
        <label v-if="!usesLiterFormat()">
          Torque at (rpm)
          <input :value="engine.torqueRpm" type="text" inputmode="numeric" placeholder="4600" @input="updateEntry(index, 'torqueRpm', text($event))" />
        </label>
      </div>

      <div v-if="modelValue.mode === 'multiple'" class="entry-actions">
        <button type="button" :disabled="index === 0" @click="moveEngine(index, -1)">Move up</button>
        <button type="button" :disabled="index === modelValue.engines.length - 1" @click="moveEngine(index, 1)">Move down</button>
        <button v-if="modelValue.engines.length > 1" type="button" class="remove-engine" @click="removeEngine(index)">
          Remove engine
        </button>
      </div>
    </fieldset>

    <button v-if="modelValue.mode === 'multiple'" type="button" class="add-engine" @click="addEngine">
      Add engine
    </button>
    <p v-if="modelValue.mode === 'multiple'" class="help-text">List engines from least to most powerful.</p>
  </section>
</template>

<style scoped>
.engine-form { display: grid; gap: 1rem; }
.engine-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; }
.engine-heading h4 { margin: 0; }
.engine-entry, .descriptor-options, .forced-induction-options { display: grid; gap: 1rem; padding: 1rem; border: 1px solid #c8beb1; border-radius: 0.5rem; }
.engine-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.output-grid { margin-top: 0.5rem; }
label { display: grid; gap: 0.4rem; color: #6a6258; font-size: 0.85rem; font-weight: 700; }
input:not([type="checkbox"]), select { width: 100%; padding: 0.65rem; border: 1px solid #c8beb1; border-radius: 0.4rem; background: #fffdf9; color: #202124; font: inherit; }
.check-option { display: flex; align-items: center; gap: 0.5rem; }
.check-option input { width: auto; margin: 0; }
.descriptor-options { grid-template-columns: repeat(2, max-content); align-items: center; }
.descriptor-options legend, .forced-induction-options legend { grid-column: 1 / -1; }
.forced-induction-options { grid-column: 1 / -1; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); align-items: center; }
.remove-engine, .add-engine { justify-self: start; padding: 0.55rem 0.8rem; border: 1px solid #8f3328; border-radius: 0.4rem; background: #fff8f4; color: #8f3328; cursor: pointer; font: inherit; }
.add-engine { border-color: #536246; background: #f5f7f0; color: #34402b; }
.entry-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.entry-actions button { padding: 0.45rem 0.65rem; border: 1px solid #c8beb1; border-radius: 0.4rem; background: #fffdf9; cursor: pointer; font: inherit; }
.entry-actions button:disabled { opacity: 0.5; cursor: default; }
.help-text { margin: 0; color: #6a6258; font-size: 0.85rem; }
@media (max-width: 640px) { .engine-heading { align-items: stretch; flex-direction: column; } .engine-grid { grid-template-columns: 1fr; } }
</style>
