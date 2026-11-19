export type SectionKey =
  | 'price'
  | 'powertrain'
  | 'transmission'
  | 'chassis'
  | 'dimensions'
  | 'testing'
  | 'interiorSound'
  | 'fuelEconomy'
  | 'warranty'

export interface SpecField {
  id: string
  label: string
  value: string
  unit?: string
  qualifier?: string
}

export interface VehicleSection {
  enabled: boolean
  fields: SpecField[]
}

export type EngineLayout = '' | 'V' | 'inline' | 'flat' | 'W'

export interface EngineDetails {
  forcedInduction: Array<'twin-turbocharged' | 'turbocharged' | 'supercharged'>
  intercooled: boolean
  valvetrain: '' | 'DOHC' | 'SOHC' | 'pushrod'
  valves: string
  descriptors: string[]
  layout: EngineLayout
  cylinders: string
  blockMaterial: '' | 'iron' | 'aluminum' | 'aluminum-and-magnesium' | 'iron-and-aluminum'
  headMaterial: '' | 'iron' | 'aluminum'
  pluralHeads: boolean
  fuelInjection: '' | 'port' | 'direct' | 'port and direct'
}

export interface EngineEntry extends EngineDetails {
  displacementIn3: string
  displacementCm3: string
  displacementLiters: string
  power: string
  powerRpm: string
  torque: string
  torqueRpm: string
}

export type ElectricMotorType =
  | ''
  | 'permanent-magnet synchronous AC'
  | 'current-excited synchronous AC'
  | 'induction AC'
  | 'DC'

export interface ElectricMotor {
  type: ElectricMotorType
  power: string
  torque: string
}

export interface PowertrainVariant {
  id: string
  type: 'combustion' | 'hybrid' | 'electric'
  plugInHybrid: boolean
  engine: EngineEntry
  motors: [ElectricMotor, ElectricMotor]
  motorCount: 1 | 2
  motorCurrent: 'AC' | 'DC'
  combinedPower: string
  combinedTorque: string
  batteryChemistry: '' | 'lithium-ion' | 'nickel-metal hydride'
  batteryCooling: '' | 'air' | 'liquid'
  batteryCapacity: string
  peakChargeAC: string
  peakChargeDC: string
}

export interface VehicleIdentity {
  year: string
  make: string
  model: string
  includeTrimInHeading: boolean
  vehicleType: VehicleTypeSpec
}

export interface VehicleTypeSpec {
  enginePosition: '' | 'front' | 'mid' | 'rear'
  motorPositions: Array<'front' | 'mid' | 'rear'>
  driveLayout: '' | 'front' | 'rear' | 'all' | 'rear/4' | 'rear/all' | 'rear-or-all'
  passengers: string
  doors: string
  bodyStyles: string[]
}

export interface Trim {
  id: string
  name: string
  basePrice: PriceValue
  fields: SpecField[]
}

export interface PriceValue {
  amount: string
  estimated: boolean
}

export interface Vehicle {
  id: string
  identity: VehicleIdentity
  powertrainVariants: PowertrainVariant[]
  trims: Trim[]
  sections: Record<SectionKey, VehicleSection>
}
