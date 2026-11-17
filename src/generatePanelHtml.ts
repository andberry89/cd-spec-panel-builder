import { sectionLabels } from './data/fieldCatalog'
import type { PanelType } from './types/panel'
import type { ElectricMotor, EngineEntry, PowertrainVariant, SectionKey, SpecField, Vehicle, VehicleTypeSpec } from './types/vehicle'

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

const joinWithAnd = (items: string[]) => {
  if (items.length < 2) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

const engineDescription = (engine: EngineEntry, multiple = false) => {
  const core: string[] = []
  const details: string[] = []
  const induction: string[] = [...engine.forcedInduction]
  if (engine.intercooled && induction.length) induction.push('intercooled')
  if (induction.length) core.push(joinWithAnd(induction))
  const valveTrain = [engine.valvetrain, engine.valves ? `${engine.valves}-valve` : ''].filter(Boolean).join(' ')
  if (valveTrain) core.push(valveTrain)
  if (multiple && engine.displacementLiters.trim()) {
    core.push(`${engine.displacementLiters.trim()}-liter`)
  }
  core.push(...engine.descriptors)
  if (engine.layout && engine.cylinders.trim()) {
    core.push(`${engine.layout}-${engine.cylinders.trim()}`)
  } else if (engine.layout) {
    core.push(engine.layout)
  } else if (engine.cylinders.trim()) {
    core.push(`${engine.cylinders.trim()}-cylinder`)
  }
  if (!multiple) {
    if (engine.blockMaterial && engine.headMaterial) {
      details.push(`${engine.blockMaterial} block and ${engine.headMaterial} head${engine.pluralHeads ? 's' : ''}`)
    } else if (engine.blockMaterial) {
      details.push(`${engine.blockMaterial} block`)
    } else if (engine.headMaterial) {
      details.push(`${engine.headMaterial} head${engine.pluralHeads ? 's' : ''}`)
    }
    if (engine.fuelInjection) details.push(`${engine.fuelInjection} fuel injection`)
  }
  return escapeHtml([core.join(' '), details.join(', ')].filter(Boolean).join(', '))
}

const engineOutputLine = (engine: EngineEntry, multiple = false) => {
  const description = engineDescription(engine, multiple)
  const parts = description ? [description] : []
  if (multiple) {
    if (engine.power.trim()) parts.push(`${escapeHtml(engine.power.trim())} hp`)
    if (engine.torque.trim()) parts.push(`${escapeHtml(engine.torque.trim())} lb-ft`)
  }
  return parts.join(', ')
}

const renderEngine = (vehicle: Vehicle, headingOverride?: string) => {
  const multiple = vehicle.engine.mode === 'multiple'
  const engines = vehicle.engine.engines
  if (multiple) {
    const lines = engines
      .map((engine) => engineOutputLine(engine, true))
      .filter(Boolean)
    return lines.length ? paragraph(headingOverride ?? 'ENGINES', [lines.join('; ')]) : ''
  }
  const engine = engines[0]
  if (!engine) return ''
  const lines: string[] = []
  const description = engineDescription(engine)
  if (description) lines.push(description)
  const displacement = [
    engine.displacementIn3.trim() ? `${escapeHtml(engine.displacementIn3.trim())} in<sup>3</sup>` : '',
    engine.displacementCm3.trim() ? `${escapeHtml(engine.displacementCm3.trim())} cm<sup>3</sup>` : '',
  ].filter(Boolean)
  if (displacement.length) lines.push(`Displacement: ${displacement.join(', ')}`)
  if (engine.power.trim()) {
    lines.push(`Power: ${escapeHtml(engine.power.trim())} hp${engine.powerRpm.trim() ? ` @ ${escapeHtml(engine.powerRpm.trim())} rpm` : ''}`)
  }
  if (engine.torque.trim()) {
    lines.push(`Torque: ${escapeHtml(engine.torque.trim())} lb-ft${engine.torqueRpm.trim() ? ` @ ${escapeHtml(engine.torqueRpm.trim())} rpm` : ''}`)
  }
  return paragraph(headingOverride ?? 'ENGINE', lines)
}

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
    const prices = vehicle.trims
      .map((trim) => ({ label: trim.name.trim(), ...trim.basePrice }))
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

const enginePowertrainLine = (engine: EngineEntry) => engineOutputLine(engine, true)

const motorOutput = (motor: ElectricMotor) => {
  const values = [
    motor.power.trim() ? `${escapeHtml(motor.power.trim())} hp` : '',
    motor.torque.trim() ? `${escapeHtml(motor.torque.trim())} lb-ft` : '',
  ].filter(Boolean)
  return values
}

const batteryLine = (vehicle: Vehicle, includeCooling: boolean) => {
  const battery = vehicle.electrifiedPowertrain
  const description = [
    includeCooling && battery.batteryCooling ? `${battery.batteryCooling}-cooled` : '',
    battery.batteryChemistry,
  ].filter(Boolean).join(' ')
  const capacity = battery.batteryCapacity.trim()
  if (!description && !capacity) return ''
  return `Battery Pack: ${escapeHtml(description)}${description && capacity ? ', ' : ''}${capacity ? `${escapeHtml(capacity)} kWh` : ''}`
}

const chargeRateLine = (vehicle: Vehicle) => {
  const { peakChargeAC, peakChargeDC } = vehicle.electrifiedPowertrain
  if (!peakChargeAC.trim() || !peakChargeDC.trim()) return ''
  return `Peak Charge Rate, AC/DC: ${escapeHtml(peakChargeAC.trim())}/${escapeHtml(peakChargeDC.trim())} kW`
}

const transmissionLine = (transmission: SpecField | undefined, label: string) =>
  transmission?.value.trim() ? `${label}: ${formatValue(transmission)}` : ''

const hybridMotorLine = (vehicle: Vehicle) => {
  const powertrain = vehicle.electrifiedPowertrain
  const motors = powertrain.motors.slice(0, powertrain.hybridMotorCount)
  const powers = motors.map((motor) => motor.power.trim() ? escapeHtml(motor.power.trim()) : '').filter(Boolean)
  const torques = motors.map((motor) => motor.torque.trim() ? escapeHtml(motor.torque.trim()) : '').filter(Boolean)
  if (!powers.length && !torques.length) return ''
  const count = powertrain.hybridMotorCount === 2 ? '2 ' : ''
  const motorLabel = `${count}${powertrain.hybridMotorCurrent} motor${powertrain.hybridMotorCount === 2 ? 's' : ''}`
  const power = powers.length ? `, ${joinWithAnd(powers)} hp` : ''
  const torque = torques.length ? `, ${joinWithAnd(torques)} lb-ft` : ''
  return `${motorLabel}${power}${torque}`
}

const hybridSystemDetails = (vehicle: Vehicle) => {
  const powertrain = vehicle.electrifiedPowertrain
  const details: string[] = []
  if (powertrain.combinedPower.trim() || powertrain.combinedTorque.trim()) {
    const combined = [
      powertrain.combinedPower.trim() ? `${escapeHtml(powertrain.combinedPower.trim())} hp` : '',
      powertrain.combinedTorque.trim() ? `${escapeHtml(powertrain.combinedTorque.trim())} lb-ft` : '',
    ].filter(Boolean)
    details.push(`combined output: ${combined.join(', ')}`)
  }
  if (powertrain.batteryChemistry || (powertrain.plugInHybrid && powertrain.batteryCapacity.trim())) {
    const pack = [
      powertrain.plugInHybrid && powertrain.batteryCapacity.trim()
        ? `${escapeHtml(powertrain.batteryCapacity.trim())}-kWh`
        : '',
      escapeHtml(powertrain.batteryChemistry),
    ].filter(Boolean)
    details.push(`${pack.join(' ')} battery pack`)
  }
  if (powertrain.plugInHybrid) {
    const charge = chargeRateLine(vehicle).replace(/^Peak Charge Rate, AC\/DC: /, 'peak charge rate, AC/DC ')
    if (charge) details.push(charge)
  }
  return details.length ? ` (${details.join('; ')})` : ''
}

const renderHybridPowertrain = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  const engine = vehicle.engine.engines[0]
  const engineLine = engine ? enginePowertrainLine(engine) : ''
  const motorLine = hybridMotorLine(vehicle)
  const combination = [engineLine, motorLine].filter(Boolean).join(' + ')
  const lines = combination ? [`${combination}${hybridSystemDetails(vehicle)}`] : []
  const transmissionOutput = transmissionLine(transmission, 'Transmission')
  if (transmissionOutput) lines.push(transmissionOutput)
  return paragraph('POWERTRAIN', lines)
}

