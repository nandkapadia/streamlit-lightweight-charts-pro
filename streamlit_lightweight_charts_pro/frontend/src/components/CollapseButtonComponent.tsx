import React, { useState, useRef, useEffect } from 'react'
import { CollapseButtonWidget } from './CollapseButtonWidget'
import { usePositionableWidget } from './base/PositionableWidget'

interface CollapseButtonComponentProps {
  paneId: number
  isCollapsed: boolean
  onClick: () => void
  config: {
    buttonSize?: number
    buttonColor?: string
    buttonBackground?: string
    buttonBorderRadius?: number
    buttonHoverColor?: string
    buttonHoverBackground?: string
    showTooltip?: boolean
    position?: string
  }
  layoutManager: any
}

export const CollapseButtonComponent: React.FC<CollapseButtonComponentProps> = ({
  paneId,
  isCollapsed,
  onClick,
  config,
  layoutManager
}) => {

  const buttonRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [, setForceUpdate] = useState(0)

  // Create widget with layout manager integration (same pattern as legends)
  const widget = usePositionableWidget(
    () => new CollapseButtonWidget(paneId, isCollapsed, onClick, config, layoutManager),
    [paneId, onClick, config, layoutManager]
  )

  // Update widget state when props change
  useEffect(() => {
    widget.updateState(isCollapsed)
    widget.updateConfig(config)
    widget.setUpdateCallback(() => setForceUpdate(prev => prev + 1))
  }, [widget, isCollapsed, config])

  // Update widget element reference (same pattern as legends)
  useEffect(() => {
    widget.setElement(buttonRef.current)
  }, [widget])

  const handleMouseEnter = () => setIsHovered(true)
  const handleMouseLeave = () => setIsHovered(false)

  const handleClick = () => {
    widget.handleClick()
  }

  // Use widget positioning
  const baseStyle = widget.getPositionStyle()

  const hoverStyle = isHovered ? widget.getHoverStyle() : {}
  const buttonStyle = { ...baseStyle, ...hoverStyle }

  return (
    <div
      ref={buttonRef}
      className="collapse-button-icon"
      style={buttonStyle}
      data-pane-id={paneId.toString()}
      data-widget-type="collapse-button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={widget.showTooltip ? widget.getTooltipText() : undefined}
      role="button"
      tabIndex={0}
      aria-label={widget.getTooltipText()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {widget.getButtonSymbol()}
    </div>
  )
}