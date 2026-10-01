import type { SectionKey, SpecField } from '../types/vehicle'

export interface FieldDefinition {
  id: string
  label: string
  unit?: string
}

export const sectionLabels: Record<SectionKey, string> = {
  price: 'Price',
  powertrain: 'Engine / Powertrain',
  transmission: 'Transmission',
  chassis: 'Chassis',
  dimensions: 'Dimensions',
  testing: 'C/D Test Results',
  interiorSound: 'Interior Sound',
  fuelEconomy: 'Fuel Economy and Charging',
}

export const fieldCatalog: Record<SectionKey, FieldDefinition[]> = {
  price: [
    { id: 'base-price', label: 'Base' },
    { id: 'options', label: 'Options' },
  ],
  powertrain: [
    { id: 'engine-description', label: 'Engine' },
    { id: 'displacement', label: 'Displacement' },
    { id: 'engine-power', label: 'Power', unit: 'hp' },
    { id: 'engine-torque', label: 'Torque', unit: 'lb-ft' },
    { id: 'front-motor', label: 'Front Motor' },
    { id: 'rear-motor', label: 'Rear Motor' },
    { id: 'combined-power', label: 'Combined Power', unit: 'hp' },
    { id: 'combined-torque', label: 'Combined Torque', unit: 'lb-ft' },
    { id: 'battery-pack', label: 'Battery Pack', unit: 'kWh' },
    { id: 'onboard-charger', label: 'Onboard Charger' },
    { id: 'peak-charge-rate', label: 'Peak Charge Rate, AC/DC', unit: 'kW' },
  ],
  transmission: [{ id: 'transmission', label: 'Transmission' }],
  chassis: [
    { id: 'suspension', label: 'Suspension, F/R' },
    { id: 'brakes', label: 'Brakes, F/R' },
    { id: 'tire-model', label: 'Tires' },
    { id: 'tire-size', label: 'Tire Size, F/R' },
  ],
  dimensions: [
    { id: 'wheelbase', label: 'Wheelbase', unit: 'in' },
    { id: 'length', label: 'Length', unit: 'in' },
    { id: 'width', label: 'Width', unit: 'in' },
    { id: 'height', label: 'Height', unit: 'in' },
    { id: 'passenger-volume', label: 'Passenger Volume', unit: 'ft³' },
    { id: 'cargo-volume', label: 'Cargo Volume', unit: 'ft³' },
    { id: 'curb-weight', label: 'Curb Weight', unit: 'lb' },
  ],
  testing: [
    { id: 'zero-thirty', label: '0–30 mph', unit: 'sec' },
    { id: 'zero-sixty', label: '60 mph', unit: 'sec' },
    { id: 'zero-hundred', label: '100 mph', unit: 'sec' },
    { id: 'quarter-mile', label: '1/4-Mile', unit: 'sec' },
    { id: 'zero-one-twenty', label: '120 mph', unit: 'sec' },
    { id: 'zero-one-thirty', label: '130 mph', unit: 'sec' },
    { id: 'zero-one-fifty', label: '150 mph', unit: 'sec' },
    { id: 'rollout', label: '1-ft rollout', unit: 'sec' },
    { id: 'rolling-start', label: 'Rolling Start, 5–60 mph', unit: 'sec' },
    { id: 'top-gear-thirty-fifty', label: 'Top Gear, 30–50 mph', unit: 'sec' },
    { id: 'top-gear-fifty-seventy', label: 'Top Gear, 50–70 mph', unit: 'sec' },
    { id: 'top-speed', label: 'Top Speed', unit: 'mph' },
    { id: 'braking-seventy', label: 'Braking, 70–0 mph', unit: 'ft' },
    { id: 'braking-hundred', label: 'Braking, 100–0 mph', unit: 'ft' },
    { id: 'skidpad', label: 'Roadholding, 300-ft Skidpad', unit: 'g' },
  ],
  interiorSound: [
    { id: 'sound-idle', label: 'Idle' },
    { id: 'sound-full-throttle', label: 'Full Throttle' },
    { id: 'sound-cruising', label: '70-mph Cruising' },
  ],
  fuelEconomy: [
    { id: 'observed-fuel-economy', label: 'Observed' },
    { id: 'highway-driving', label: '75-mph Highway Driving' },
    { id: 'highway-range', label: '75-mph Highway Range', unit: 'mi' },
    { id: 'average-dc-rate', label: 'Average DC Fast-Charge Rate, 10–90%', unit: 'kW' },
    { id: 'dc-charge-time', label: 'DC Fast-Charge Time, 10–90%', unit: 'min' },
    { id: 'epa-fuel-economy', label: 'Combined/City/Highway' },
    { id: 'epa-electricity', label: 'Combined Gasoline + Electricity', unit: 'MPGe' },
    { id: 'epa-range', label: 'EPA Range', unit: 'mi' },
  ],
}

export const createEmptyFields = (sectionKey: SectionKey): SpecField[] =>
  fieldCatalog[sectionKey].map(({ id, label, unit }) => ({
    id,
    label,
    value: '',
    ...(unit ? { unit } : {}),
  }))