const variantMotorLine = (variant: PowertrainVariant) => {
  const motors = variant.motors.slice(0, variant.motorCount)
  const powers = motors.map((motor) => motor.power.trim() ? escapeHtml(motor.power.trim()) : '').filter(Boolean)
  const torques = motors.map((motor) => motor.torque.trim() ? escapeHtml(motor.torque.trim()) : '').filter(Boolean)
  if (!powers.length && !torques.length) return ''
  const count = variant.motorCount === 2 ? '2 ' : ''
  const label = `${count}${variant.motorCurrent} motor${variant.motorCount === 2 ? 's' : ''}`
  return `${label}${powers.length ? `, ${joinWithAnd(powers)} hp` : ''}${torques.length ? `, ${joinWithAnd(torques)} lb-ft` : ''}`
}

const variantSystemDetails = (variant: PowertrainVariant, includeCombinedOutput = true) => {
  const details: string[] = []
  if (includeCombinedOutput && (variant.combinedPower.trim() || variant.combinedTorque.trim())) {
    const output = [
      variant.combinedPower.trim() ? `${escapeHtml(variant.combinedPower.trim())} hp` : '',
      variant.combinedTorque.trim() ? `${escapeHtml(variant.combinedTorque.trim())} lb-ft` : '',
    ].filter(Boolean)
    details.push(`combined output: ${output.join(', ')}`)
  }
  if (variant.batteryChemistry) {
    const cooling = variant.batteryCooling ? `${variant.batteryCooling}-cooled ` : ''
    const pack = (variant.type === 'electric' || variant.plugInHybrid) && variant.batteryCapacity.trim()
      ? `${escapeHtml(variant.batteryCapacity.trim())}-kWh ${escapeHtml(variant.batteryChemistry)}`
      : escapeHtml(variant.batteryChemistry)
    details.push(variant.type === 'electric'
      ? `battery pack: ${cooling}${escapeHtml(variant.batteryChemistry)}${variant.batteryCapacity.trim() ? `, ${escapeHtml(variant.batteryCapacity.trim())} kWh` : ''}`
      : `${pack} battery pack`)
  }
  if (variant.type === 'electric' || variant.plugInHybrid) {
    const { peakChargeAC, peakChargeDC } = variant
    if (peakChargeAC.trim() && peakChargeDC.trim()) {
      details.push(`peak charge rate, AC/DC ${escapeHtml(peakChargeAC.trim())}/${escapeHtml(peakChargeDC.trim())} kW`)
    } else if (peakChargeAC.trim()) {
      details.push(`peak charge rate, AC ${escapeHtml(peakChargeAC.trim())} kW`)
    } else if (peakChargeDC.trim()) {
      details.push(`peak charge rate, DC ${escapeHtml(peakChargeDC.trim())} kW`)
    }
  }
  return details.length ? ` (${details.join('; ')})` : ''
}

