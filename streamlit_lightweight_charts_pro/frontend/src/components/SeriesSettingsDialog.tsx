import React, {useMemo, useState, useCallback} from 'react'

export type SeriesSettingsFieldSource = 'options' | 'topLevel'

export interface SeriesSettingsSeries {
  index: number
  name?: string
  type: string
  options: Record<string, any>
  topLevel: Record<string, any>
}

export interface SeriesSettingsGroup {
  chartId: string
  chartIndex: number
  chartTitle?: string
  series: SeriesSettingsSeries[]
}

interface SeriesSettingsDialogProps {
  open: boolean
  groups: SeriesSettingsGroup[]
  hasChanges: boolean
  onClose: () => void
  onApply: () => void
  onReset: () => void
  onFieldChange: (
    chartId: string,
    seriesIndex: number,
    key: string,
    value: any,
    source: SeriesSettingsFieldSource
  ) => void
}

const LINE_STYLE_OPTIONS = [
  {value: 0, label: 'Solid'},
  {value: 1, label: 'Dotted'},
  {value: 2, label: 'Dashed'},
  {value: 3, label: 'Large dashed'},
  {value: 4, label: 'Sparse dotted'}
]

const LINE_TYPE_OPTIONS = [
  {value: 0, label: 'Simple'},
  {value: 1, label: 'Step'},
  {value: 2, label: 'Curved'}
]

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}){1,2}$/
const DEFAULT_COLOR = '#2962ff'
const INPUT_KEY_REGEX = /(length|period|factor|multiplier|offset|precision|source|input)/i

const TABS = [
  {id: 'inputs', label: 'Inputs'},
  {id: 'style', label: 'Style'},
  {id: 'visibility', label: 'Visibility'}
] as const

type TabId = (typeof TABS)[number]['id']

const formatLabel = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, match => match.toUpperCase())
    .trim()
}

const formatSeriesType = (type: string): string => {
  return formatLabel(type || 'Series')
}

const getFieldPriority = (key: string): number => {
  if (/color/i.test(key)) return 0
  if (/lineStyle/i.test(key)) return 1
  if (/lineType/i.test(key)) return 2
  if (/lineWidth/i.test(key)) return 3
  if (/opacity/i.test(key)) return 4
  if (/visible/i.test(key)) return 5
  return 6
}

export const isEditableStyleKey = (key: string, value: any): boolean => {
  if (value === null || value === undefined) return false

  if (typeof value === 'string') {
    return /color|fill|background/i.test(key) || key === 'color'
  }

  if (typeof value === 'number') {
    return (
      /line(style|width|type)/i.test(key) ||
      /opacity/i.test(key) ||
      /radius|thickness|borderWidth/i.test(key) ||
      INPUT_KEY_REGEX.test(key)
    )
  }

  if (typeof value === 'boolean') {
    return /visible|show|fill/i.test(key)
  }

  return false
}

interface EditableField {
  key: string
  value: any
  source: SeriesSettingsFieldSource
}

const getEditableFields = (series: SeriesSettingsSeries): EditableField[] => {
  const fields: EditableField[] = []

  Object.entries(series.topLevel || {}).forEach(([key, value]) => {
    if (isEditableStyleKey(key, value)) {
      fields.push({key, value, source: 'topLevel'})
    }
  })

  Object.entries(series.options || {}).forEach(([key, value]) => {
    if (isEditableStyleKey(key, value)) {
      fields.push({key, value, source: 'options'})
    }
  })

  return fields.sort((a, b) => {
    const priorityDiff = getFieldPriority(a.key) - getFieldPriority(b.key)
    if (priorityDiff !== 0) return priorityDiff
    return formatLabel(a.key).localeCompare(formatLabel(b.key))
  })
}

const categorizeField = (field: EditableField): TabId => {
  if (typeof field.value === 'boolean') {
    return 'visibility'
  }

  if (typeof field.value === 'number' && INPUT_KEY_REGEX.test(field.key)) {
    return 'inputs'
  }

  return 'style'
}

const getFieldsByTab = (fields: EditableField[]): Record<TabId, EditableField[]> => {
  return fields.reduce(
    (acc, field) => {
      const tab = categorizeField(field)
      acc[tab].push(field)
      return acc
    },
    {inputs: [], style: [], visibility: []} as Record<TabId, EditableField[]>
  )
}

const getDefaultTab = (fieldsByTab: Record<TabId, EditableField[]>): TabId => {
  for (const tab of TABS) {
    if (fieldsByTab[tab.id].length > 0) {
      return tab.id
    }
  }

  return 'style'
}

