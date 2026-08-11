import type { Vehicle } from './vehicle'

export interface Panel {
  vehicleOne: Vehicle
  vehicleTwo?: Vehicle
  testingExplainedEnabled: boolean
  generatedHtml: string
}