const formatPowertrainVariant = (variant: PowertrainVariant) => {
  if (variant.type === 'electric') {
    const motors = variant.motors.slice(0, variant.motorCount)
    const lines = motors.map((motor, index) => {
      const output = [
        motor.type ? escapeHtml(motor.type) : '',
        motor.power.trim() ? `${escapeHtml(motor.power.trim())} hp` : '',
        motor.torque.trim() ? `${escapeHtml(motor.torque.trim())} lb-ft` : '',
      ].filter(Boolean)
      if (!output.length) return ''
      const label = variant.motorCount === 1 ? 'Motor' : index === 0 ? 'Front Motor' : 'Rear Motor'
      return `${label}: ${output.join(', ')}`
    }).filter(Boolean)
    if (variant.combinedPower.trim()) lines.push(`Combined Power: ${escapeHtml(variant.combinedPower.trim())} hp`)
    if (variant.combinedTorque.trim()) lines.push(`Combined Torque: ${escapeHtml(variant.combinedTorque.trim())} lb-ft`)
    const details = variantSystemDetails(variant, false).replace(/^ \(/, '').replace(/\)$/, '')
    if (details) lines.push(details)
    return lines.join('; ')
  }
  const engine = enginePowertrainLine(variant.engine)
  if (variant.type === 'combustion') return engine
  const motor = variantMotorLine(variant)
  const combination = [engine, motor].filter(Boolean).join(' + ')
  return `${combination}${variantSystemDetails(variant)}`
}