const renderColorField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  const label = formatLabel(field.key)
  const value = typeof field.value === 'string' ? field.value : ''
  const safeValue = HEX_COLOR_REGEX.test(value) ? value : DEFAULT_COLOR

  return (
    <div className="slwc-series-row" key={`${field.source}-${field.key}`}>
      <div className="slwc-series-row-label">{label}</div>
      <div className="slwc-color-control">
        <label className="slwc-color-button">
          <span
            className="slwc-color-button__swatch"
            style={{backgroundColor: value || DEFAULT_COLOR}}
          />
          <span className="slwc-color-button__arrow" />
          <input
            type="color"
            value={safeValue}
            aria-label={`${label} color`}
            onChange={event =>
              onFieldChange(chartId, seriesIndex, field.key, event.target.value, field.source)
            }
          />
        </label>
        <input
          className="slwc-color-hex-input"
          type="text"
          value={value}
          aria-label={`${label} value`}
          placeholder={DEFAULT_COLOR.toUpperCase()}
          onChange={event =>
            onFieldChange(chartId, seriesIndex, field.key, event.target.value, field.source)
          }
        />
      </div>
    </div>
  )
}

const renderLineStyleField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  const label = formatLabel(field.key)
  const value = typeof field.value === 'number' ? field.value : 0

  return (
    <div className="slwc-series-row" key={`${field.source}-${field.key}`}>
      <div className="slwc-series-row-label">{label}</div>
      <select
        className="slwc-select"
        value={value}
        aria-label={`${label} selection`}
        onChange={event =>
          onFieldChange(chartId, seriesIndex, field.key, Number(event.target.value), field.source)
        }
      >
        {LINE_STYLE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const renderLineTypeField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  const label = formatLabel(field.key)
  const value = typeof field.value === 'number' ? field.value : 0

  return (
    <div className="slwc-series-row" key={`${field.source}-${field.key}`}>
      <div className="slwc-series-row-label">{label}</div>
      <select
        className="slwc-select"
        value={value}
        aria-label={`${label} selection`}
        onChange={event =>
          onFieldChange(chartId, seriesIndex, field.key, Number(event.target.value), field.source)
        }
      >
        {LINE_TYPE_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

const renderNumberField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  const label = formatLabel(field.key)
  const value = typeof field.value === 'number' ? field.value : 0
  const isOpacityField = /opacity/i.test(field.key)

  return (
    <div className="slwc-series-row" key={`${field.source}-${field.key}`}>
      <div className="slwc-series-row-label">{label}</div>
      <input
        className="slwc-input"
        type="number"
        value={value}
        aria-label={`${label} value`}
        step={isOpacityField ? 0.05 : 1}
        min={isOpacityField ? 0 : undefined}
        max={isOpacityField ? 1 : undefined}
        onChange={event =>
          onFieldChange(chartId, seriesIndex, field.key, Number(event.target.value), field.source)
        }
      />
    </div>
  )
}

const renderBooleanField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  const label = formatLabel(field.key)
  const value = Boolean(field.value)
  const inputId = `${chartId}-${seriesIndex}-${field.source}-${field.key}`

  return (
    <div className="slwc-series-row slwc-series-row--checkbox" key={`${field.source}-${field.key}`}>
      <label className="slwc-checkbox" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          checked={value}
          onChange={event =>
            onFieldChange(chartId, seriesIndex, field.key, event.target.checked, field.source)
          }
          aria-label={`${label} toggle`}
        />
        <span className="slwc-checkbox-box">
          <span className="slwc-checkbox-check" />
        </span>
        <span className="slwc-checkbox-label">{label}</span>
      </label>
    </div>
  )
}

const renderField = (
  chartId: string,
  seriesIndex: number,
  field: EditableField,
  onFieldChange: SeriesSettingsDialogProps['onFieldChange']
) => {
  if (/color|fill|background/i.test(field.key) || field.key === 'color') {
    return renderColorField(chartId, seriesIndex, field, onFieldChange)
  }

  if (/lineStyle/i.test(field.key)) {
    return renderLineStyleField(chartId, seriesIndex, field, onFieldChange)
  }

  if (/lineType/i.test(field.key)) {
    return renderLineTypeField(chartId, seriesIndex, field, onFieldChange)
  }

  if (typeof field.value === 'number') {
    return renderNumberField(chartId, seriesIndex, field, onFieldChange)
  }

  if (typeof field.value === 'boolean') {
    return renderBooleanField(chartId, seriesIndex, field, onFieldChange)
  }

  return null
}

const SeriesSettingsDialog: React.FC<SeriesSettingsDialogProps> = ({
  open,
  groups,
  hasChanges,
  onClose,
  onApply,
  onReset,
  onFieldChange
}) => {
  const hasEditableSeries = useMemo(
    () =>
      groups.some(group =>
        group.series.some(series => getEditableFields(series).length > 0)
      ),
    [groups]
  )

  const [activeTabs, setActiveTabs] = useState<Record<string, TabId>>({})

  const handleTabSelect = useCallback((seriesKey: string, tab: TabId) => {
    setActiveTabs(prev => {
      if (prev[seriesKey] === tab) {
        return prev
      }

      return {...prev, [seriesKey]: tab}
    })
  }, [])

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!open) {
    return null
  }

  return (
    <div className="slwc-series-settings-overlay" role="presentation" onClick={handleOverlayClick}>
      <div
        className="slwc-series-settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Series settings dialog"
        onClick={event => event.stopPropagation()}
      >
        <div className="slwc-series-settings-header">
          <div>
            <h2>Series settings</h2>
            <p>Fine-tune colours, lines, and visibility to match your TradingView layouts.</p>
          </div>
          <button className="slwc-series-settings-close" onClick={onClose} type="button" aria-label="Close settings">
            ×
          </button>
        </div>
        <div className="slwc-series-settings-content">
          {groups.map(group => (
            <div className="slwc-series-group" key={group.chartId}>
              <div className="slwc-series-group__header">
                <span className="slwc-series-group__title">{group.chartTitle || `Chart ${group.chartIndex + 1}`}</span>
                <span className="slwc-series-group__subtitle">{`${group.series.length} series`}</span>
              </div>
              <div className="slwc-series-group__body">
                {group.series.map(series => {
                  const editableFields = getEditableFields(series)
                  const fieldsByTab = getFieldsByTab(editableFields)
                  const seriesKey = `${group.chartId}-${series.index}`
                  const storedTab = activeTabs[seriesKey]
                  const defaultTab = getDefaultTab(fieldsByTab)
                  const activeTab = storedTab && fieldsByTab[storedTab].length > 0 ? storedTab : defaultTab
                  const fieldsForTab = fieldsByTab[activeTab]

                  return (
                    <div className="slwc-series-card" key={`${group.chartId}-${series.index}`}>
                      <div className="slwc-series-card__header">
                        <div>
                          <h3>{series.name || `Series ${series.index + 1}`}</h3>
                          <span>{formatSeriesType(series.type)}</span>
                        </div>
                        <span className="slwc-series-card__chart-ref">
                          {group.chartTitle || `Chart #${group.chartIndex + 1}`}
                        </span>
                      </div>
                      <div className="slwc-series-tabs" role="tablist">
                        {TABS.map(tab => {
                          const tabFields = fieldsByTab[tab.id]
                          const isDisabled = tabFields.length === 0
                          const isActive = activeTab === tab.id
                          const tabClassNames = [
                            'slwc-series-tab',
                            isActive ? 'slwc-series-tab--active' : '',
                            isDisabled ? 'slwc-series-tab--disabled' : ''
                          ]
                            .filter(Boolean)
                            .join(' ')

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              role="tab"
                              aria-selected={isActive}
                              className={tabClassNames}
                              disabled={isDisabled}
                              onClick={() => handleTabSelect(seriesKey, tab.id)}
                            >
                              {tab.label}
                            </button>
                          )
                        })}
                      </div>
                      {fieldsForTab.length === 0 ? (
                        <div className="slwc-series-empty">No settings available for this tab.</div>
                      ) : (
                        <div className="slwc-series-field-list">
                          {fieldsForTab.map(field =>
                            renderField(group.chartId, series.index, field, onFieldChange)
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {!hasEditableSeries && (
            <div className="slwc-series-empty slwc-series-empty--global">
              No editable series options were detected in the current configuration.
            </div>
          )}
        </div>
        <div className="slwc-series-settings-footer">
          <button className="slwc-btn slwc-btn-tertiary" type="button" onClick={onReset} disabled={!hasChanges}>
            Defaults
          </button>
          <div className="slwc-series-settings-actions">
            <button className="slwc-btn slwc-btn-secondary" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="slwc-btn slwc-btn-primary" type="button" onClick={onApply} disabled={!hasChanges}>
              Ok
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SeriesSettingsDialog
