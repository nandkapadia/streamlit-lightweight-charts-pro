import React, { useState, useEffect, useRef } from 'react'
import { IChartApi } from 'lightweight-charts'
import { RangeSwitcherConfig } from '../types'
import { RangeSwitcherWidget } from './RangeSwitcherWidget'
import { usePositionableWidget } from './base/PositionableWidget'

interface RangeSwitcherComponentProps {
  chart: IChartApi | null
  config: RangeSwitcherConfig
  onRangeChange?: (range: { text: string; seconds: number | null }) => void
  layoutManager: any
}

export const RangeSwitcherComponent: React.FC<RangeSwitcherComponentProps> = ({
  chart,
  config,
  onRangeChange,
  layoutManager
}) => {
  const rangeSwitcherRef = useRef<HTMLDivElement>(null)
  const [, setForceUpdate] = useState(0)

  // Create widget with layout manager integration
  const widget = usePositionableWidget(
    () => new RangeSwitcherWidget(config, layoutManager, onRangeChange),
    [config, onRangeChange, layoutManager]
  )

  // Update widget state when props change
  useEffect(() => {
    widget.setChart(chart)
    widget.setVisible(config.visible || false)
    widget.setUpdateCallback(() => setForceUpdate(prev => prev + 1))
  }, [widget, chart, config.visible])

  // Update widget element reference
  useEffect(() => {
    widget.setElement(rangeSwitcherRef.current)
  }, [widget])

  // Don't render if not visible or no chart
  if (!chart || !widget.isVisible) {
    return null
  }

  const positionStyle = widget.getPositionStyle()

  return (
    <div ref={rangeSwitcherRef} style={positionStyle}>
      {widget.ranges.map((range) => (
        <RangeButton
          key={range.text}
          range={range}
          isActive={widget.currentActiveRange === range.text}
          onClick={() => widget.handleRangeClick(range)}
        />
      ))}
    </div>
  )
}

// Individual range button component with hover state
const RangeButton: React.FC<{
  range: { text: string; seconds: number | null }
  isActive: boolean
  onClick: () => void
}> = ({ range, isActive, onClick }) => {
  const [isHovered, setIsHovered] = useState(false)

  const buttonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    borderRadius: '3px', // Smaller border radius
    padding: '3px 6px', // Much smaller padding
    fontSize: '11px', // Smaller font size
    fontFamily: 'inherit',
    fontWeight: '500',
    letterSpacing: '0px',
    lineHeight: '14px', // Smaller line height
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    minHeight: '18px', // Smaller minimum height
    backgroundColor: isActive ? '#2962FF' : (isHovered ? '#F0F3FA' : 'transparent'),
    color: isActive ? '#FFFFFF' : (isHovered ? '#131722' : '#6A7185')
  }

  return (
    <button
      style={buttonStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={(e) => e.preventDefault()}
      aria-label={`Set time range to ${range.text}`}
    >
      {range.text}
    </button>
  )
}