const renderCombinedPowertrains = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  const onlyOneCombustionEngine = vehicle.powertrainVariants.length === 1
    && vehicle.powertrainVariants[0]?.type === 'combustion'
  if (onlyOneCombustionEngine) {
    const engine = vehicle.powertrainVariants[0]?.engine
    if (!engine) return ''
    return renderEngine({ ...vehicle, engine: { mode: 'single', engines: [engine] } }, 'ENGINES')
  }
  const lines = vehicle.powertrainVariants.map(formatPowertrainVariant).filter(Boolean)
  const hasElectrifiedOption = vehicle.powertrainVariants.some((variant) => variant.type !== 'combustion')
  if (hasElectrifiedOption) {
    const transmissionOutput = transmissionLine(transmission, 'Transmissions')
    if (transmissionOutput) lines.push(transmissionOutput)
  }
  // The heading describes the propulsion systems represented in the options:
  // combustion-only variants are ENGINES; any electrified variant makes them POWERTRAINS.
  const heading = vehicle.powertrainVariants.length > 0
    && vehicle.powertrainVariants.every((variant) => variant.type === 'combustion')
    ? 'ENGINES'
    : 'POWERTRAINS'
  return paragraph(heading, lines)
}

const renderSingleMotorEv = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  const motor = vehicle.electrifiedPowertrain.motors[0]
  const inlinePower = motor.power.trim() && !motor.powerRpm.trim() ? `${escapeHtml(motor.power.trim())} hp` : ''
  const inlineTorque = motor.torque.trim() && !motor.torqueRpm.trim() ? `${escapeHtml(motor.torque.trim())} lb-ft` : ''
  const motorDescription = [motor.type ? escapeHtml(motor.type) : '', inlinePower, inlineTorque].filter(Boolean)
  const lines: string[] = []
  if (motorDescription.length) lines.push(`Motor: ${motorDescription.join(', ')}`)
  if (motor.powerRpm.trim() && motor.power.trim()) {
    lines.push(`Power: ${escapeHtml(motor.power.trim())} hp @ ${escapeHtml(motor.powerRpm.trim())} rpm`)
  }
  if (motor.torqueRpm.trim() && motor.torque.trim()) {
    lines.push(`Torque: ${escapeHtml(motor.torque.trim())} lb-ft @ ${escapeHtml(motor.torqueRpm.trim())} rpm`)
  }
  const battery = batteryLine(vehicle, true)
  if (battery) lines.push(battery)
  const charge = chargeRateLine(vehicle)
  if (charge) lines.push(charge)
  const transmissionOutput = transmissionLine(transmission, 'Transmission')
  if (transmissionOutput) lines.push(transmissionOutput)
  return paragraph('POWERTRAIN', lines)
}

