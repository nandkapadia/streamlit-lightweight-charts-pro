import {LineStyle} from 'lightweight-charts'

export const validateLineStyle = (lineStyle: any): LineStyle | undefined => {
  if (!lineStyle) return undefined

  if (typeof lineStyle === 'number' && LineStyle && Object.values(LineStyle).includes(lineStyle)) {
    return lineStyle
  }

  if (typeof lineStyle === 'string' && LineStyle) {
    const styleMap: {[key: string]: LineStyle} = {
      solid: LineStyle.Solid,
      dotted: LineStyle.Dotted,
      dashed: LineStyle.Dashed,
      'large-dashed': LineStyle.LargeDashed,
      'sparse-dotted': LineStyle.SparseDotted
    }
    return styleMap[lineStyle.toLowerCase()]
  }

  if (Array.isArray(lineStyle)) {
    if (lineStyle.every(val => typeof val === 'number' && val >= 0) && LineStyle) {
      return LineStyle.Solid
    }
  }

  return undefined
}

export const cleanLineStyleOptions = (options: any): any => {
  if (!options) return options

  const cleaned: any = {...options}

  if (cleaned.lineStyle !== undefined) {
    const validLineStyle = validateLineStyle(cleaned.lineStyle)
    if (validLineStyle !== undefined) {
      cleaned.lineStyle = validLineStyle
    } else {
      delete cleaned.lineStyle
    }
  }

  if (cleaned.style && typeof cleaned.style === 'object') {
    cleaned.style = cleanLineStyleOptions(cleaned.style)
  }

  if (cleaned.upperLine && typeof cleaned.upperLine === 'object') {
    cleaned.upperLine = cleanLineStyleOptions(cleaned.upperLine)
  }
  if (cleaned.middleLine && typeof cleaned.middleLine === 'object') {
    cleaned.middleLine = cleanLineStyleOptions(cleaned.middleLine)
  }
  if (cleaned.lowerLine && typeof cleaned.lowerLine === 'object') {
    cleaned.lowerLine = cleanLineStyleOptions(cleaned.lowerLine)
  }

  for (const key in cleaned) {
    if (cleaned[key] && typeof cleaned[key] === 'object' && !Array.isArray(cleaned[key])) {
      cleaned[key] = cleanLineStyleOptions(cleaned[key])
    }
  }

  return cleaned
}
