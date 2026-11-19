<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import VehicleForm from './components/VehicleForm.vue'
import type { Panel } from './types/panel'
import type { ElectricMotor, EngineEntry, PowertrainVariant, SectionKey, Vehicle, VehicleSection, VehicleTypeSpec } from './types/vehicle'
import { createEmptyFields } from './data/fieldCatalog'
import { generatePanelHtml } from './generatePanelHtml'
import { loadPanelDraft, savePanelDraft } from './panelDraft'

const createSection = (): VehicleSection => ({
  enabled: true,
  fields: [],
})

const createVehicleType = (): VehicleTypeSpec => ({
  enginePosition: '',
  motorPositions: [],
  driveLayout: '',
  passengers: '',
  doors: '',
  bodyStyles: [],
})

const createEngineEntry = (): EngineEntry => ({
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

const createMotor = (): ElectricMotor => ({
  type: '',
  power: '',
  torque: '',
})

const createPowertrainVariant = (id: string): PowertrainVariant => ({
  id,
  type: 'combustion',
  plugInHybrid: false,
  engine: createEngineEntry(),
  motors: [createMotor(), createMotor()],
  motorCount: 2,
  motorCurrent: 'AC',
  combinedPower: '',
  combinedTorque: '',
  batteryChemistry: '',
  batteryCooling: '',
  batteryCapacity: '',
  peakChargeAC: '',
  peakChargeDC: '',
})

const createSections = (): Record<SectionKey, VehicleSection> => ({
  price: { ...createSection(), fields: createEmptyFields('price') },
  powertrain: createSection(),
  transmission: { ...createSection(), fields: createEmptyFields('transmission') },
  chassis: { ...createSection(), fields: createEmptyFields('chassis') },
  dimensions: { ...createSection(), fields: createEmptyFields('dimensions') },
  testing: { ...createSection(), fields: createEmptyFields('testing') },
  interiorSound: { ...createSection(), fields: createEmptyFields('interiorSound') },
  fuelEconomy: { ...createSection(), fields: createEmptyFields('fuelEconomy') },
})

const createVehicleTwo = (): Vehicle => ({
  id: 'vehicle-two',
  identity: {
    year: '',
    make: '',
    model: '',
    includeTrimInHeading: false,
    vehicleType: createVehicleType(),
  },
  powertrainVariants: [createPowertrainVariant('vehicle-two-powertrain-one')],
  trims: [
    {
      id: 'vehicle-two-trim-one',
      name: '',
      basePrice: { amount: '', estimated: false },
      fields: [],
    },
  ],
  sections: createSections(),
})

const createInitialPanel = (): Panel => ({
  panelType: 'firstDrive',
  vehicleOne: {
    id: 'vehicle-one',
    identity: {
      year: '',
      make: '',
      model: '',
      includeTrimInHeading: false,
      vehicleType: createVehicleType(),
    },
    powertrainVariants: [createPowertrainVariant('powertrain-one')],
    trims: [
      {
        id: 'trim-one',
        name: '',
        basePrice: { amount: '', estimated: false },
        fields: [],
      },
    ],
    sections: createSections(),
  },
  testingExplainedEnabled: true,
})

const loadedDraft = loadPanelDraft()
const panel = ref<Panel>(loadedDraft?.panel ?? createInitialPanel())
const draftStatus = ref(loadedDraft ? 'Draft restored from this browser.' : 'Changes save automatically in this browser.')

const generatedHtml = computed(() =>
  generatePanelHtml(
    [panel.value.vehicleOne, panel.value.vehicleTwo].filter((vehicle): vehicle is Vehicle => Boolean(vehicle)),
    panel.value.panelType,
    panel.value.testingExplainedEnabled,
  ),
)
const copied = ref(false)
const htmlSource = ref(loadedDraft?.htmlOverride ?? generatedHtml.value)
const hasManualHtml = ref(Boolean(loadedDraft?.htmlOverride && loadedDraft.htmlOverride !== generatedHtml.value))
const previewDocument = computed(() => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
  <style>body { margin: 1rem; color: #202124; font: 16px/1.45 Georgia, serif; }</style>
</head>
<body>${htmlSource.value}</body>
</html>`)
let saveTimeout: number | undefined

watch(generatedHtml, (nextHtml) => {
  if (!hasManualHtml.value) htmlSource.value = nextHtml
})

watch([panel, htmlSource], ([updatedPanel]) => {
  draftStatus.value = 'Saving draft…'
  if (saveTimeout !== undefined) window.clearTimeout(saveTimeout)
  saveTimeout = window.setTimeout(() => {
    draftStatus.value = savePanelDraft(updatedPanel, hasManualHtml.value ? htmlSource.value : undefined)
      ? 'Draft saved in this browser.'
      : 'This browser could not save the draft.'
  }, 300)
}, { deep: true })

const validationMessages = computed(() => {
  const vehicles = [
    { label: 'Vehicle 1', vehicle: panel.value.vehicleOne },
    ...(panel.value.vehicleTwo ? [{ label: 'Vehicle 2', vehicle: panel.value.vehicleTwo }] : []),
  ]
  return vehicles.flatMap(({ label, vehicle }) => {
    const missing: string[] = []
    if (!vehicle.identity.year.trim()) missing.push('year')
    if (!vehicle.identity.make.trim()) missing.push('make')
    if (!vehicle.identity.model.trim()) missing.push('model')
    if (!missing.length) return []
    const missingText = missing.length === 1
      ? missing[0]
      : missing.length === 2
        ? `${missing[0]} and ${missing[1]}`
        : `${missing[0]}, ${missing[1]}, and ${missing[2]}`
    return [`${label} is missing ${missingText} for its output heading.`]
  })
})

const copyHtml = async () => {
  await navigator.clipboard.writeText(htmlSource.value)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1800)
}

const updateHtmlSource = (event: Event) => {
  const nextHtml = (event.target as HTMLTextAreaElement).value
  htmlSource.value = nextHtml
  hasManualHtml.value = nextHtml !== generatedHtml.value
}

const regenerateFromFields = () => {
  const shouldReplace = !hasManualHtml.value || window.confirm(
    'Replace the edited HTML with generated output? Your manual HTML changes will be lost.',
  )
  if (!shouldReplace) return
  hasManualHtml.value = false
  htmlSource.value = generatedHtml.value
}

const addVehicleTwo = () => {
  panel.value.vehicleTwo = createVehicleTwo()
}

const removeVehicleTwo = () => {
  delete panel.value.vehicleTwo
}
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <p class="eyebrow">C/D Spec Panel Builder</p>
      <h1>Specification panel</h1>
      <p class="intro">
        Enter vehicle details, review the output, and copy the HTML.
      </p>
      <p class="draft-status" role="status">{{ draftStatus }}</p>
      <label class="panel-type-control">
        Panel template
        <select v-model="panel.panelType">
          <option value="firstDrive">First Drive</option>
          <option value="testedSpecs">Tested Specs</option>
          <option value="longTerm">Long-Term Test</option>
        </select>
      </label>
    </header>

    <section class="builder-layout" aria-label="Specifications panel builder">
      <div class="vehicle-list">
        <div v-if="validationMessages.length" class="validation-summary" role="status" aria-live="polite">
          <p v-for="message in validationMessages" :key="message">{{ message }}</p>
        </div>
        <article class="builder-card">
          <div class="card-heading">
            <div>
              <p class="eyebrow">Required</p>
              <h2>Vehicle 1</h2>
            </div>

          </div>

          <VehicleForm v-model="panel.vehicleOne" :panel-type="panel.panelType" />
        </article>

        <article v-if="panel.vehicleTwo" class="builder-card">
          <div class="card-heading">
            <div>
              <p class="eyebrow">Optional</p>
              <h2>Vehicle 2</h2>
            </div>

            <button type="button" class="remove-button" @click="removeVehicleTwo">
              Remove vehicle
            </button>
          </div>

          <VehicleForm v-model="panel.vehicleTwo" :panel-type="panel.panelType" />
        </article>

        <button v-else type="button" class="add-vehicle-button" @click="addVehicleTwo">
          Add Vehicle 2
        </button>
      </div>

      <aside class="preview-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Output</p>
            <h2>Preview</h2>
          </div>

          <button type="button" class="copy-button" :disabled="!htmlSource.trim()" @click="copyHtml">
            {{ copied ? 'Copied' : 'Copy HTML' }}
          </button>
        </div>

        <label v-if="panel.panelType !== 'firstDrive'" class="testing-link-toggle">
          <input v-model="panel.testingExplainedEnabled" type="checkbox" />
          Include C/D testing explained link
        </label>
        <div class="preview-content">
          <h3>Rendered preview</h3>
          <iframe
            class="rendered-preview-frame"
            :srcdoc="previewDocument"
            sandbox=""
            title="Rendered specifications HTML preview"
          ></iframe>
          <div class="source-heading">
            <h3>Edit HTML before copying</h3>
            <button
              v-if="hasManualHtml"
              type="button"
              class="regenerate-button"
              @click="regenerateFromFields"
            >
              Regenerate from form
            </button>
          </div>
          <p v-if="hasManualHtml" class="manual-html-status" role="status">
            Manual edits are preserved. Changes to the form will not update this HTML until you regenerate.
          </p>
          <textarea
            :value="htmlSource"
            aria-label="Editable specifications HTML"
            spellcheck="false"
            @input="updateHtmlSource"
          ></textarea>
        </div>
      </aside>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-width: 320px;
  background: #f7f7f4;
  color: #20211f;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
}

:global(button) {
  font: inherit;
}

.app-shell {
  width: min(1440px, calc(100% - 3rem));
  margin: 0 auto;
  padding: 1.5rem 0 3rem;
}

.app-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 16rem;
  column-gap: 2rem;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #d8d9d2;
}

.panel-type-control {
  display: grid;
  grid-column: 2;
  grid-row: 1 / span 3;
  gap: 0.35rem;
  color: #55574f;
  font-size: 0.8rem;
  font-weight: 600;
}

.eyebrow {
  margin: 0 0 0.25rem;
  color: #536455;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.04em;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 0.25rem;
  font-size: clamp(1.5rem, 2.5vw, 2rem);
  line-height: 1.15;
}

h2 {
  margin-bottom: 0;
  font-size: 1.35rem;
}

.intro,
.placeholder-text,
.preview-placeholder p {
  margin-bottom: 0;
  color: #676960;
  font-size: 0.9rem;
  line-height: 1.45;
}

.draft-status {
  grid-column: 1;
  margin: 0.2rem 0 0;
  color: #676960;
  font-size: 0.76rem;
}

.validation-summary {
  display: grid;
  gap: 0.25rem;
  padding: 0.55rem 0.7rem;
  border-left: 2px solid #aa8747;
  background: #f4f0e6;
  color: #5c4b2d;
  font-size: 0.8rem;
}

.validation-summary p {
  margin: 0;
}

.app-header select {
  min-height: 2.45rem;
  padding: 0.45rem 0.6rem;
  border: 1px solid #b8b9b1;
  border-radius: 0.25rem;
  background: #fff;
  color: #20211f;
  font: inherit;
}

.builder-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.85fr);
  align-items: start;
  gap: 2rem;
}

.vehicle-list {
  display: grid;
  gap: 1rem;
}

.builder-card,
.preview-card {
  min-width: 0;
  padding: 0 0 1rem;
  border-bottom: 1px solid #d8d9d2;
  background: transparent;
}

.preview-card {
  position: sticky;
  top: 1rem;
  padding: 0 0 0 1.25rem;
  border-bottom: 0;
  border-left: 1px solid #d8d9d2;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.add-vehicle-button,
.remove-button,
.copy-button {
  min-height: 2.4rem;
  padding: 0.5rem 0.8rem;
  border: 1px solid #aeb5ac;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
}

.add-vehicle-button {
  justify-self: start;
  background: transparent;
  color: #315443;
}

.remove-button {
  background: transparent;
  color: #5a5c55;
}

.copy-button {
  border-color: #315443;
  background: #315443;
  color: #fff;
}

.copy-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.testing-link-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  color: #55574f;
  font-size: 0.82rem;
}

.preview-content {
  display: grid;
  gap: 0.75rem;
}

.preview-content h3 {
  margin: 0;
  font-size: 0.95rem;
}

.rendered-preview-frame {
  display: block;
  width: 100%;
  min-height: 8rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
  background: white;
}

.source-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.manual-html-status {
  margin: -0.35rem 0 0;
  color: #676960;
  font-size: 0.78rem;
  line-height: 1.4;
}

.regenerate-button {
  min-height: 2.1rem;
  padding: 0.35rem 0.6rem;
  border: 1px solid #aeb5ac;
  border-radius: 0.25rem;
  background: transparent;
  color: #315443;
  font: inherit;
  font-size: 0.78rem;
  cursor: pointer;
}

textarea {
  width: 100%;
  min-height: min(52vh, 34rem);
  resize: vertical;
  padding: 0.7rem;
  border: 1px solid #c4c6bf;
  border-radius: 0.25rem;
  background: #fff;
  color: #292b27;
  font: 0.76rem/1.45 ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100% - 2rem, 600px);
    padding: 2rem 0;
  }

  .builder-layout {
    grid-template-columns: 1fr;
  }

  .preview-card {
    position: static;
    padding: 1rem 0 0;
    border-top: 1px solid #d8d9d2;
    border-left: 0;
  }
}

@media (max-width: 520px) {
  .app-header {
    grid-template-columns: 1fr;
    row-gap: 0.75rem;
  }

  .panel-type-control {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>
