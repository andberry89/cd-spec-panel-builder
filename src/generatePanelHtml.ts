import { sectionLabels } from './data/fieldCatalog'
import type { PanelType } from './types/panel'
import type { SectionKey, SpecField, Vehicle, VehicleTypeSpec } from './types/vehicle'

const sectionOrder: SectionKey[] = [
  'price',
  'powertrain',
  'transmission',
  'chassis',
  'dimensions',
  'testing',
  'interiorSound',
  'fuelEconomy',
]

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const populated = (vehicle: Vehicle, key: SectionKey) =>
  vehicle.sections[key].fields.filter((field) => field.value.trim())

const formatValue = (field: SpecField) => {
  const raw = field.value.trim()
  const value = escapeHtml(raw)
  let formattedValue = value
  if (field.unit && !raw.endsWith(field.unit)) {
    const numericWithRemainder = raw.match(/^(\d+(?:\.\d+)?)(.*)$/)
    const unit = escapeHtml(field.unit)
    if (numericWithRemainder && ['engine-power', 'engine-torque', 'combined-power', 'combined-torque'].includes(field.id)) {
      formattedValue = `${numericWithRemainder[1]} ${unit}${escapeHtml(numericWithRemainder[2])}`
    } else {
      formattedValue += ` ${unit}`
    }
  }
  const qualifier = field.qualifier ? ` (${escapeHtml(field.qualifier)})` : ''
  return `${formattedValue}${qualifier}`
}

const outputLabel = (field: SpecField) => {
  if (field.id === 'passenger-volume' || field.id === 'cargo-volume') {
    const count = field.value.split('/').length
    if (count === 1) return field.id === 'passenger-volume' ? 'Passenger Volume' : 'Trunk Volume'
    const rows = count === 2 ? 'F/R' : 'F/M/R'
    return field.id === 'passenger-volume' ? `Passenger Volume, ${rows}` : `Cargo Volume, Behind ${rows}`
  }
  return field.label
}

const row = (field: SpecField) => `${escapeHtml(outputLabel(field))}: ${formatValue(field)}`

const paragraph = (heading: string, lines: string[]) => {
  if (!lines.length) return ''
  return `<p><strong>${heading}</strong><br>\n${lines.join('<br>\n')}</p>`
}

const richHeadingParagraph = (headingHtml: string, lines: string[]) => {
  if (!lines.length) return ''
  return `<p>${headingHtml}<br>\n${lines.join('<br>\n')}</p>`
}

const formatVehicleType = (type: VehicleTypeSpec) => {
  const pieces: string[] = []
  if (type.enginePosition) pieces.push(`${type.enginePosition}-engine`)
  const motors = type.motorPositions
  if (motors.length === 1) pieces.push(`${motors[0]}-motor`)
  else if (motors.length === 2) pieces.push(`${motors[0]}- and ${motors[1]}-motor`)
  else if (motors.length === 3) pieces.push(`${motors[0]}-, ${motors[1]}-, and ${motors[2]}-motor`)
  if (type.driveLayout) pieces.push(`${type.driveLayout}-wheel-drive`)
  if (type.passengers) pieces.push(`${type.passengers}-passenger`)
  if (type.doors) pieces.push(`${type.doors}-door`)
  if (type.bodyStyles.length) pieces.push(type.bodyStyles.join(' or '))
  return pieces.map(escapeHtml).join(', ')
}

const formatPrice = (value: string) => {
  const raw = value.trim()
  const amount = Number(raw.replace(/[$,\s]/g, ''))
  if (raw && Number.isFinite(amount)) {
    return `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(amount)}`
  }
  const escaped = escapeHtml(raw)
  return escaped.startsWith('$') ? escaped : `$${escaped}`
}

const renderPrice = (vehicle: Vehicle, fields: SpecField[], panelType: PanelType) => {
  if (panelType === 'firstDrive') {
    const stylePrices = vehicle.identity.vehicleType.bodyStyles.length > 1
      ? vehicle.identity.vehicleType.bodyStyles.map((style) => ({
          label: style[0]?.toUpperCase() + style.slice(1),
          ...(vehicle.bodyStylePrices[style] ?? { amount: '', estimated: false }),
        }))
      : vehicle.trims.map((trim) => ({ label: trim.name.trim(), ...trim.basePrice }))
    const prices = stylePrices
      .filter((price) => price.amount?.trim())
    const allEstimated = prices.length > 0 && prices.every((price) => price.estimated)
    const lines = prices.map((price) => {
      const qualifier = price.estimated && !allEstimated ? ' <em>(C/D est)</em>' : ''
      return `${price.label ? `${escapeHtml(price.label)}, ` : ''}${formatPrice(price.amount)}${qualifier}`
    })
    const priceLines = lines.length ? [`Base: ${lines.join('; ')}`] : []
    return allEstimated
      ? richHeadingParagraph('<strong>PRICE (<em>C/D</em> EST)</strong>', priceLines)
      : paragraph('PRICE', priceLines)
  }
  return paragraph('PRICE', fields.map((field) =>
    field.id === 'base-price'
      ? `${panelType === 'testedSpecs' ? 'Base/As Tested' : 'Base'}: ${formatValue(field)}`
      : row(field),
  ))
}

