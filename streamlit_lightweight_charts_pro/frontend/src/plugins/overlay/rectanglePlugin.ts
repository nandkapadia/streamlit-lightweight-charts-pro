import {IChartApi} from 'lightweight-charts'
import {ChartReadyDetector} from '../../utils/chartReadyDetection'
import {ResizeObserverManager} from '../../utils/resizeObserverManager'
import {ChartCoordinateService} from '../../services/ChartCoordinateService'

export interface RectangleConfig {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
  borderColor?: string
  borderWidth?: number
  fillOpacity?: number
  borderOpacity?: number
  label?: string
  labelColor?: string
  labelFontSize?: number
  labelBackground?: string
  labelPadding?: number
  zIndex?: number
}

export class RectangleOverlayPlugin {
  private rectangles: RectangleConfig[] = []
  private chart: IChartApi | null = null
  private container: HTMLElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null
  private series: any = null
  private isDisposed: boolean = false
  private isInitialized: boolean = false
  private resizeObserverManager: ResizeObserverManager
  private redrawTimeout: NodeJS.Timeout | null = null
  private lastCanvasSize = {width: 0, height: 0}

  constructor() {
    this.resizeObserverManager = new ResizeObserverManager()
  }

  setChart(chart: IChartApi, series?: any) {
    this.chart = chart
    this.series = series
    this.init()
  }

  // Public method for testing compatibility
  public addToChart(chart: IChartApi): void {
    this.setChart(chart)
  }

