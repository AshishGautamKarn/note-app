export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  category: 'navigation' | 'resource' | 'paint' | 'layout' | 'interaction' | 'custom'
}

export interface PerformanceReport {
  timestamp: Date
  url: string
  metrics: PerformanceMetric[]
  summary: {
    totalLoadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    firstInputDelay: number
    totalBlockingTime: number
  }
}

export interface PerformanceConfig {
  enableMonitoring: boolean
  sampleRate: number
  maxMetrics: number
  reportInterval: number
  enableWebVitals: boolean
  enableResourceTiming: boolean
  enableUserTiming: boolean
}

export class PerformanceService {
  private static readonly STORAGE_KEY = 'note-app-performance'
  private static readonly MAX_METRICS = 1000
  private static readonly REPORT_INTERVAL = 30000 // 30 seconds
  
  private static config: PerformanceConfig = {
    enableMonitoring: true,
    sampleRate: 1.0,
    maxMetrics: 1000,
    reportInterval: 30000,
    enableWebVitals: true,
    enableResourceTiming: true,
    enableUserTiming: true
  }
  
  private static metrics: PerformanceMetric[] = []
  private static listeners: ((report: PerformanceReport) => void)[] = []
  private static reportTimer: NodeJS.Timeout | null = null

  /**
   * Initialize performance monitoring
   */
  static initialize(config?: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (!this.config.enableMonitoring) return

    // Load existing metrics
    this.loadMetrics()

    // Set up performance observers
    this.setupPerformanceObservers()

    // Set up periodic reporting
    this.startPeriodicReporting()

    // Set up page visibility change handler
    this.setupVisibilityChangeHandler()

    // Set up beforeunload handler
    this.setupBeforeUnloadHandler()
  }

