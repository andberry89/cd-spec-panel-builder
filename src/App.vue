<script setup lang="ts">
import { ref } from 'vue'
import VehicleForm from './components/VehicleForm.vue'
import type { Panel } from './types/panel'
import type { SectionKey, VehicleSection } from './types/vehicle'

const createSection = (): VehicleSection => ({
  enabled: true,
  fields: [],
})

const createSections = (): Record<SectionKey, VehicleSection> => ({
  price: createSection(),
  powertrain: createSection(),
  chassis: createSection(),
  dimensions: createSection(),
  testing: createSection(),
  interiorSound: createSection(),
  fuelEconomy: createSection(),
})

const panel = ref<Panel>({
  vehicleOne: {
    id: 'vehicle-one',
    identity: {
      year: '2026',
      make: 'Ford',
      model: 'Mustang',
    },
    powertrainType: 'combustion',
    trims: [
      {
        id: 'trim-one',
        name: 'GT',
        fields: [],
      },
    ],
    sections: createSections(),
  },
  testingExplainedEnabled: false,
  generatedHtml: '',
})
</script>

<template>
  <main class="app-shell">
    <header class="app-header">
      <p class="eyebrow">C/D Spec Panel Builder</p>
      <h1>Build a vehicle specifications panel</h1>
      <p class="intro">
        Enter structured vehicle data and generate clean HTML for the publishing workflow.
      </p>
    </header>

    <section class="builder-layout" aria-label="Specifications panel builder">
      <article class="builder-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Required</p>
            <h2>Vehicle 1</h2>
          </div>

          <span class="status-badge">In progress</span>
        </div>

        <VehicleForm v-model="panel.vehicleOne" />
      </article>

      <aside class="preview-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Output</p>
            <h2>Preview</h2>
          </div>

          <span class="status-badge">Empty</span>
        </div>

        <div class="preview-placeholder">
          <p>Generated specifications HTML will appear here.</p>
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

button {
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 0.5rem;
  background: #d8d0c5;
  color: #6a6258;
  cursor: not-allowed;
}

.preview-placeholder {
  display: grid;
  min-height: 160px;
  place-items: center;
  padding: 1.5rem;
  border: 1px dashed #c8beb1;
  border-radius: 0.75rem;
  text-align: center;
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
