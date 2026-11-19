import { describe, expect, it } from 'vitest'

import { createEmptyFields } from '../data/fieldCatalog'
import { generatePanelHtml } from '../generatePanelHtml'
import type { SectionKey, Vehicle, VehicleSection } from '../types/vehicle'

const sectionKeys: SectionKey[] = [
  'price', 'powertrain', 'transmission', 'chassis', 'dimensions', 'testing', 'interiorSound', 'fuelEconomy', 'warranty',
]

const makeVehicle = (id: string, model: string, bodyStyle = 'wagon'): Vehicle => {
  const sections = Object.fromEntries(sectionKeys.map((key) => [key, {
    enabled: true,
    fields: createEmptyFields(key),
  }])) as Record<SectionKey, VehicleSection>

  return {
    id,
    identity: {
      year: '2022', make: 'Porsche', model, includeTrimInHeading: false,
      vehicleType: {
        enginePosition: 'front', motorPositions: [], driveLayout: 'all',
        passengers: '5', doors: '4', bodyStyles: [bodyStyle],
      },
    },
    powertrainVariants: [{
      id: `${id}-powertrain`, type: 'combustion', plugInHybrid: false,
      engine: {
        forcedInduction: ['turbocharged'], intercooled: true, valvetrain: 'DOHC', valves: '16',
        descriptors: [], layout: 'inline', cylinders: '4', blockMaterial: 'iron',
        headMaterial: 'aluminum', pluralHeads: false, fuelInjection: 'direct',
        displacementIn3: '121', displacementCm3: '1984', displacementLiters: '2.0',
        power: '261', powerRpm: '6500', torque: '295', torqueRpm: '1800',
      },
      motors: [{ type: '', power: '', torque: '' }, { type: '', power: '', torque: '' }],
      motorCount: 2, motorCurrent: 'AC', combinedPower: '', combinedTorque: '',
      batteryChemistry: '', batteryCooling: '', batteryCapacity: '', peakChargeAC: '', peakChargeDC: '',
    }],
    trims: [{ id: `${id}-trim`, name: '', basePrice: { amount: '', estimated: false }, fields: [] }],
    sections,
  }
}

const setField = (vehicle: Vehicle, section: SectionKey, id: string, value: string, extra: { qualifier?: string } = {}) => {
  const field = vehicle.sections[section].fields.find((candidate) => candidate.id === id)
  if (!field) throw new Error(`Missing ${section} field: ${id}`)
  field.value = value
  Object.assign(field, extra)
}

