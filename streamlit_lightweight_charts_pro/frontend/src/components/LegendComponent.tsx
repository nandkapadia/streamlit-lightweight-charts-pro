import React, { useState, useRef, useEffect } from 'react'
import { LegendConfig } from '../types'
import { LegendWidget } from './LegendWidget'
import { usePositionableWidget } from './base/PositionableWidget'

interface LegendComponentProps {
  legendConfig: LegendConfig
  isPanePrimitive?: boolean // Flag to indicate if used as a pane primitive
  layoutManager: any
}

export const LegendComponent: React.FC<LegendComponentProps> = ({
  legendConfig,
  isPanePrimitive = false,
  layoutManager
}) => {
  const legendRef = useRef<HTMLDivElement>(null)
  const [forceUpdate, setForceUpdate] = useState(0)
  const [displayText, setDisplayText] = useState('')

  // Create widget with layout manager integration
  const widget = usePositionableWidget(
    () => new LegendWidget(legendConfig, layoutManager),
    [legendConfig]
  )

  // Update widget state when props change
  useEffect(() => {
    widget.updateConfig(legendConfig)
    setDisplayText(widget.displayText) // Initialize React state
    widget.setUpdateCallback(() => {
      setDisplayText(widget.displayText) // Update React state
      setForceUpdate(prev => prev + 1)
    })
  }, [widget, legendConfig])

  // Update widget element reference
  useEffect(() => {
    widget.setElement(legendRef.current)
  }, [widget, legendRef.current])

  // Don't render if not visible
  if (!widget.isVisible) {
    return null
  }

  const positionStyle = widget.getPositionStyle()

  return (
    <div
      ref={legendRef}
      style={positionStyle}
      role="img"
      aria-label={`Legend: ${widget.textContent}`}
      title={widget.textContent}
      dangerouslySetInnerHTML={{ __html: displayText || '' }}
    />
  )
}