const renderDualMotorEv = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  const { motors, combinedPower, combinedTorque } = vehicle.electrifiedPowertrain
  const lines = motors.map((motor, index) => {
    const description = [motor.type ? escapeHtml(motor.type) : '', ...motorOutput(motor)].filter(Boolean)
    return description.length ? `${index === 0 ? 'Front' : 'Rear'} Motor: ${description.join(', ')}` : ''
  }).filter(Boolean)
  if (combinedPower.trim()) lines.push(`Combined Power: ${escapeHtml(combinedPower.trim())} hp`)
  if (combinedTorque.trim()) lines.push(`Combined Torque: ${escapeHtml(combinedTorque.trim())} lb-ft`)
  const battery = batteryLine(vehicle, true)
  if (battery) lines.push(battery)
  const charge = chargeRateLine(vehicle)
  if (charge) lines.push(charge)
  const transmissionOutput = transmissionLine(transmission, 'Transmissions, F/R')
  if (transmissionOutput) lines.push(transmissionOutput)
  return paragraph('POWERTRAIN', lines)
}

const renderPowertrain = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  switch (vehicle.powertrainType) {
    case 'combustion':
      return renderEngine(vehicle)
    case 'hybrid':
      return renderHybridPowertrain(vehicle, transmission)
    case 'combined':
      return renderCombinedPowertrains(vehicle, transmission)
    case 'electricSingle':
      return renderSingleMotorEv(vehicle, transmission)
    case 'electricDual':
      return renderDualMotorEv(vehicle, transmission)
    default:
      return ''
  }
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
  const isElectric = vehicle.powertrainVariants.length > 0
    && vehicle.powertrainVariants.every((variant) => variant.type === 'electric')
  const hasPhevVariant = vehicle.powertrainType === 'combined'
    && vehicle.powertrainVariants.some((variant) => variant.plugInHybrid)
  const allEpaEstimated = epa.length > 0 && epa.every((field) => field.qualifier === 'C/D est')
  const fuelHeading = isElectric
    ? '<em><strong>C/D</strong></em><strong> FUEL ECONOMY AND CHARGING</strong>'
    : '<em><strong>C/D</strong></em><strong> FUEL ECONOMY</strong>'
  const epaLines = epa.map((field) => {
    const label = field.id === 'epa-fuel-economy'
      ? 'Combined/City/Highway'
      : field.id === 'epa-range'
        ? hasPhevVariant ? 'EV Range (PHEV)' : 'Range'
        : field.label
    const qualifier = field.qualifier === 'C/D est' && !allEpaEstimated
      ? ' <em>(C/D est)</em>'
      : ''
    const valueField = {
      ...field,
      ...(field.id === 'epa-fuel-economy' ? { unit: isElectric ? 'MPGe' : 'mpg' } : {}),
      qualifier: field.qualifier === 'C/D est' && (allEpaEstimated || qualifier) ? undefined : field.qualifier,
    }
    return `${escapeHtml(label)}: ${formatValue(valueField)}${qualifier}`
  })
  const epaSection = allEpaEstimated
    ? richHeadingParagraph('<strong>EPA FUEL ECONOMY (<em>C/D</em> EST)</strong>', epaLines)
    : paragraph('EPA FUEL ECONOMY', epaLines)
  return [richHeadingParagraph(fuelHeading, tested.map(row)), epaSection]
    .filter(Boolean)
    .join('\n')
}

const renderSection = (vehicle: Vehicle, key: SectionKey, panelType: PanelType) => {
  if (!vehicle.sections[key].enabled) return ''
  if (key === 'price' && panelType === 'firstDrive') {
    return renderPrice(vehicle, populated(vehicle, key), panelType)
  }
  const fields = populated(vehicle, key)
  if (key === 'powertrain') {
    const transmission = vehicle.sections.transmission.enabled
      ? populated(vehicle, 'transmission')[0]
      : undefined
    return renderPowertrain(vehicle, transmission)
  }
  if (!fields.length) return ''

  if (key === 'price') return renderPrice(vehicle, fields, panelType)
  if (key === 'transmission') {
    if (vehicle.powertrainVariants.some((variant) => variant.type !== 'combustion')) return ''
    return paragraph('TRANSMISSION', fields.map((field) => formatValue(field)))
  }
  if (key === 'dimensions') return renderDimensions(fields)
  if (key === 'testing') return renderTesting(fields, panelType)
  if (key === 'fuelEconomy') {
    const relevantFields = vehicle.powertrainType === 'combustion'
      ? fields.filter((field) => field.id !== 'epa-electricity')
      : fields
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
