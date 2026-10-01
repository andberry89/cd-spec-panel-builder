<script setup lang="ts">
import { computed, ref } from 'vue'
import VehicleForm from './components/VehicleForm.vue'
import type { Panel } from './types/panel'
import type { SectionKey, Vehicle, VehicleSection, VehicleTypeSpec } from './types/vehicle'
import { createEmptyFields } from './data/fieldCatalog'
import { generatePanelHtml } from './generatePanelHtml'

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

const createSections = (): Record<SectionKey, VehicleSection> => ({
  price: { ...createSection(), fields: createEmptyFields('price') },
  powertrain: { ...createSection(), fields: createEmptyFields('powertrain') },
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
  powertrainType: 'combustion',
  trims: [
    {
      id: 'vehicle-two-trim-one',
      name: '',
      basePrice: { amount: '', estimated: false },
      fields: [],
    },
  ],
  bodyStylePrices: {},
  sections: createSections(),
})

const panel = ref<Panel>({
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
    powertrainType: 'combustion',
    trims: [
      {
        id: 'trim-one',
        name: '',
        basePrice: { amount: '', estimated: false },
        fields: [],
      },
    ],
    bodyStylePrices: {},
    sections: createSections(),
  },
  testingExplainedEnabled: true,
  generatedHtml: '',
})

const generatedHtml = computed(() =>
  [panel.value.vehicleOne, panel.value.vehicleTwo]
    .filter((vehicle): vehicle is Vehicle => Boolean(vehicle))
  .map((vehicle) =>
    generatePanelHtml(vehicle, panel.value.panelType, panel.value.testingExplainedEnabled),
  )
    .join('\n<hr>\n'),
)
const copied = ref(false)

const copyHtml = async () => {
  await navigator.clipboard.writeText(generatedHtml.value)
  copied.value = true
  window.setTimeout(() => (copied.value = false), 1800)
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
      <h1>Build a vehicle specifications panel</h1>
      <p class="intro">
        Enter structured vehicle data and generate clean HTML for the publishing workflow.
      </p>
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
        <article class="builder-card">
          <div class="card-heading">
            <div>
              <p class="eyebrow">Required</p>
              <h2>Vehicle 1</h2>
            </div>

            <span class="status-badge">Live</span>
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

          <button type="button" class="copy-button" :disabled="!generatedHtml" @click="copyHtml">
            {{ copied ? 'Copied' : 'Copy HTML' }}
          </button>
        </div>

        <label v-if="panel.panelType !== 'firstDrive'" class="testing-link-toggle">
          <input v-model="panel.testingExplainedEnabled" type="checkbox" />
          Include C/D testing explained link
        </label>
        <div class="preview-content">
          <h3>Rendered preview</h3>
          <div class="rendered-preview" v-html="generatedHtml"></div>
          <h3>HTML</h3>
          <textarea :value="generatedHtml" readonly aria-label="Generated specifications HTML"></textarea>
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
  background: #f4f1eb;
  color: #202124;
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
  width: min(1200px, calc(100% - 3rem));
  margin: 0 auto;
  padding: 4rem 0;
}

.app-header {
  max-width: 720px;
  margin-bottom: 2rem;
}

.panel-type-control {
  display: grid;
  max-width: 22rem;
  gap: 0.4rem;
  color: #6a6258;
  font-size: 0.9rem;
  font-weight: 700;
}

.eyebrow {
  margin: 0 0 0.5rem;
  color: #6a6258;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin-top: 0;
}

h1 {
  margin-bottom: 1rem;
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1.05;
}

h2 {
  margin-bottom: 0;
  font-size: 1.35rem;
}

.intro,
.placeholder-text,
.preview-placeholder p {
  color: #6a6258;
  line-height: 1.6;
}

.builder-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 1.5rem;
}

.vehicle-list {
  display: grid;
  gap: 1.5rem;
}

.builder-card,
.preview-card {
  min-height: 300px;
  padding: 1.5rem;
  border: 1px solid #d8d0c5;
  border-radius: 1rem;
  background: #fffdf9;
  box-shadow: 0 0.75rem 2rem rgb(64 51 35 / 6%);
}

.card-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-badge {
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  background: #ebe5dc;
  color: #6a6258;
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
}

.add-vehicle-button,
.remove-button,
.copy-button {
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
}

.add-vehicle-button {
  width: 100%;
  background: #202124;
  color: #fffdf9;
}

.remove-button {
  background: #ebe5dc;
  color: #6a6258;
}

.copy-button {
  background: #202124;
  color: #fffdf9;
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
  color: #6a6258;
  font-size: 0.9rem;
}

.preview-content {
  display: grid;
  gap: 0.75rem;
}

.preview-content h3 {
  margin: 0;
  font-size: 0.95rem;
}

.rendered-preview {
  min-height: 8rem;
  padding: 1rem;
  border: 1px solid #d8d0c5;
  border-radius: 0.75rem;
  background: white;
  color: #202124;
  font-family: Georgia, serif;
  line-height: 1.45;
}

textarea {
  width: 100%;
  min-height: 18rem;
  resize: vertical;
  padding: 0.85rem;
  border: 1px solid #c8beb1;
  border-radius: 0.5rem;
  background: #202124;
  color: #f4f1eb;
  font: 0.78rem/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
}

@media (max-width: 760px) {
  .app-shell {
    width: min(100% - 2rem, 600px);
    padding: 2rem 0;
  }

  .builder-layout {
    grid-template-columns: 1fr;
  }
}
</style>
