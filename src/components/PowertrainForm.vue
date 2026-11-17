<script setup lang="ts">
import type { ElectrifiedPowertrain, ElectricMotor, PowertrainType } from '../types/vehicle'

const props = defineProps<{
  modelValue: ElectrifiedPowertrain
  powertrainType: PowertrainType
}>()

const emit = defineEmits<{ 'update:modelValue': [powertrain: ElectrifiedPowertrain] }>()

const update = (changes: Partial<ElectrifiedPowertrain>) =>
  emit('update:modelValue', { ...props.modelValue, ...changes })

const updateMotor = <K extends keyof ElectricMotor>(index: number, key: K, value: ElectricMotor[K]) => {
  const motors: [ElectricMotor, ElectricMotor] = props.modelValue.motors.map((motor, motorIndex) =>
    motorIndex === index ? { ...motor, [key]: value } : motor,
  ) as [ElectricMotor, ElectricMotor]
  update({ motors })
}

const motorTypes: ElectricMotor['type'][] = [
  'permanent-magnet synchronous AC',
  'current-excited synchronous AC',
  'induction AC',
  'DC',
]
const text = (event: Event) => (event.target as HTMLInputElement).value
</script>

<template>
  <section class="powertrain-form" aria-labelledby="powertrain-form-heading">
    <h4 id="powertrain-form-heading">
      {{ powertrainType === 'hybrid' ? 'Hybrid powertrain' : powertrainType === 'combined' ? 'Combined powertrains' : 'Electric powertrain' }}
    </h4>

    <template v-if="powertrainType === 'hybrid' || powertrainType === 'combined'">
      <div class="powertrain-grid">
        <label>
          Number of electric motors
          <select
            :value="modelValue.hybridMotorCount"
            @change="update({ hybridMotorCount: Number(text($event)) as 1 | 2 })"
          >
            <option :value="1">1</option>
            <option :value="2">2</option>
          </select>
        </label>
        <label>
          Motor current
          <select
            :value="modelValue.hybridMotorCurrent"
            @change="update({ hybridMotorCurrent: text($event) as 'AC' | 'DC' })"
          >
            <option value="AC">AC</option>
            <option value="DC">DC</option>
          </select>
        </label>
      </div>

      <div class="motor-list">
        <fieldset v-for="index in modelValue.hybridMotorCount" :key="index" class="motor-entry">
          <legend>{{ modelValue.hybridMotorCount === 1 ? 'Electric motor' : `Motor ${index}` }}</legend>
          <div class="powertrain-grid">
            <label>
              Power (hp)
              <input :value="modelValue.motors[index - 1]?.power" inputmode="numeric" placeholder="200" @input="updateMotor(index - 1, 'power', text($event))" />
            </label>
            <label>
              Torque (lb-ft)
              <input :value="modelValue.motors[index - 1]?.torque" inputmode="numeric" placeholder="200" @input="updateMotor(index - 1, 'torque', text($event))" />
            </label>
          </div>
        </fieldset>
      </div>
      <div class="powertrain-grid">
        <label>
          Combined system power (hp)
          <input :value="modelValue.combinedPower" inputmode="numeric" placeholder="" @input="update({ combinedPower: text($event) })" />
        </label>
        <label>
          Combined system torque (lb-ft)
          <input :value="modelValue.combinedTorque" inputmode="numeric" placeholder="" @input="update({ combinedTorque: text($event) })" />
        </label>
      </div>
    </template>

    <template v-else-if="powertrainType === 'electricSingle'">
      <fieldset class="motor-entry">
        <legend>Motor</legend>
        <div class="powertrain-grid">
          <label>
            Motor type
            <select :value="modelValue.motors[0].type" @change="updateMotor(0, 'type', text($event) as ElectricMotor['type'])">
              <option value="">Select</option>
              <option v-for="type in motorTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>
          <label>
            Power (hp)
            <input :value="modelValue.motors[0].power" inputmode="numeric" placeholder="272" @input="updateMotor(0, 'power', text($event))" />
          </label>
          <label>
            Power at (rpm, optional)
            <input :value="modelValue.motors[0].powerRpm" inputmode="numeric" @input="updateMotor(0, 'powerRpm', text($event))" />
          </label>
          <label>
            Torque (lb-ft)
            <input :value="modelValue.motors[0].torque" inputmode="numeric" placeholder="279" @input="updateMotor(0, 'torque', text($event))" />
          </label>
          <label>
            Torque at (rpm, optional)
            <input :value="modelValue.motors[0].torqueRpm" inputmode="numeric" @input="updateMotor(0, 'torqueRpm', text($event))" />
          </label>
        </div>
      </fieldset>
    </template>

    <template v-else>
      <div class="motor-list">
        <fieldset v-for="(position, index) in ['Front', 'Rear']" :key="position" class="motor-entry">
          <legend>{{ position }} motor</legend>
          <div class="powertrain-grid">
            <label>
              Motor type
              <select :value="modelValue.motors[index]?.type" @change="updateMotor(index, 'type', text($event) as ElectricMotor['type'])">
                <option value="">Select</option>
                <option v-for="type in motorTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </label>
            <label>
              Power (hp)
              <input :value="modelValue.motors[index]?.power" inputmode="numeric" @input="updateMotor(index, 'power', text($event))" />
            </label>
            <label>
              Torque (lb-ft)
              <input :value="modelValue.motors[index]?.torque" inputmode="numeric" @input="updateMotor(index, 'torque', text($event))" />
            </label>
          </div>
        </fieldset>
      </div>
      <div class="powertrain-grid">
        <label>
          Combined power (hp, optional)
          <input :value="modelValue.combinedPower" inputmode="numeric" @input="update({ combinedPower: text($event) })" />
        </label>
        <label>
          Combined torque (lb-ft, optional)
          <input :value="modelValue.combinedTorque" inputmode="numeric" @input="update({ combinedTorque: text($event) })" />
        </label>
      </div>
    </template>

    <fieldset v-if="powertrainType === 'hybrid' || powertrainType === 'combined'" class="battery-entry">
      <legend>Battery and charging</legend>
      <label class="check-option">
        <input :checked="modelValue.plugInHybrid" type="checkbox" @change="update({ plugInHybrid: ($event.target as HTMLInputElement).checked })" />
        Plug-in hybrid
      </label>
      <div class="powertrain-grid">
        <label>
          Battery chemistry
          <select :value="modelValue.batteryChemistry" @change="update({ batteryChemistry: text($event) as ElectrifiedPowertrain['batteryChemistry'] })">
            <option value="">Select</option>
            <option value="lithium-ion">Lithium-ion</option>
            <option value="nickel-metal hydride">Nickel-metal hydride</option>
          </select>
        </label>
        <label v-if="modelValue.plugInHybrid">
          Battery capacity (kWh)
          <input :value="modelValue.batteryCapacity" inputmode="decimal" @input="update({ batteryCapacity: text($event) })" />
        </label>
        <label v-if="modelValue.plugInHybrid">
          Peak charge rate, AC (kW)
          <input :value="modelValue.peakChargeAC" inputmode="decimal" @input="update({ peakChargeAC: text($event) })" />
        </label>
        <label v-if="modelValue.plugInHybrid">
          Peak charge rate, DC (kW)
          <input :value="modelValue.peakChargeDC" inputmode="decimal" @input="update({ peakChargeDC: text($event) })" />
        </label>
      </div>
    </fieldset>

    <fieldset v-else class="battery-entry">
      <legend>Battery and charging</legend>
      <div class="powertrain-grid">
        <label>
          Battery cooling
          <select :value="modelValue.batteryCooling" @change="update({ batteryCooling: text($event) as ElectrifiedPowertrain['batteryCooling'] })">
            <option value="">Select</option>
            <option value="air">Air-cooled</option>
            <option value="liquid">Liquid-cooled</option>
          </select>
        </label>
        <label>
          Battery chemistry
          <select :value="modelValue.batteryChemistry" @change="update({ batteryChemistry: text($event) as ElectrifiedPowertrain['batteryChemistry'] })">
            <option value="">Select</option>
            <option value="lithium-ion">Lithium-ion</option>
            <option value="nickel-metal hydride">Nickel-metal hydride</option>
          </select>
        </label>
        <label>
          Battery capacity (kWh)
          <input :value="modelValue.batteryCapacity" inputmode="decimal" @input="update({ batteryCapacity: text($event) })" />
        </label>
        <label>
          Peak charge rate, AC (kW)
          <input :value="modelValue.peakChargeAC" inputmode="decimal" @input="update({ peakChargeAC: text($event) })" />
        </label>
        <label>
          Peak charge rate, DC (kW)
          <input :value="modelValue.peakChargeDC" inputmode="decimal" @input="update({ peakChargeDC: text($event) })" />
        </label>
      </div>
    </fieldset>

    <p v-if="powertrainType === 'combined'" class="help-text">
      Add the ICE options in the Engine form above, ordered from least to most powerful.
    </p>
  </section>
</template>

<style scoped>
.powertrain-form { display: grid; gap: 1rem; }
h4 { margin: 0; }
.powertrain-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.motor-list { display: grid; gap: 0.75rem; }
.motor-entry, .battery-entry { display: grid; gap: 0.75rem; padding: 1rem; border: 1px solid #c8beb1; border-radius: 0.5rem; }
label { display: grid; gap: 0.4rem; color: #6a6258; font-size: 0.85rem; font-weight: 700; }
input:not([type="checkbox"]), select { width: 100%; padding: 0.65rem; border: 1px solid #c8beb1; border-radius: 0.4rem; background: #fffdf9; color: #202124; font: inherit; }
.check-option { display: flex; align-items: center; gap: 0.5rem; }
.check-option input { width: auto; margin: 0; }
.help-text { margin: 0; color: #6a6258; font-size: 0.85rem; }
@media (max-width: 640px) { .powertrain-grid { grid-template-columns: 1fr; } }
</style>