  /**
   * Set up performance observers
   */
  private static setupPerformanceObservers(): void {
    if (!this.config.enableWebVitals) return

    // Navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            this.recordMetric({
              name: entry.name,
              value: entry.duration,
              unit: 'ms',
              timestamp: new Date(entry.startTime),
              category: 'navigation'
            })
          })
        })
        navigationObserver.observe({ entryTypes: ['navigation'] })
      } catch (error) {
        console.warn('Failed to set up navigation observer:', error)
      }

      // Paint timing
      try {
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            this.recordMetric({
              name: entry.name,
              value: entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
              category: 'paint'
            })
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
      } catch (error) {
        console.warn('Failed to set up paint observer:', error)
      }

      // Layout shift
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.hadRecentInput) return
            
            this.recordMetric({
              name: 'layout-shift',
              value: (entry as any).value,
              unit: 'score',
              timestamp: new Date(),
              category: 'layout'
            })
          })
        })
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (error) {
        console.warn('Failed to set up layout shift observer:', error)
      }

      // First input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            this.recordMetric({
              name: 'first-input-delay',
              value: (entry as any).processingStart - entry.startTime,
              unit: 'ms',
              timestamp: new Date(),
              category: 'interaction'
            })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
      } catch (error) {
        console.warn('Failed to set up FID observer:', error)
      }
    }
  }

  /**
   * Record a custom performance metric
   */
  static recordMetric(metric: Omit<PerformanceMetric, 'timestamp'>): void {
    if (!this.config.enableMonitoring) return
    if (Math.random() > this.config.sampleRate) return

    const fullMetric: PerformanceMetric = {
      ...metric,
      timestamp: new Date()
    }

    this.metrics.push(fullMetric)

    // Limit metrics to max count
    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics)
    }

    // Save to localStorage
    this.saveMetrics()
  }

  /**
   * Record a custom timing
   */
  static startTiming(name: string): void {
    if (!this.config.enableUserTiming) return
    
    performance.mark(`${name}-start`)
  }

  /**
   * End a custom timing and record the metric
   */
  static endTiming(name: string, category: PerformanceMetric['category'] = 'custom'): void {
    if (!this.config.enableUserTiming) return

    try {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const measure = performance.getEntriesByName(name)[0]
      if (measure) {
        this.recordMetric({
          name,
          value: measure.duration,
          unit: 'ms',
          category
        })
      }
    } catch (error) {
      console.warn(`Failed to measure ${name}:`, error)
    }
  }

  /**
   * Record a resource timing
   */
  static recordResourceTiming(resource: PerformanceResourceTiming): void {
    if (!this.config.enableResourceTiming) return

    this.recordMetric({
      name: `resource-${resource.name.split('/').pop()}`,
      value: resource.duration,
      unit: 'ms',
      category: 'resource'
    })
  }

  /**
   * Get current performance metrics
   */
  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  /**
   * Get performance report
   */
  static getPerformanceReport(): PerformanceReport {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0]
    const cls = this.metrics.filter(m => m.name === 'layout-shift').reduce((sum, m) => sum + m.value, 0)
    const fid = this.metrics.find(m => m.name === 'first-input-delay')?.value || 0
    
    // Calculate Total Blocking Time
    const longTasks = performance.getEntriesByType('longtask')
    const tbt = longTasks.reduce((sum, task) => sum + task.duration - 50, 0)

    return {
      timestamp: new Date(),
      url: window.location.href,
      metrics: [...this.metrics],
      summary: {
        totalLoadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        firstContentfulPaint: fcp ? fcp.startTime : 0,
        largestContentfulPaint: lcp ? (lcp as any).startTime : 0,
        cumulativeLayoutShift: cls,
        firstInputDelay: fid,
        totalBlockingTime: tbt
      }
    }
  }

  /**
   * Subscribe to performance reports
   */
  static subscribe(listener: (report: PerformanceReport) => void): () => void {
    this.listeners.push(listener)
    
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Start periodic reporting
   */
  private static startPeriodicReporting(): void {
    if (this.reportTimer) {
      clearInterval(this.reportTimer)
    }

    this.reportTimer = setInterval(() => {
      this.generateReport()
    }, this.config.reportInterval)
  }

  /**
   * Generate and send performance report
   */
  private static generateReport(): void {
    const report = this.getPerformanceReport()
    
    this.listeners.forEach(listener => {
      try {
        listener(report)
      } catch (error) {
        console.error('Error in performance report listener:', error)
      }
    })
  }

  /**
   * Set up page visibility change handler
   */
  private static setupVisibilityChangeHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.generateReport()
      }
    })
  }

  /**
   * Set up beforeunload handler
   */
  private static setupBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.generateReport()
    })
  }

  /**
   * Load metrics from localStorage
   */
  private static loadMetrics(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        this.metrics = data.metrics.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error)
      this.metrics = []
    }
  }

  /**
   * Save metrics to localStorage
   */
  private static saveMetrics(): void {
    try {
      const data = {
        metrics: this.metrics,
        timestamp: new Date()
      }
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save performance metrics:', error)
    }
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics = []
    localStorage.removeItem(this.STORAGE_KEY)
  }

  /**
   * Get performance score
   */
  static getPerformanceScore(): number {
    const report = this.getPerformanceReport()
    const { summary } = report

    // Calculate score based on Core Web Vitals
    let score = 100

    // First Contentful Paint (FCP) - Good: < 1.8s, Needs Improvement: 1.8s - 3.0s, Poor: > 3.0s
    if (summary.firstContentfulPaint > 3000) score -= 30
    else if (summary.firstContentfulPaint > 1800) score -= 15

    // Largest Contentful Paint (LCP) - Good: < 2.5s, Needs Improvement: 2.5s - 4.0s, Poor: > 4.0s
    if (summary.largestContentfulPaint > 4000) score -= 30
    else if (summary.largestContentfulPaint > 2500) score -= 15

    // Cumulative Layout Shift (CLS) - Good: < 0.1, Needs Improvement: 0.1 - 0.25, Poor: > 0.25
    if (summary.cumulativeLayoutShift > 0.25) score -= 20
    else if (summary.cumulativeLayoutShift > 0.1) score -= 10

    // First Input Delay (FID) - Good: < 100ms, Needs Improvement: 100ms - 300ms, Poor: > 300ms
    if (summary.firstInputDelay > 300) score -= 20
    else if (summary.firstInputDelay > 100) score -= 10

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get performance recommendations
   */
  static getPerformanceRecommendations(): string[] {
    const report = this.getPerformanceReport()
    const { summary } = report
    const recommendations: string[] = []

    if (summary.firstContentfulPaint > 1800) {
      recommendations.push('Optimize First Contentful Paint by reducing server response time and eliminating render-blocking resources')
    }

    if (summary.largestContentfulPaint > 2500) {
      recommendations.push('Improve Largest Contentful Paint by optimizing images and removing unused CSS')
    }

    if (summary.cumulativeLayoutShift > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting size attributes on images and avoiding dynamically injected content')
    }

    if (summary.firstInputDelay > 100) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and breaking up long tasks')
    }

    if (summary.totalBlockingTime > 200) {
      recommendations.push('Reduce Total Blocking Time by optimizing JavaScript and using code splitting')
    }

    if (summary.totalLoadTime > 3000) {
      recommendations.push('Optimize total load time by enabling compression and using a CDN')
    }

    return recommendations
  }

  /**
   * Export performance data
   */
  static exportPerformanceData(): string {
    const report = this.getPerformanceReport()
    return JSON.stringify(report, null, 2)
  }

  /**
   * Get performance summary
   */
  static getPerformanceSummary(): {
    score: number
    grade: string
    recommendations: string[]
    metrics: {
      fcp: number
      lcp: number
      cls: number
      fid: number
      tbt: number
      loadTime: number
    }
  } {
    const report = this.getPerformanceReport()
    const score = this.getPerformanceScore()
    const recommendations = this.getPerformanceRecommendations()
    
    let grade: string
    if (score >= 90) grade = 'A'
    else if (score >= 80) grade = 'B'
    else if (score >= 70) grade = 'C'
    else if (score >= 60) grade = 'D'
    else grade = 'F'

    return {
      score,
      grade,
      recommendations,
      metrics: {
        fcp: report.summary.firstContentfulPaint,
        lcp: report.summary.largestContentfulPaint,
        cls: report.summary.cumulativeLayoutShift,
        fid: report.summary.firstInputDelay,
        tbt: report.summary.totalBlockingTime,
        loadTime: report.summary.totalLoadTime
      }
    }
  }
}
