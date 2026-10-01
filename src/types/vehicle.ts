export type PowertrainType = 'combustion' | 'hybrid' | 'electric'

export type SectionKey =
  | 'price'
  | 'powertrain'
  | 'transmission'
  | 'chassis'
  | 'dimensions'
  | 'testing'
  | 'interiorSound'
  | 'fuelEconomy'

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

export interface VehicleIdentity {
  year: string
  make: string
  model: string
  vehicleType: VehicleTypeSpec
}

export interface VehicleTypeSpec {
  enginePosition: '' | 'front' | 'mid' | 'rear'
  motorPositions: Array<'front' | 'mid' | 'rear'>
  driveLayout: '' | 'front' | 'rear' | 'all' | 'rear/4' | 'rear/all'
  passengers: string
  doors: string
  bodyStyles: string[]
}

export interface Trim {
  id: string
  name: string
  fields: SpecField[]
}

export interface Vehicle {
  id: string
  identity: VehicleIdentity
  powertrainType: PowertrainType
  trims: Trim[]
  sections: Record<SectionKey, VehicleSection>
}
