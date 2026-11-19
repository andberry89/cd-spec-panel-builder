import type { PanelType } from './types/panel'
import type { EngineEntry, PowertrainVariant, SectionKey, SpecField, Vehicle, VehicleTypeSpec } from './types/vehicle'

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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const formatUnit = (unit: string) =>
  unit === 'ft³'
    ? 'ft<sup>3</sup>'
    : unit === 'in³'
      ? 'in<sup>3</sup>'
      : unit === 'cm³'
        ? 'cm<sup>3</sup>'
        : escapeHtml(unit)

const populated = (vehicle: Vehicle, key: SectionKey) =>
  vehicle.sections[key].fields.filter((field) => field.value.trim())

const formatValue = (field: SpecField) => {
  const raw = field.value.trim()
  const value = escapeHtml(raw)
  let formattedValue = value
  if (field.unit && !raw.endsWith(field.unit)) {
    const numericWithRemainder = raw.match(/^(\d+(?:\.\d+)?)(.*)$/)
    const unit = formatUnit(field.unit)
    if (numericWithRemainder && ['engine-power', 'engine-torque', 'combined-power', 'combined-torque'].includes(field.id)) {
      formattedValue = `${numericWithRemainder[1] ?? ''} ${unit}${escapeHtml(numericWithRemainder[2] ?? '')}`
    } else {
      formattedValue += ` ${unit}`
    }
  }
  const qualifier = field.qualifier
    ? field.qualifier === 'C/D est' ? ' (<em>C/D</em> est)' : ` (${escapeHtml(field.qualifier)})`
    : ''
  return `${formattedValue}${qualifier}`
}

const outputLabel = (field: SpecField, vehicle?: Vehicle) => {
  if (field.id === 'passenger-volume') {
    const count = field.value.split('/').length
    if (count === 1) return 'Passenger Volume'
    const rows = count === 2 ? 'F/R' : 'F/M/R'
    return `Passenger Volume, ${rows}`
  }
  if (field.id === 'cargo-volume') {
    const styles = vehicle?.identity.vehicleType.bodyStyles ?? []
    return styles.some((style) => ['coupe', 'convertible', 'targa'].includes(style))
      ? 'Trunk Volume'
      : 'Cargo Volume'
  }
  return field.label
}

const row = (field: SpecField, vehicle?: Vehicle) => `${escapeHtml(outputLabel(field, vehicle))}: ${formatValue(field)}`