const renderPowertrain = (
  fields: SpecField[],
  transmission: SpecField | undefined,
  powertrainType: Vehicle['powertrainType'],
) => {
  fields = fields.filter((field) => {
    const motorField = ['front-motor', 'rear-motor', 'combined-power', 'combined-torque', 'battery-pack', 'onboard-charger', 'peak-charge-rate'].includes(field.id)
    const engineField = ['engine-description', 'displacement', 'engine-power', 'engine-torque'].includes(field.id)
    if (powertrainType === 'combustion' && motorField) return false
    if (powertrainType === 'electric' && engineField) return false
    return true
  })
  const hasMotors = fields.some((field) => field.id === 'front-motor' || field.id === 'rear-motor')
  const engineFields = fields.filter((field) =>
    ['engine-description', 'displacement', 'engine-power', 'engine-torque'].includes(field.id),
  )
  const motorFields = fields.filter((field) =>
    [
      'front-motor',
      'rear-motor',
      'combined-power',
      'combined-torque',
      'battery-pack',
      'onboard-charger',
      'peak-charge-rate',
    ].includes(field.id),
  )
  const output: string[] = []
  if (engineFields.length) {
    output.push(paragraph('ENGINE', engineFields.map((field) =>
      field.id === 'engine-description'
        ? formatValue(field)
        : field.id === 'displacement'
          ? `Displacement: ${field.value.split(',')[0]?.trim()} in<sup>3</sup>, ${field.value.split(',')[1]?.trim()} cm<sup>3</sup>`
          : row(field),
    )))
  }
  if (motorFields.length) {
    const motorLines = motorFields.map(row)
  if (transmission && hasMotors) {
      motorLines.push(`Transmissions, F/R: ${formatValue(transmission)}`)
    }
    output.push(paragraph('POWERTRAIN', motorLines))
  }
  return output.filter(Boolean).join('\n')
}

const renderDimensions = (fields: SpecField[]) =>
  paragraph('DIMENSIONS', fields.map((field) => {
    const label = field.id === 'curb-weight' && field.qualifier === 'C/D est'
      ? `${escapeHtml(field.label)} (<em>C/D</em> est)`
      : escapeHtml(outputLabel(field))
    const valueField = field.id === 'curb-weight' ? { ...field, qualifier: undefined } : field
    return `${label}: ${formatValue(valueField)}`
  }))

const renderTesting = (fields: SpecField[], panelType: PanelType) => {
  const rollout = fields.find((field) => field.id === 'rollout')
  const results = fields.filter((field) => field.id !== 'rollout')
  const quarterMile = results.find((field) => field.id === 'quarter-mile')
  const trap = Number(quarterMile?.value.match(/@\s*(\d+(?:\.\d+)?)/)?.[1])
  const quarterBeforeHundred = trap !== 100 && trap !== 130
  const positions = new Map(results.map((field, index) => [field, index]))
  results.sort((left, right) => {
    const position = (field: SpecField) => {
      if (field.id === 'quarter-mile') return quarterBeforeHundred ? 2 : 3
      if (field.id === 'zero-hundred') return quarterBeforeHundred ? 3 : 2
      return positions.get(field) ?? 0
    }
    return position(left) - position(right)
  })

  const lines = results.map((field) => {
    if (panelType === 'firstDrive') {
      let value = escapeHtml(field.value.trim())
      if (field.id === 'quarter-mile' && /^\d+(?:\.\d+)?/.test(field.value.trim())) {
        value = value.replace(/^(\d+(?:\.\d+)?)(.*)$/, (_, time: string, rest: string) =>
          `${time}${rest.trimStart().startsWith('sec') ? '' : ' sec'}${rest}`,
        )
      } else if (field.unit && !field.value.trim().endsWith(field.unit)) {
        value += ` ${escapeHtml(field.unit)}`
      }
      return `${escapeHtml(field.label)}: ${value}`
    }
    if (field.id === 'top-speed' && field.qualifier) {
      return `${escapeHtml(field.label)} (${escapeHtml(field.qualifier)}): ${escapeHtml(field.value.trim())}${field.unit ? ` ${escapeHtml(field.unit)}` : ''}`
    }
    return row(field)
  })

  if (rollout && panelType !== 'firstDrive') {
    lines.push(`<em>Results above omit 1-ft rollout of ${formatValue(rollout)}.</em>`)
  }
  if (panelType === 'firstDrive') {
    return richHeadingParagraph(
      '<strong>PERFORMANCE (</strong><em><strong>C/D</strong></em><strong> EST)</strong>',
      lines,
    )
  }
  const heading = panelType === 'longTerm'
    ? '<em><strong>C/D</strong></em><strong> TEST RESULTS: NEW</strong>'
    : '<em><strong>C/D</strong></em><strong> TEST RESULTS</strong>'
  return richHeadingParagraph(heading, lines)
}

