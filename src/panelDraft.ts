import type { Panel } from './types/panel'
import type { SectionKey } from './types/vehicle'

export const panelDraftStorageKey = 'cd-spec-panel-builder:draft:v1'

export interface LoadedPanelDraft {
  panel: Panel
  htmlOverride?: string
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString)

const isField = (value: unknown) =>
  isRecord(value) && isString(value.id) && isString(value.label) && isString(value.value)

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

const isEngine = (value: unknown) =>
  isRecord(value) &&
  Array.isArray(value.forcedInduction) &&
  isBoolean(value.intercooled) &&
  isString(value.valvetrain) &&
  isString(value.valves) &&
  isStringArray(value.descriptors) &&
  isString(value.layout) &&
  isString(value.cylinders) &&
  isString(value.blockMaterial) &&
  isString(value.headMaterial) &&
  isBoolean(value.pluralHeads) &&
  isString(value.fuelInjection) &&
  isString(value.displacementIn3) &&
  isString(value.displacementCm3) &&
  isString(value.displacementLiters) &&
  isString(value.power) &&
  isString(value.powerRpm) &&
  isString(value.torque) &&
  isString(value.torqueRpm)

const isPowertrainVariant = (value: unknown) =>
  isRecord(value) &&
  isString(value.id) &&
  ['combustion', 'hybrid', 'electric'].includes(String(value.type)) &&
  isBoolean(value.plugInHybrid) &&
  isEngine(value.engine) &&
  Array.isArray(value.motors) &&
  value.motors.length === 2 &&
  value.motors.every((motor) =>
    isRecord(motor) && isString(motor.type) && isString(motor.power) && isString(motor.torque),
  ) &&
  (value.motorCount === 1 || value.motorCount === 2) &&
  isString(value.motorCurrent) &&
  isString(value.combinedPower) &&
  isString(value.combinedTorque) &&
  isString(value.batteryChemistry) &&
  isString(value.batteryCooling) &&
  isString(value.batteryCapacity) &&
  isString(value.peakChargeAC) &&
  isString(value.peakChargeDC)

const isTrim = (value: unknown) =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isRecord(value.basePrice) &&
  isString(value.basePrice.amount) &&
  isBoolean(value.basePrice.estimated) &&
  Array.isArray(value.fields) &&
  value.fields.every(isField)

const isVehicle = (value: unknown) => {
  if (!isRecord(value)) return false

  const { identity, sections } = value
  if (!isRecord(identity) || !isRecord(identity.vehicleType)) return false
  const vehicleType = identity.vehicleType
  if (
    !isString(value.id) ||
    !isString(identity.year) ||
    !isString(identity.make) ||
    !isString(identity.model) ||
    !isBoolean(identity.includeTrimInHeading) ||
    !isString(vehicleType.enginePosition) ||
    !isStringArray(vehicleType.motorPositions) ||
    !isString(vehicleType.driveLayout) ||
    !isString(vehicleType.passengers) ||
    !isString(vehicleType.doors) ||
    !isStringArray(vehicleType.bodyStyles) ||
    !Array.isArray(value.powertrainVariants) ||
    !value.powertrainVariants.every(isPowertrainVariant) ||
    !Array.isArray(value.trims) ||
    !value.trims.every(isTrim) ||
    !isRecord(sections)
  ) {
    return false
  }

  return sectionKeys.every((key) => {
    const section = sections[key]
    return (
      isRecord(section) &&
      isBoolean(section.enabled) &&
      Array.isArray(section.fields) &&
      section.fields.every(isField)
    )
  })
}

const isPanel = (value: unknown): value is Panel =>
  isRecord(value) &&
  ['firstDrive', 'testedSpecs', 'longTerm'].includes(String(value.panelType)) &&
  isVehicle(value.vehicleOne) &&
  (value.vehicleTwo === undefined || isVehicle(value.vehicleTwo)) &&
  isBoolean(value.testingExplainedEnabled)

const getStorage = (): Storage | null => {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

export const loadPanelDraft = (): LoadedPanelDraft | null => {
  try {
    const serialized = getStorage()?.getItem(panelDraftStorageKey)
    if (!serialized) return null
    const draft: unknown = JSON.parse(serialized)
    if (
      !isRecord(draft) ||
      draft.version !== 1 ||
      !isPanel(draft.panel) ||
      (draft.htmlOverride !== undefined && !isString(draft.htmlOverride))
    ) return null
    return {
      panel: draft.panel,
      ...(draft.htmlOverride === undefined ? {} : { htmlOverride: draft.htmlOverride }),
    }
  } catch {
    return null
  }
}

export const savePanelDraft = (panel: Panel, htmlOverride?: string): boolean => {
  try {
    const storage = getStorage()
    if (!storage) return false
    storage.setItem(panelDraftStorageKey, JSON.stringify({
      version: 1,
      panel,
      ...(htmlOverride === undefined ? {} : { htmlOverride }),
    }))
    return true
  } catch {
    return false
  }
}
