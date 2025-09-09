import {
  perfLogFn as perfLog,
  getCachedDOMElementForTesting as getCachedDOMElement,
  createOptimizedStyles
} from '../performance'

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => [])
  },
  writable: true
})

// Mock console methods
const originalConsole = {...console}
beforeEach(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  console.log = originalConsole.log
  console.warn = originalConsole.warn
  console.error = originalConsole.error
})

describe('performance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('perfLog', () => {
    it('should log performance metrics when enabled', () => {
      const mockPerformance = {
        now: jest.fn(() => 1000),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => [])
      }
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true
      })

      perfLog('test-operation', () => {
        // Simulate some work
        return 'result'
      })

      expect(mockPerformance.now).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('test-operation'))
    })

    it('should handle errors gracefully', () => {
      const mockPerformance = {
        now: jest.fn(() => 1000),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => [])
      }
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true
      })

      const errorFn = () => {
        throw new Error('Test error')
      }

      expect(() => {
        perfLog('error-operation', errorFn)
      }).toThrow('Test error')

      expect(mockPerformance.now).toHaveBeenCalled()
    })

    it('should work with async functions', async () => {
      const mockPerformance = {
        now: jest.fn(() => 1000),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: jest.fn(() => [])
      }
      Object.defineProperty(window, 'performance', {
        value: mockPerformance,
        writable: true
      })

      const asyncFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async result'
      }

      const result = await perfLog('async-operation', asyncFn)

      expect(result).toBe('async result')
      expect(mockPerformance.now).toHaveBeenCalled()
    })

    it('should handle performance API not available', () => {
      Object.defineProperty(window, 'performance', {
        value: undefined,
        writable: true
      })

      const result = perfLog('no-performance', () => 'result')

      expect(result).toBe('result')
      expect(console.log).not.toHaveBeenCalled()
    })
  })

  describe('getCachedDOMElement', () => {
    it('should return cached element when available', () => {
      const mockElement = document.createElement('div')
      const cache = new Map()
      cache.set('test-id', mockElement)

      const result = getCachedDOMElement('test-id', cache, () => document.createElement('span'))

      expect(result).toBe(mockElement)
    })

    it('should create and cache new element when not available', () => {
      const cache = new Map()
      const createFn = jest.fn(() => document.createElement('div'))

      const result = getCachedDOMElement('new-id', cache, createFn)

      expect(result).toBeInstanceOf(HTMLDivElement)
      expect(createFn).toHaveBeenCalledWith('new-id')
      expect(cache.get('new-id')).toBe(result)
    })

    it('should handle null create function', () => {
      const cache = new Map()

      const result = getCachedDOMElement('test-id', cache, null)

      expect(result).toBeNull()
    })

    it('should handle create function returning null', () => {
      const cache = new Map()
      const createFn = jest.fn(() => null)

      const result = getCachedDOMElement('test-id', cache, createFn)

      expect(result).toBeNull()
      expect(createFn).toHaveBeenCalledWith('test-id')
    })

    it('should handle multiple calls with same ID', () => {
      const cache = new Map()
      const createFn = jest.fn(() => document.createElement('div'))

      const result1 = getCachedDOMElement('same-id', cache, createFn)
      const result2 = getCachedDOMElement('same-id', cache, createFn)

      expect(result1).toBe(result2)
      expect(createFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('createOptimizedStyles', () => {
    it('should create optimized styles object', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff'
      })

      expect(styles).toEqual({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff'
      })
    })

    it('should handle empty styles object', () => {
      const styles = createOptimizedStyles({})

      expect(styles).toEqual({})
    })

    it('should handle null styles', () => {
      const styles = createOptimizedStyles(null)

      expect(styles).toEqual({})
    })

    it('should handle undefined styles', () => {
      const styles = createOptimizedStyles(undefined)

      expect(styles).toEqual({})
    })

    it('should handle complex style objects', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      })

      expect(styles).toEqual({
        width: '100%',
        height: '400px',
        backgroundColor: '#ffffff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '10px',
        margin: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      })
    })

    it('should handle numeric values', () => {
      const styles = createOptimizedStyles({
        width: 800,
        height: 600,
        opacity: 0.8,
        zIndex: 1000
      })

      expect(styles).toEqual({
        width: 800,
        height: 600,
        opacity: 0.8,
        zIndex: 1000
      })
    })

    it('should handle mixed value types', () => {
      const styles = createOptimizedStyles({
        width: '100%',
        height: 400,
        opacity: 0.8,
        color: '#000000',
        fontSize: '14px',
        fontWeight: 500
      })

      expect(styles).toEqual({
        width: '100%',
        height: 400,
        opacity: 0.8,
        color: '#000000',
        fontSize: '14px',
        fontWeight: 500
      })
    })
  })
})