const renderFuelEconomy = (vehicle: Vehicle, fields: SpecField[]) => {
  const epaIds = ['epa-fuel-economy', 'epa-electricity', 'epa-range']
  const tested = fields.filter((field) => !epaIds.includes(field.id))
  const epa = fields.filter((field) => epaIds.includes(field.id))
  const fuelHeading = vehicle.powertrainType === 'electric'
    ? '<em><strong>C/D</strong></em><strong> FUEL ECONOMY AND CHARGING</strong>'
    : '<em><strong>C/D</strong></em><strong> FUEL ECONOMY</strong>'
  const epaLines = epa.map((field) => {
    const label = field.id === 'epa-fuel-economy'
      ? 'Combined/City/Highway'
      : field.id === 'epa-range'
        ? 'Range'
        : field.label
    const value = field.id === 'epa-fuel-economy'
      ? formatValue({ ...field, unit: vehicle.powertrainType === 'electric' ? 'MPGe' : 'mpg' })
      : formatValue(field)
    return `${escapeHtml(label)}: ${value}`
  })
  return [richHeadingParagraph(fuelHeading, tested.map(row)), paragraph('EPA FUEL ECONOMY', epaLines)]
    .filter(Boolean)
    .join('\n')
}

const renderSection = (vehicle: Vehicle, key: SectionKey, panelType: PanelType) => {
  if (!vehicle.sections[key].enabled) return ''
  if (key === 'price' && panelType === 'firstDrive') {
    return renderPrice(vehicle, populated(vehicle, key), panelType)
  }
  const fields = populated(vehicle, key)
  if (!fields.length) return ''

  if (key === 'price') return renderPrice(vehicle, fields, panelType)
  if (key === 'powertrain') {
    const transmission = vehicle.sections.transmission.enabled
      ? populated(vehicle, 'transmission')[0]
      : undefined
    return renderPowertrain(fields, transmission, vehicle.powertrainType)
  }
  if (key === 'transmission') {
    if (populated(vehicle, 'powertrain').some(
      (field) => field.id === 'front-motor' || field.id === 'rear-motor',
    )) return ''
    return paragraph('TRANSMISSION', fields.map((field) => formatValue(field)))
  }
  if (key === 'dimensions') return renderDimensions(fields)
  if (key === 'testing') return renderTesting(fields, panelType)
  if (key === 'fuelEconomy') {
    const relevantFields = vehicle.powertrainType === 'hybrid'
      ? fields
      : fields.filter((field) => field.id !== 'epa-electricity')
    return renderFuelEconomy(vehicle, relevantFields)
  }

  const heading = key === 'interiorSound' ? 'Interior Sound' : sectionLabels[key].toUpperCase()
  return paragraph(heading, fields.map(row))
}

export const generatePanelHtml = (
  vehicle: Vehicle,
  panelType: PanelType,
  testingExplainedEnabled = true,
) => {
  const { year, make, model } = vehicle.identity
  const trimName = vehicle.identity.includeTrimInHeading ? vehicle.trims[0]?.name.trim() ?? '' : ''
  const identity = [year.trim(), make.trim(), model.trim(), trimName]
    .filter(Boolean)
    .map(escapeHtml)
    .join(' ')
  const vehicleType = formatVehicleType(vehicle.identity.vehicleType)
  const intro = identity || vehicleType
    ? `<p>${identity ? `<strong>${identity}</strong>` : ''}${vehicleType ? `${identity ? '<br>\n' : ''}Vehicle Type: ${vehicleType}` : ''}</p>`
    : ''
  const sections = sectionOrder
    .map((key) => renderSection(vehicle, key, panelType))
    .filter(Boolean)
  const testingLink = panelType !== 'firstDrive' && testingExplainedEnabled
    ? '<p><a class="body-btn-link" href="https://www.caranddriver.com/features/a32018270/how-we-test-cars/" target="_self" data-vars-ga-call-to-action="C/D TESTING EXPLAINED" data-vars-ga-outbound-link="https://www.caranddriver.com/features/a32018270/how-we-test-cars/"><em>C/D</em> TESTING EXPLAINED</a></p>'
    : ''
  return ['<p><strong>Specifications</strong></p>', intro, ...sections, testingLink]
    .filter(Boolean)
    .join('\n')
}
