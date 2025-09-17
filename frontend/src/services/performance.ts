export interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  tbt: number | null // Total Blocking Time
  ttfb: number | null // Time to First Byte
  loadTime: number | null
  domContentLoaded: number | null
  memoryUsage: number | null
  timestamp: number
}

export interface PerformanceRecommendation {
  metric: string
  current: number
  threshold: number
  status: 'good' | 'needs-improvement' | 'poor'
  recommendation: string
  priority: 'high' | 'medium' | 'low'
}

export class PerformanceService {
  private static instance: PerformanceService
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []
  private isMonitoring: boolean = false

  static getInstance(): PerformanceService {
    if (!PerformanceService.instance) {
      PerformanceService.instance = new PerformanceService()
    }
    return PerformanceService.instance
  }

  startMonitoring() {
    if (this.isMonitoring) return
    this.isMonitoring = true

    // Monitor Web Vitals
    this.observeWebVitals()
    
    // Monitor page load performance
    this.observePageLoad()
    
    // Monitor memory usage
    this.observeMemoryUsage()
    
    // Monitor long tasks
    this.observeLongTasks()
  }

  stopMonitoring() {
    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }

  private observeWebVitals() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint')
          if (fcpEntry) {
            this.recordMetric('fcp', fcpEntry.startTime)
          }
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('FCP observer not supported:', e)
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.recordMetric('lcp', lastEntry.startTime)
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('LCP observer not supported:', e)
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              this.recordMetric('fid', fid)
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('FID observer not supported:', e)
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.recordMetric('cls', clsValue)
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)
      } catch (e) {
        console.warn('CLS observer not supported:', e)
      }
    }
  }

  private observePageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        this.recordMetric('ttfb', navigation.responseStart - navigation.requestStart)
        this.recordMetric('loadTime', navigation.loadEventEnd - navigation.fetchStart)
        this.recordMetric('domContentLoaded', navigation.domContentLoadedEventEnd - navigation.fetchStart)
      }
    })
  }

  private observeMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      this.recordMetric('memoryUsage', memoryUsage)
    }
  }

  private observeLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          let totalBlockingTime = 0
          entries.forEach(entry => {
            totalBlockingTime += entry.duration - 50 // Tasks over 50ms are considered blocking
          })
          this.recordMetric('tbt', totalBlockingTime)
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)
      } catch (e) {
        console.warn('Long task observer not supported:', e)
      }
    }
  }

  private recordMetric(metric: keyof PerformanceMetrics, value: number) {
    const currentMetrics = this.getCurrentMetrics()
    currentMetrics[metric] = value
    currentMetrics.timestamp = Date.now()
    this.metrics.push({ ...currentMetrics })
  }

  private getCurrentMetrics(): PerformanceMetrics {
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      tbt: null,
      ttfb: null,
      loadTime: null,
      domContentLoaded: null,
      memoryUsage: null,
      timestamp: Date.now()
    }
  }

  getLatestMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getAverageMetrics(): Partial<PerformanceMetrics> {
    if (this.metrics.length === 0) return {}

    const sums = this.metrics.reduce((acc, metric) => {
      Object.keys(metric).forEach(key => {
        if (key !== 'timestamp' && metric[key as keyof PerformanceMetrics] !== null) {
          acc[key] = (acc[key] || 0) + (metric[key as keyof PerformanceMetrics] as number)
        }
      })
      return acc
    }, {} as Record<string, number>)

    const averages: Partial<PerformanceMetrics> = {}
    Object.keys(sums).forEach(key => {
      const count = this.metrics.filter(m => m[key as keyof PerformanceMetrics] !== null).length
      averages[key as keyof PerformanceMetrics] = count > 0 ? sums[key] / count : null
    })

    return averages
  }

  getRecommendations(): PerformanceRecommendation[] {
    const latest = this.getLatestMetrics()
    if (!latest) return []

    const recommendations: PerformanceRecommendation[] = []

    // FCP recommendations
    if (latest.fcp !== null) {
      const status = latest.fcp <= 1800 ? 'good' : latest.fcp <= 3000 ? 'needs-improvement' : 'poor'
      recommendations.push({
        metric: 'First Contentful Paint',
        current: latest.fcp,
        threshold: 1800,
        status,
        recommendation: status === 'good' ? 'FCP is excellent!' : 
          'Optimize critical rendering path, reduce server response time, or minimize render-blocking resources.',
        priority: status === 'poor' ? 'high' : status === 'needs-improvement' ? 'medium' : 'low'
      })
    }

    // LCP recommendations
    if (latest.lcp !== null) {
      const status = latest.lcp <= 2500 ? 'good' : latest.lcp <= 4000 ? 'needs-improvement' : 'poor'
      recommendations.push({
        metric: 'Largest Contentful Paint',
        current: latest.lcp,
        threshold: 2500,
        status,
        recommendation: status === 'good' ? 'LCP is excellent!' : 
          'Optimize images, remove unused CSS/JS, or improve server response time.',
        priority: status === 'poor' ? 'high' : status === 'needs-improvement' ? 'medium' : 'low'
      })
    }

    // FID recommendations
    if (latest.fid !== null) {
      const status = latest.fid <= 100 ? 'good' : latest.fid <= 300 ? 'needs-improvement' : 'poor'
      recommendations.push({
        metric: 'First Input Delay',
        current: latest.fid,
        threshold: 100,
        status,
        recommendation: status === 'good' ? 'FID is excellent!' : 
          'Break up long tasks, optimize JavaScript execution, or use web workers.',
        priority: status === 'poor' ? 'high' : status === 'needs-improvement' ? 'medium' : 'low'
      })
    }

    // CLS recommendations
    if (latest.cls !== null) {
      const status = latest.cls <= 0.1 ? 'good' : latest.cls <= 0.25 ? 'needs-improvement' : 'poor'
      recommendations.push({
        metric: 'Cumulative Layout Shift',
        current: latest.cls,
        threshold: 0.1,
        status,
        recommendation: status === 'good' ? 'CLS is excellent!' : 
          'Add size attributes to images/videos, avoid inserting content above existing content.',
        priority: status === 'poor' ? 'high' : status === 'needs-improvement' ? 'medium' : 'low'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  clearMetrics() {
    this.metrics = []
  }

  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2)
  }
}