const joinWithAnd = (items: string[]) => {
  if (items.length < 2) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1] ?? ''}`
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

const renderEngine = (engine: EngineEntry, heading = 'ENGINE') => {
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
  return paragraph(heading, lines)
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
    const trimDetails = vehicle.trims.flatMap((trim) => {
      const fields = trim.fields.filter((field) => field.label.trim() && field.value.trim())
      if (!fields.length) return []
      return [
        `<strong>${escapeHtml(trim.name.trim() || 'Trim details')}</strong>`,
        ...fields.map((field) => row(field)),
      ]
    })
    const outputLines = [...priceLines, ...trimDetails]
    return allEstimated
      ? richHeadingParagraph('<strong>PRICE (<em>C/D</em> EST)</strong>', outputLines)
      : paragraph('PRICE', outputLines)
  }
  return paragraph('PRICE', fields.map((field) =>
    field.id === 'base-price'
      ? `${panelType === 'testedSpecs' ? 'Base/As Tested' : 'Base'}: ${formatValue(field)}`
      : row(field),
  ))
}

const enginePowertrainLine = (engine: EngineEntry) => engineOutputLine(engine, true)

const transmissionLine = (transmission: SpecField | undefined, label: string) =>
  transmission?.value.trim() ? `${label}: ${formatValue(transmission)}` : ''

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

const formatPowertrainVariant = (variant: PowertrainVariant): string[] => {
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
    if (variant.batteryChemistry || variant.batteryCapacity.trim()) {
      const battery = [
        variant.batteryCooling ? `${variant.batteryCooling}-cooled` : '',
        variant.batteryChemistry,
      ].filter(Boolean).join(' ')
      lines.push(`Battery Pack: ${escapeHtml(battery)}${battery && variant.batteryCapacity.trim() ? ', ' : ''}${variant.batteryCapacity.trim() ? `${escapeHtml(variant.batteryCapacity.trim())} kWh` : ''}`)
    }
    if (variant.peakChargeAC.trim() || variant.peakChargeDC.trim()) {
      const rate = variant.peakChargeAC.trim() && variant.peakChargeDC.trim()
        ? `AC/DC: ${escapeHtml(variant.peakChargeAC.trim())}/${escapeHtml(variant.peakChargeDC.trim())}`
        : variant.peakChargeAC.trim()
          ? `AC: ${escapeHtml(variant.peakChargeAC.trim())}`
          : `DC: ${escapeHtml(variant.peakChargeDC.trim())}`
      lines.push(`Peak Charge Rate, ${rate} kW`)
    }
    return lines
  }
  const engine = enginePowertrainLine(variant.engine)
  if (variant.type === 'combustion') return engine ? [engine] : []
  const motor = variantMotorLine(variant)
  const combination = [engine, motor].filter(Boolean).join(' + ')
  const line = `${combination}${variantSystemDetails(variant)}`
  return line.trim() ? [line] : []
}

const renderCombinedPowertrains = (vehicle: Vehicle, transmission: SpecField | undefined) => {
  const onlyOneCombustionEngine = vehicle.powertrainVariants.length === 1
    && vehicle.powertrainVariants[0]?.type === 'combustion'
  if (onlyOneCombustionEngine) {
    const engine = vehicle.powertrainVariants[0]?.engine
    if (!engine) return ''
    return renderEngine(engine)
  }
  const lines = vehicle.powertrainVariants.flatMap(formatPowertrainVariant)
  const hasElectrifiedOption = vehicle.powertrainVariants.some((variant) => variant.type !== 'combustion')
  if (hasElectrifiedOption) {
    const hasFrontRearMotors = vehicle.powertrainVariants.some((variant) => variant.type === 'electric' && variant.motorCount === 2)
    const transmissionOutput = transmissionLine(transmission, hasFrontRearMotors ? 'Transmissions, F/R' : 'Transmission')
    if (transmissionOutput) lines.push(transmissionOutput)
  }
  const heading = vehicle.powertrainVariants.length > 0
    && vehicle.powertrainVariants.every((variant) => variant.type === 'combustion')
    ? 'ENGINES'
    : 'POWERTRAIN'
  return paragraph(heading, lines)
}

const renderDimensions = (vehicle: Vehicle, fields: SpecField[]) =>
  paragraph('DIMENSIONS', fields.map((field) => {
    const label = field.id === 'curb-weight' && field.qualifier === 'C/D est'
      ? `${escapeHtml(field.label)} (<em>C/D</em> est)`
      : escapeHtml(outputLabel(field, vehicle))
    const valueField = field.id === 'curb-weight' ? { ...field, qualifier: undefined } : field
    return `${label}: ${formatValue(valueField)}`
  }))

const renderChassis = (fields: SpecField[]) => {
  const lines = fields.flatMap((field) => {
    if (field.id !== 'tire-size') return [row(field)]
    const [front, ...rearParts] = field.value.split(/\s+\/\s+/)
    const rear = rearParts.join('/').trim()
    if (!rear) return [row(field)]
    return [
      front?.trim() ? `F: ${escapeHtml(front.trim())}` : '',
      rear ? `R: ${escapeHtml(rear)}` : '',
    ].filter(Boolean)
  })
  return paragraph('CHASSIS', lines)
}

const renderTesting = (fields: SpecField[], panelType: PanelType) => {
  const rollout = fields.find((field) => field.id === 'rollout')
  const results = fields.filter((field) => field.id !== 'rollout')
  const quarterMile = results.find((field) => field.id === 'quarter-mile')
  const trap = Number(quarterMile?.value.match(/@\s*(\d+(?:\.\d+)?)/)?.[1])
  const quarterBeforeHundred = !Number.isFinite(trap) || trap < 100
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
    const quarterMile = field.id === 'quarter-mile'
      ? field.value.trim().match(/^(\d+(?:\.\d+)?)(.*)$/)
      : null
    const quarterMileValue = quarterMile
      ? `${escapeHtml(quarterMile[1] ?? '')} sec${quarterMile[2]?.trim().replace(/^sec(?:ond)?s?/i, '') ? ` ${escapeHtml(quarterMile[2].trim().replace(/^sec(?:ond)?s?/i, '').trim())}` : ''}`
      : ''
    if (panelType === 'firstDrive') {
      let value = escapeHtml(field.value.trim())
      if (quarterMile) {
        value = quarterMileValue
      } else if (field.unit && !field.value.trim().endsWith(field.unit)) {
        value += ` ${escapeHtml(field.unit)}`
      }
      return `${escapeHtml(field.label)}: ${value}`
    }
    if (field.id === 'top-speed' && field.qualifier) {
      const qualifier = field.qualifier === 'C/D est' ? ' (<em>C/D</em> est)' : ` (${escapeHtml(field.qualifier)})`
      const unit = field.unit && !field.value.trim().endsWith(field.unit) ? ` ${formatUnit(field.unit)}` : ''
      return `${escapeHtml(field.label)}${qualifier}: ${escapeHtml(field.value.trim())}${unit}`
    }
    if (quarterMile) return `${escapeHtml(field.label)}: ${quarterMileValue}`
    return row(field)
  })

  if (rollout && panelType !== 'firstDrive') {
    const rolloutValue = formatValue({ ...rollout, qualifier: undefined })
    lines.push(`<em>Results above omit </em><a href="https://www.caranddriver.com/features/a30085446/acceleration-testing-procedure-change-rollout/" target="_self"><em>1-ft rollout</em></a><em> of ${rolloutValue}.</em>`)
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

const renderFuelEconomy = (vehicle: Vehicle, fields: SpecField[], interiorSound: SpecField[] = []) => {
  const epaIds = ['epa-fuel-economy', 'epa-electricity', 'epa-range']
  const tested = fields.filter((field) => !epaIds.includes(field.id))
  const epa = fields.filter((field) => epaIds.includes(field.id))
  const isElectric = vehicle.powertrainVariants.length > 0
    && vehicle.powertrainVariants.every((variant) => variant.type === 'electric')
  const hasPhevVariant = vehicle.powertrainVariants.some((variant) => variant.type === 'hybrid' && variant.plugInHybrid)
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
  const epaHeading = allEpaEstimated
    ? '<strong>EPA FUEL ECONOMY (<em>C/D</em> EST)</strong>'
    : '<strong>EPA FUEL ECONOMY</strong>'
  if (interiorSound.length) {
    const lines = ['<strong>Interior Sound</strong>', ...interiorSound.map((field) => row(field))]
    if (tested.length) lines.push(fuelHeading, ...tested.map((field) => row(field)))
    if (epa.length) lines.push(epaHeading, ...epaLines)
    return `<p>${lines.join('<br>\n')}</p>`
  }
  const epaSection = allEpaEstimated
    ? richHeadingParagraph(epaHeading, epaLines)
    : paragraph('EPA FUEL ECONOMY', epaLines)
  return [richHeadingParagraph(fuelHeading, tested.map((field) => row(field))), epaSection]
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
    return renderCombinedPowertrains(vehicle, transmission)
  }
  if (!fields.length) return ''

  if (key === 'price') return renderPrice(vehicle, fields, panelType)
  if (key === 'transmission') {
    if (vehicle.powertrainVariants.some((variant) => variant.type !== 'combustion')) return ''
    return paragraph('TRANSMISSION', fields.map((field) => formatValue(field)))
  }
  if (key === 'chassis') return renderChassis(fields)
  if (key === 'dimensions') return renderDimensions(vehicle, fields)
  if (key === 'testing') return renderTesting(fields, panelType)
  if (key === 'fuelEconomy') {
    const isCombustionOnly = vehicle.powertrainVariants.every((variant) => variant.type === 'combustion')
    const relevantFields = isCombustionOnly
      ? fields.filter((field) => field.id !== 'epa-electricity')
      : fields
    return renderFuelEconomy(vehicle, relevantFields)
  }

  return paragraph('Interior Sound', fields.map((field) => row(field)))
}

const renderVehicle = (
  vehicle: Vehicle,
  panelType: PanelType,
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
  const interiorSound = vehicle.sections.interiorSound.enabled
    ? populated(vehicle, 'interiorSound')
    : []
  const fuelEconomy = vehicle.sections.fuelEconomy.enabled
    ? populated(vehicle, 'fuelEconomy')
    : []
  const combineInteriorAndFuel = interiorSound.length > 0 && fuelEconomy.length > 0
  const sections = sectionOrder.flatMap((key) => {
    if (key === 'interiorSound' && combineInteriorAndFuel) {
      return [renderFuelEconomy(vehicle, fuelEconomy, interiorSound)]
    }
    if (key === 'fuelEconomy' && combineInteriorAndFuel) return []
    return [renderSection(vehicle, key, panelType)]
  }).filter(Boolean)
  return [intro, ...sections].filter(Boolean).join('\n')
}

export const generatePanelHtml = (
  vehicles: Vehicle[],
  panelType: PanelType,
  testingExplainedEnabled = true,
) => {
  const testingLink = panelType !== 'firstDrive' && testingExplainedEnabled
    ? '<p><a class="body-btn-link" href="https://www.caranddriver.com/features/a32018270/how-we-test-cars/" target="_self" data-vars-ga-call-to-action="C/D TESTING EXPLAINED" data-vars-ga-outbound-link="https://www.caranddriver.com/features/a32018270/how-we-test-cars/"><em>C/D</em> TESTING EXPLAINED</a></p>'
    : ''
  const vehicleBlocks = vehicles.flatMap((vehicle, index) => [
    renderVehicle(vehicle, panelType),
    ...(index === 0 && testingLink ? [testingLink] : []),
  ])
  return ['<p><strong>Specifications</strong></p>', ...vehicleBlocks]
    .filter(Boolean)
    .join('\n')
}
