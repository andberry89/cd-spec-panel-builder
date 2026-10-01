import type { Vehicle } from './vehicle'

export type PanelType = 'firstDrive' | 'testedSpecs' | 'longTerm'

export interface Panel {
  panelType: PanelType
  vehicleOne: Vehicle
  vehicleTwo?: Vehicle
  testingExplainedEnabled: boolean
  generatedHtml: string
}
