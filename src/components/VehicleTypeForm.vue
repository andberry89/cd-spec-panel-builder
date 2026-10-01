<script setup lang="ts">
import type { VehicleTypeSpec } from '../types/vehicle'

const props = defineProps<{ modelValue: VehicleTypeSpec }>()
const emit = defineEmits<{ 'update:modelValue': [value: VehicleTypeSpec] }>()

const update = (changes: Partial<VehicleTypeSpec>) => {
  emit('update:modelValue', { ...props.modelValue, ...changes })
}

const bodyStyles = [
  'sedan',
  'coupe',
  'hatchback',
  'wagon',
  'van',
  'convertible',
  'pickup',
  'targa',
]

const toggleMotor = (position: 'front' | 'mid' | 'rear', checked: boolean) => {
  const positions = new Set(props.modelValue.motorPositions)
  if (checked) positions.add(position)
  else positions.delete(position)
  update({ motorPositions: ['front', 'mid', 'rear'].filter((item) => positions.has(item as typeof position)) as VehicleTypeSpec['motorPositions'] })
}

const toggleBodyStyle = (style: string, checked: boolean) => {
  const styles = new Set(props.modelValue.bodyStyles)
  if (checked) styles.add(style)
  else styles.delete(style)
  update({ bodyStyles: bodyStyles.filter((item) => styles.has(item)) })
}
</script>

<template>
  <fieldset class="vehicle-type-form">
    <legend>Vehicle Type</legend>

    <label>
      Engine position
      <select
        :value="modelValue.enginePosition"
        @change="update({ enginePosition: ($event.target as HTMLSelectElement).value as VehicleTypeSpec['enginePosition'] })"
      >
        <option value="">No engine</option>
        <option value="front">Front</option>
        <option value="mid">Mid</option>
        <option value="rear">Rear</option>
      </select>
    </label>

    <fieldset class="choice-group">
      <legend>Motor position</legend>
      <label v-for="position in ['front', 'mid', 'rear'] as const" :key="position" class="choice">
        <input
          type="checkbox"
          :checked="modelValue.motorPositions.includes(position)"
          @change="toggleMotor(position, ($event.target as HTMLInputElement).checked)"
        />
        {{ position }} motor
      </label>
    </fieldset>

    <label>
      Driven wheels
      <select
        :value="modelValue.driveLayout"
        @change="update({ driveLayout: ($event.target as HTMLSelectElement).value as VehicleTypeSpec['driveLayout'] })"
      >
        <option value="">Select layout</option>
        <option value="front">Front-wheel drive</option>
        <option value="rear">Rear-wheel drive</option>
        <option value="all">All-wheel drive</option>
        <option value="rear/4">Rear/4-wheel drive</option>
        <option value="rear/all">Rear/all-wheel drive</option>
      </select>
    </label>

    <label>
      Passengers
      <input
        :value="modelValue.passengers"
        type="number"
        min="1"
        placeholder="5"
        @input="update({ passengers: ($event.target as HTMLInputElement).value })"
      />
    </label>

    <label>
      Doors
      <input
        :value="modelValue.doors"
        type="number"
        min="1"
        placeholder="4"
        @input="update({ doors: ($event.target as HTMLInputElement).value })"
      />
    </label>

    <fieldset class="choice-group body-style-group">
      <legend>Body style</legend>
      <label v-for="style in bodyStyles" :key="style" class="choice">
        <input
          type="checkbox"
          :checked="modelValue.bodyStyles.includes(style)"
          @change="toggleBodyStyle(style, ($event.target as HTMLInputElement).checked)"
        />
        {{ style }}
      </label>
    </fieldset>
  </fieldset>
</template>

<style scoped>
.vehicle-type-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
}

legend {
  padding: 0 0.35rem;
  font-weight: 700;
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

.choice-group {
  display: flex;
  flex-wrap: wrap;
  align-content: start;
  gap: 0.75rem;
  min-width: 0;
  padding: 0.75rem;
  border: 1px solid #c8beb1;
  border-radius: 0.5rem;
}

.choice {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: #202124;
  font-size: 0.85rem;
  font-weight: 400;
}

.choice input {
  width: auto;
}

.body-style-group {
  grid-column: 1 / -1;
}
</style>