describe('generatePanelHtml', () => {
  it('renders two tested-spec vehicles under one heading with the testing link between them', () => {
    const macan = makeVehicle('macan', 'Macan')
    const macanS = makeVehicle('macan-s', 'Macan S')
    setField(macan, 'price', 'base-price', '$56,250/$63,270')
    setField(macanS, 'price', 'base-price', '$66,750/$73,040')

    const html = generatePanelHtml([macan, macanS], 'testedSpecs')
    const heading = '<p><strong>Specifications</strong></p>'
    const testingLink = 'C/D TESTING EXPLAINED'

    expect(html.match(/<strong>Specifications<\/strong>/g)).toHaveLength(1)
    expect(html.indexOf('2022 Porsche Macan</strong>')).toBeLessThan(html.indexOf(testingLink))
    expect(html.indexOf(testingLink)).toBeLessThan(html.indexOf('2022 Porsche Macan S</strong>'))
    expect(html.match(/C\/D TESTING EXPLAINED/g)).toHaveLength(1)
    expect(html).toContain('Base/As Tested: $56,250/$63,270')
    expect(html).toContain('Base/As Tested: $66,750/$73,040')
    expect(html.startsWith(heading)).toBe(true)
  })

  it('formats the Macan specification details, cubic units, tire split, and acceleration order', () => {
    const vehicle = makeVehicle('macan', 'Macan')
    setField(vehicle, 'transmission', 'transmission', '7-speed dual-clutch automatic')
    setField(vehicle, 'chassis', 'suspension', 'multilink/multilink')
    setField(vehicle, 'chassis', 'brakes', '13.8-in vented disc/13.0-in vented disc')
    setField(vehicle, 'chassis', 'tire-model', 'Michelin Pilot Sport 4')
    setField(vehicle, 'chassis', 'tire-size', '235/55R-19 101Y NEO / 255/50R-19 103Y NEO')
    setField(vehicle, 'dimensions', 'passenger-volume', '96')
    setField(vehicle, 'dimensions', 'cargo-volume', '17')
    setField(vehicle, 'testing', 'zero-sixty', '5.0')
    setField(vehicle, 'testing', 'zero-hundred', '14.4')
    setField(vehicle, 'testing', 'quarter-mile', '13.7 sec @ 98 mph')
    setField(vehicle, 'testing', 'rollout', '0.2')
    setField(vehicle, 'fuelEconomy', 'epa-fuel-economy', '21/19/25')

    const html = generatePanelHtml([vehicle], 'testedSpecs')
    expect(html).toContain('turbocharged and intercooled DOHC 16-valve inline-4, iron block and aluminum head, direct fuel injection')
    expect(html).toContain('Displacement: 121 in<sup>3</sup>, 1984 cm<sup>3</sup>')
    expect(html).toContain('Suspension, F/R: multilink/multilink')
    expect(html).toContain('Tires: Michelin Pilot Sport 4')
    expect(html).toContain('F: 235/55R-19 101Y NEO<br>')
    expect(html).toContain('R: 255/50R-19 103Y NEO')
    expect(html).toContain('Passenger Volume: 96 ft<sup>3</sup>')
    expect(html).toContain('Cargo Volume: 17 ft<sup>3</sup>')
    expect(html.indexOf('1/4-Mile: 13.7 sec @ 98 mph')).toBeLessThan(html.indexOf('100 mph: 14.4 sec'))
    expect(html).toContain('omit </em><a href="https://www.caranddriver.com/features/a30085446/acceleration-testing-procedure-change-rollout/"')
    expect(html).toContain('Combined/City/Highway: 21/19/25 mpg')
  })

  it('orders a quarter-mile after the 100-mph result when its trap speed is at least 100 mph', () => {
    const vehicle = makeVehicle('corvette', 'Corvette Stingray', 'targa')
    setField(vehicle, 'dimensions', 'cargo-volume', '13')
    setField(vehicle, 'testing', 'zero-hundred', '6.9')
    setField(vehicle, 'testing', 'quarter-mile', '11.0 sec @ 124 mph')

    const html = generatePanelHtml([vehicle], 'testedSpecs')
    expect(html).toContain('Trunk Volume: 13 ft<sup>3</sup>')
    expect(html.indexOf('100 mph: 6.9 sec')).toBeLessThan(html.indexOf('1/4-Mile: 11.0 sec @ 124 mph'))
  })

  it('formats electric powertrain and estimated EPA output', () => {
    const vehicle = makeVehicle('ev', 'GT 4-Door Coupe')
    vehicle.identity.vehicleType.enginePosition = ''
    vehicle.identity.vehicleType.motorPositions = ['front', 'rear']
    vehicle.identity.vehicleType.bodyStyles = ['hatchback']
    vehicle.powertrainVariants = [{
      ...vehicle.powertrainVariants[0]!,
      type: 'electric',
      motorCount: 2,
      motors: [
        { type: 'permanent-magnet synchronous AC', power: '302', torque: '' },
        { type: 'permanent-magnet synchronous AC', power: '402', torque: '' },
      ],
      combinedPower: '805', combinedTorque: '1372', batteryChemistry: 'lithium-ion',
      batteryCooling: 'liquid', batteryCapacity: '106', peakChargeAC: '11.0', peakChargeDC: '600',
    }]
    setField(vehicle, 'fuelEconomy', 'epa-fuel-economy', '85–92/90–95/80–90', { qualifier: 'C/D est' })
    setField(vehicle, 'fuelEconomy', 'epa-range', '314–325', { qualifier: 'C/D est' })
    vehicle.sections.transmission.fields[0]!.value = 'direct-drive'

    const html = generatePanelHtml([vehicle], 'testedSpecs')
    expect(html).toContain('Vehicle Type: front- and rear-motor, all-wheel-drive, 5-passenger, 4-door, hatchback')
    expect(html).toContain('Front Motor: permanent-magnet synchronous AC, 302 hp')
    expect(html).toContain('Rear Motor: permanent-magnet synchronous AC, 402 hp')
    expect(html).toContain('Battery Pack: liquid-cooled lithium-ion, 106 kWh')
    expect(html).toContain('Peak Charge Rate, AC/DC: 11.0/600 kW')
    expect(html).toContain('Combined/City/Highway: 85–92/90–95/80–90 MPGe')
    expect(html).toContain('Range: 314–325 mi')
    expect(html).toContain('EPA FUEL ECONOMY (<em>C/D</em> EST)')
  })

  it('escapes entered text and omits disabled or empty sections', () => {
    const vehicle = makeVehicle('escape', '<Model>')
    setField(vehicle, 'price', 'options', '<script>alert("x")</script>')
    vehicle.sections.chassis.enabled = false

    const html = generatePanelHtml([vehicle], 'testedSpecs', false)
    expect(html).toContain('2022 Porsche &lt;Model&gt;')
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<strong>CHASSIS</strong>')
    expect(html).not.toContain('C/D TESTING EXPLAINED')
  })

  it('does not add the tested-spec link to First Drive panels', () => {
    const html = generatePanelHtml([makeVehicle('first-drive', 'Macan')], 'firstDrive')
    expect(html).not.toContain('C/D TESTING EXPLAINED')
  })

  it('renders populated First Drive trim details with their trim and preserves ranges and alternatives', () => {
    const vehicle = makeVehicle('first-drive-trims', 'Corvette')
    vehicle.trims = [
      {
        id: 'stingray', name: 'Stingray', basePrice: { amount: '73795', estimated: false },
        fields: [
          { id: 'options', label: 'Options', value: 'Z51 package, $5,395; Magnetic Ride Control, $1,895' },
          { id: 'range', label: 'Power', value: '490–495 hp' },
          { id: 'blank', label: 'Ignored field', value: '   ' },
          { id: 'unsafe', label: '<script>', value: '<Base> or <Sport>' },
        ],
      },
      {
        id: 'z06', name: 'Z06', basePrice: { amount: '112100', estimated: true },
        fields: [{ id: 'track', label: 'Track package', value: 'Carbon-fiber aero or Z07 package' }],
      },
    ]

    const html = generatePanelHtml([vehicle], 'firstDrive')
    expect(html).toContain('<strong>Stingray</strong><br>\nOptions: Z51 package, $5,395; Magnetic Ride Control, $1,895')
    expect(html).toContain('Power: 490–495 hp')
    expect(html).toContain('<strong>Z06</strong><br>\nTrack package: Carbon-fiber aero or Z07 package')
    expect(html).toContain('&lt;script&gt;: &lt;Base&gt; or &lt;Sport&gt;')
    expect(html).not.toContain('Ignored field')
  })

  it('matches the First Drive hybrid, range, estimate, and split cargo format', () => {
    const vehicle = makeVehicle('x5', 'X5 40')
    vehicle.identity.year = '2027'
    vehicle.identity.make = 'BMW'
    vehicle.identity.vehicleType.driveLayout = 'rear-or-all'
    vehicle.trims = [
      { id: 'sdrive', name: 'sDrive', basePrice: { amount: '71250', estimated: false }, fields: [] },
      { id: 'xdrive', name: 'xDrive', basePrice: { amount: '73550', estimated: false }, fields: [] },
    ]
    vehicle.powertrainVariants[0]!.type = 'hybrid'
    vehicle.powertrainVariants[0]!.motorCount = 1
    vehicle.powertrainVariants[0]!.engine = {
      ...vehicle.powertrainVariants[0]!.engine,
      valves: '24', descriptors: ['Miller-cycle'], displacementLiters: '3.0', layout: 'inline', cylinders: '6',
      power: '394', torque: '398', blockMaterial: '', headMaterial: '', fuelInjection: '',
    }
    vehicle.powertrainVariants[0]!.motors[0] = { type: '', power: '17', torque: '148' }
    vehicle.powertrainVariants[0]!.combinedPower = '394'
    vehicle.powertrainVariants[0]!.combinedTorque = '428'
    setField(vehicle, 'transmission', 'transmission', '8-speed automatic')
    setField(vehicle, 'dimensions', 'cargo-volume', '68/27')
    setField(vehicle, 'testing', 'zero-sixty', '4.7–4.8 sec')
    setField(vehicle, 'testing', 'zero-hundred', '11.2–11.3 sec')
    setField(vehicle, 'testing', 'quarter-mile', '13.3–13.4 sec')
    setField(vehicle, 'fuelEconomy', 'epa-fuel-economy', '26/24/28', { qualifier: 'C/D est' })

    const html = generatePanelHtml([vehicle], 'firstDrive')
    expect(html).toContain('Vehicle Type: front-engine, rear- or all-wheel-drive, 5-passenger, 4-door, wagon')
    expect(html).toContain('Base: sDrive, $71,250; xDrive, $73,550')
    expect(html).toContain('Miller-cycle 3.0-liter inline-6, 394 hp, 398 lb-ft + AC motor, 17 hp, 148 lb-ft (combined output: 394 hp, 428 lb-ft)')
    expect(html).toContain('Transmission: 8-speed automatic')
    expect(html).toContain('Cargo Volume, Behind F/R: 68/27 ft<sup>3</sup>')
    expect(html.indexOf('60 mph: 4.7–4.8 sec')).toBeLessThan(html.indexOf('100 mph: 11.2–11.3 sec'))
    expect(html.indexOf('100 mph: 11.2–11.3 sec')).toBeLessThan(html.indexOf('1/4-Mile: 13.3–13.4 sec'))
    expect(html).toContain('EPA FUEL ECONOMY (<em>C/D</em> EST)')
  })

  it('matches Long-Term price, engine, tire, test, economy, and warranty formatting', () => {
    const vehicle = makeVehicle('ranger', 'Ranger Raptor')
    vehicle.identity.year = '2026'
    vehicle.identity.make = 'Ford'
    vehicle.powertrainVariants[0]!.engine = {
      ...vehicle.powertrainVariants[0]!.engine,
      valves: '24', descriptors: [], layout: 'V', cylinders: '6', blockMaterial: 'iron-and-aluminum',
      headMaterial: 'aluminum', pluralHeads: true, displacementIn3: '180', displacementCm3: '2956',
      power: '405', powerRpm: '5500', torque: '430', torqueRpm: '3500',
    }
    setField(vehicle, 'price', 'base-price', '$58,965/$60,415')
    setField(vehicle, 'chassis', 'tire-size', 'LT285/70R-17 116/113S M+S 3PMSF')
    setField(vehicle, 'dimensions', 'cargo-volume', '68/27')
    setField(vehicle, 'testing', 'zero-sixty', '5.2')
    setField(vehicle, 'testing', 'quarter-mile', '13.9 sec @ 98 mph')
    setField(vehicle, 'testing', 'zero-hundred', '14.6')
    setField(vehicle, 'testing', 'rollout', '0.3')
    setField(vehicle, 'testing', 'top-speed', '105', { qualifier: 'gov ltd' })
    setField(vehicle, 'fuelEconomy', 'observed-fuel-economy', '14 mpg')
    setField(vehicle, 'fuelEconomy', 'unscheduled-oil-additions', '0')
    setField(vehicle, 'fuelEconomy', 'epa-fuel-economy', '17/16/18')
    setField(vehicle, 'warranty', 'bumper-to-bumper', '3 years/36,000 miles')
    setField(vehicle, 'warranty', 'powertrain-warranty', '5 years/60,000 miles')

    const html = generatePanelHtml([vehicle], 'longTerm')
    expect(html).toContain('Base/As Tested: $58,965/$60,415')
    expect(html).toContain('iron and aluminum block and aluminum heads')
    expect(html).toContain('LT285/70R-17 116/113S M+S 3PMSF')
    expect(html).not.toContain('Tire Size, F/R:')
    expect(html).toContain('C/D</strong></em><strong> TEST RESULTS: NEW')
    expect(html).toContain('Top Speed (gov ltd): 105 mph')
    expect(html).toContain('Unscheduled Oil Additions: 0 qt')
    expect(html).toContain('<strong>WARRANTY</strong><br>')
    expect(html).toContain('3 years/36,000 miles bumper to bumper')
    expect(html).toContain('5 years/60,000 miles powertrain')
    expect(html.indexOf('WARRANTY')).toBeLessThan(html.indexOf('C/D TESTING EXPLAINED'))
  })

  it('uses split passenger and cargo labels and emits scheduled maintenance warranty', () => {
    const vehicle = makeVehicle('passport', 'Passport TrailSport Elite')
    vehicle.identity.year = '2026'
    vehicle.identity.make = 'Honda'
    setField(vehicle, 'dimensions', 'passenger-volume', '58/58')
    setField(vehicle, 'dimensions', 'cargo-volume', '83/44')
    setField(vehicle, 'warranty', 'scheduled-maintenance', '1 years/12,000 miles')
    const html = generatePanelHtml([vehicle], 'longTerm')
    expect(html).toContain('Passenger Volume, F/R: 58/58 ft<sup>3</sup>')
    expect(html).toContain('Cargo Volume, Behind F/R: 83/44 ft<sup>3</sup>')
    expect(html).toContain('1 years/12,000 miles scheduled maintenance')
  })
})
