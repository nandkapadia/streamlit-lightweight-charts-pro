import React from 'react'

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
  }
}

export const CollapseButtonComponent: React.FC<CollapseButtonComponentProps> = ({
  paneId,
  isCollapsed,
  onClick,
  config
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  // Default values for optional config properties
  const buttonSize = config.buttonSize || 16
  const buttonColor = config.buttonColor || '#787B86'
  const buttonBackground = config.buttonBackground || 'rgba(255, 255, 255, 0.9)'
  const buttonBorderRadius = config.buttonBorderRadius || 3
  const buttonHoverColor = config.buttonHoverColor || '#131722'
  const buttonHoverBackground = config.buttonHoverBackground || 'rgba(255, 255, 255, 1)'

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${buttonSize}px`,
    height: `${buttonSize}px`,
    background: isHovered ? buttonHoverBackground : buttonBackground,
    border: `1px solid ${isHovered ? buttonHoverColor : buttonColor}`,
    borderRadius: `${buttonBorderRadius}px`,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: 'bold',
    color: isHovered ? buttonHoverColor : buttonColor,
    zIndex: 1000,
    transition: 'all 0.2s ease',
    userSelect: 'none'
  }

  return (
    <div
      className="pane-collapse-button"
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
    >
      {isCollapsed ? '+' : '−'}
    </div>
  )
}