  public remove(): void {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }
    this.canvas = null
    this.container = null
    this.chart = null
    this.isInitialized = false
  }

  public setRectangles(rectangles: RectangleConfig[]): void {
    this.rectangles = rectangles
    if (this.isInitialized) {
      this.render()
    } else {
      console.warn('[RectanglePlugin] Plugin not initialized, storing rectangles for later render')
      // Store rectangles and they will be rendered once the plugin is initialized
    }
  }

  private render(): void {
    if (!this.canvas || !this.ctx) {
      console.warn('[RectanglePlugin] Canvas or context not available for rendering')
      return
    }

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw rectangles
    this.rectangles.forEach((rect, index) => {
      this.ctx!.fillStyle = rect.color || '#000000'

      // Ensure proper rectangle dimensions (handle inverted Y coordinates)
      const x = Math.min(rect.x1, rect.x2)
      const y = Math.min(rect.y1, rect.y2)
      const width = Math.abs(rect.x2 - rect.x1)
      const height = Math.abs(rect.y2 - rect.y1)

      this.ctx!.fillRect(x, y, width, height)
    })
  }

  private async init() {
    if (!this.chart) return

    try {
      // Wait for chart to be ready before initializing
      const container = this.chart.chartElement()
      if (!container) {
        return
      }

      // Wait for chart to be fully ready
      const isReady = await ChartReadyDetector.waitForChartReady(this.chart, container, {
        minWidth: 200,
        minHeight: 200
      })

      if (!isReady) {
        console.warn('⚠️ Chart not ready after timeout, proceeding with fallback initialization')
      }

      this.container = container
      this.createCanvas()
      this.setupResizeObserver()
      this.setupEventListeners()
      this.isInitialized = true

      // Render any rectangles that were set before initialization
      if (this.rectangles.length > 0) {
        this.render()
      }
    } catch (error) {
      console.error('❌ Failed to initialize rectangle plugin:', error)
    }
  }

  private createCanvas() {
    if (!this.container) return

    try {
      // Create canvas overlay
      this.canvas = document.createElement('canvas')
      this.canvas.style.position = 'absolute'
      this.canvas.style.top = '0'
      this.canvas.style.left = '0'
      this.canvas.style.pointerEvents = 'none'

      // Set Z-index from config or use default of 20
      const defaultZIndex = 20
      this.canvas.style.zIndex = defaultZIndex.toString()

      if (this.container && this.container.style) {
        this.container.style.position = 'relative'
        this.container.appendChild(this.canvas)
      }

      // Get canvas context
      this.ctx = this.canvas.getContext('2d')
      if (!this.ctx) {
        throw new Error('Failed to get canvas context')
      }

      // Set initial canvas size
      this.resizeCanvas()
    } catch (error) {
      console.error('❌ Failed to create canvas:', error)
    }
  }

  private setupResizeObserver() {
    if (!this.container || !this.canvas) return

    // Use our ResizeObserverManager for better handling
    this.resizeObserverManager.addObserver(
      'rectangle-plugin',
      this.container,
      entry => {
        if (this.isDisposed) return

        // Handle both single entry and array of entries
        const entries = Array.isArray(entry) ? entry : [entry]

        entries.forEach(singleEntry => {
          const {width, height} = singleEntry.contentRect

          // Check if dimensions are valid before resizing
          if (width > 100 && height > 100) {
            this.handleResize()
          }
        })
      },
      {throttleMs: 100, debounceMs: 50}
    )
  }

  private setupEventListeners() {
    if (!this.chart) return

    try {
      // Listen for chart updates (time scale changes, panning, zooming)
      this.chart.timeScale().subscribeVisibleTimeRangeChange(() => {
        if (!this.isDisposed) {
          this.scheduleRedraw()
        }
      })

      // Listen for crosshair movement (includes price scale changes)
      this.chart.subscribeCrosshairMove(() => {
        if (!this.isDisposed) {
          this.scheduleRedraw()
        }
      })
    } catch (error) {
      console.warn('⚠️ Failed to set up some event listeners:', error)
    }
  }

  private async resizeCanvas() {
    if (!this.canvas || !this.container || !this.chart) return

    try {
      // Use consolidated service for chart dimensions
      const coordinateService = ChartCoordinateService.getInstance()
      const dimensions = await coordinateService.getChartDimensionsWithFallback(
        this.chart,
        this.container,
        {minWidth: 200, minHeight: 200}
      )

      const {width, height} = dimensions.container

      // Only resize if dimensions actually changed
      if (width !== this.lastCanvasSize.width || height !== this.lastCanvasSize.height) {
        this.canvas.width = width
        this.canvas.height = height
        this.lastCanvasSize = {width, height}

        // Canvas resized successfully

        // Redraw after resize
        this.scheduleRedraw()
      }
    } catch (error) {
      console.error('❌ Error resizing canvas with consolidated service, using fallback:', error)

      // Fallback to manual dimension calculation
      this.fallbackResizeCanvas()
    }
  }

  private fallbackResizeCanvas() {
    if (!this.canvas || !this.container) return

    try {
      // Method 1: Try container dimensions first
      let width = 0
      let height = 0

      try {
        const rect = this.container.getBoundingClientRect()
        width = rect.width
        height = rect.height
      } catch (error) {
        width = this.container.offsetWidth
        height = this.container.offsetHeight
      }

      // Method 2: Fallback to offset dimensions
      if (!width || !height) {
        width = this.container.offsetWidth || 800
        height = this.container.offsetHeight || 600
      }

      // Method 3: Use chart element dimensions if available
      if ((!width || !height) && this.chart) {
        try {
          const chartElement = this.chart.chartElement()
          if (chartElement) {
            const chartRect = chartElement.getBoundingClientRect()
            if (chartRect.width > 0 && chartRect.height > 0) {
              width = chartRect.width
              height = chartRect.height
            }
          }
        } catch (error) {
          // Ignore error
        }
      }

      // Ensure minimum dimensions
      width = Math.max(width, 200)
      height = Math.max(height, 200)

      // Only resize if dimensions actually changed
      if (width !== this.lastCanvasSize.width || height !== this.lastCanvasSize.height) {
        this.canvas.width = width
        this.canvas.height = height
        this.lastCanvasSize = {width, height}

        // Fallback canvas resize successful

        // Redraw after resize
        this.scheduleRedraw()
      }
    } catch (error) {
      console.error('❌ Error in fallback canvas resize:', error)
    }
  }

  private async handleResize() {
    if (this.isDisposed) return

    try {
      await this.resizeCanvas()
    } catch (error) {
      console.error('❌ Error handling resize:', error)
    }
  }

  private scheduleRedraw() {
    if (this.redrawTimeout) {
      clearTimeout(this.redrawTimeout)
    }

    this.redrawTimeout = setTimeout(() => {
      if (!this.isDisposed) {
        this.redraw()
      }
    }, 16) // ~60fps
  }

  private redraw() {
    if (!this.ctx || !this.canvas || this.isDisposed) return

    try {
      // Clear canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // Draw all rectangles
      this.rectangles.forEach(rect => {
        this.drawRectangle(rect)
      })
    } catch (error) {
      console.error('❌ Error during redraw:', error)
    }
  }

  private drawRectangle(rect: RectangleConfig) {
    if (!this.ctx || !this.canvas) return

    try {
      const {x1, y1, x2, y2, color, borderColor, borderWidth, fillOpacity, borderOpacity} = rect

      // Calculate actual coordinates based on chart scale
      const actualCoords = this.calculateActualCoordinates(x1, y1, x2, y2)
      if (!actualCoords) return

      const {ax1, ay1, ax2, ay2} = actualCoords

      // Ensure proper rectangle dimensions (handle inverted Y coordinates)
      const rectX = Math.min(ax1, ax2)
      const rectY = Math.min(ay1, ay2)
      const rectWidth = Math.abs(ax2 - ax1)
      const rectHeight = Math.abs(ay2 - ay1)

      // Set fill style
      this.ctx.fillStyle = color
      if (fillOpacity !== undefined) {
        this.ctx.globalAlpha = fillOpacity
      }

      // Draw filled rectangle
      this.ctx.fillRect(rectX, rectY, rectWidth, rectHeight)

      // Reset alpha for border
      this.ctx.globalAlpha = 1.0

      // Draw border if specified
      if (borderColor && borderWidth) {
        this.ctx.strokeStyle = borderColor
        this.ctx.lineWidth = borderWidth
        if (borderOpacity !== undefined) {
          this.ctx.globalAlpha = borderOpacity
        }
        this.ctx.strokeRect(rectX, rectY, rectWidth, rectHeight)
        this.ctx.globalAlpha = 1.0
      }

      // Draw label if specified
      if (rect.label) {
        this.drawLabel(rect, rectX, rectY, rectX + rectWidth, rectY + rectHeight)
      }
    } catch (error) {
      console.error('❌ Error drawing rectangle:', error)
    }
  }

  private calculateActualCoordinates(x1: number, y1: number, x2: number, y2: number) {
    if (!this.chart || !this.canvas) return null

    try {
      // Method 1: Try to use chart's coordinate system (simplified for now)
      try {
        // For now, just use pixel coordinates directly
      } catch (error) {}

      // Method 2: Use pixel coordinates directly
      return {
        ax1: x1,
        ay1: y1,
        ax2: x2,
        ay2: y2
      }
    } catch (error) {
      console.error('❌ Error calculating coordinates:', error)
      return null
    }
  }

  private drawLabel(rect: RectangleConfig, x1: number, y1: number, x2: number, y2: number) {
    if (!this.ctx || !rect.label) return

    try {
      const labelX = (x1 + x2) / 2
      const labelY = Math.min(y1, y2) - 10

      // Set label style
      this.ctx.font = `${rect.labelFontSize || 12}px Arial`
      this.ctx.fillStyle = rect.labelColor || '#000000'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'bottom'

      // Draw label background if specified
      if (rect.labelBackground) {
        const textMetrics = this.ctx.measureText(rect.label)
        const padding = rect.labelPadding || 4
        const bgWidth = textMetrics.width + padding * 2
        const bgHeight = (rect.labelFontSize || 12) + padding * 2

        this.ctx.fillStyle = rect.labelBackground
        this.ctx.fillRect(labelX - bgWidth / 2, labelY - bgHeight + padding, bgWidth, bgHeight)

        // Reset text color
        this.ctx.fillStyle = rect.labelColor || '#000000'
      }

      // Draw label text
      this.ctx.fillText(rect.label, labelX, labelY)
    } catch (error) {
      console.error('❌ Error drawing label:', error)
    }
  }

  /**
   * Update canvas Z-index based on the highest Z-index of all rectangles
   * Default Z-index is 20 if no rectangles have Z-index specified
   */
  private updateCanvasZIndex() {
    if (!this.canvas) return

    const defaultZIndex = 20
    let maxZIndex = defaultZIndex

    // Find the highest Z-index among all rectangles
    for (const rect of this.rectangles) {
      if (rect.zIndex !== undefined && rect.zIndex > maxZIndex) {
        maxZIndex = rect.zIndex
      }
    }

    // Update canvas Z-index
    this.canvas.style.zIndex = maxZIndex.toString()

    if (maxZIndex !== defaultZIndex) {
    }
  }

  addRectangle(rect: RectangleConfig) {
    this.rectangles.push(rect)
    this.updateCanvasZIndex()
    this.scheduleRedraw()
  }

  removeRectangle(id: string) {
    const index = this.rectangles.findIndex(r => r.id === id)
    if (index !== -1) {
      this.rectangles.splice(index, 1)
      this.updateCanvasZIndex()
      this.scheduleRedraw()
    }
  }

  updateRectangle(id: string, updates: Partial<RectangleConfig>) {
    const rect = this.rectangles.find(r => r.id === id)
    if (rect) {
      Object.assign(rect, updates)
      this.updateCanvasZIndex()
      this.scheduleRedraw()
    }
  }

  clearRectangles() {
    this.rectangles = []
    this.updateCanvasZIndex()
    this.scheduleRedraw()
  }

  getRectangles(): RectangleConfig[] {
    return [...this.rectangles]
  }

  dispose() {
    this.isDisposed = true

    // Cleanup resize observers
    this.resizeObserverManager.cleanup()

    // Clear timeout
    if (this.redrawTimeout) {
      clearTimeout(this.redrawTimeout)
      this.redrawTimeout = null
    }

    // Remove canvas
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    // Clear references
    this.chart = null
    this.container = null
    this.canvas = null
    this.ctx = null
    this.series = null
    this.rectangles = []
  }
}
