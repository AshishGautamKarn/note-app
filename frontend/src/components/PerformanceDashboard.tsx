import React, { useState, useEffect } from 'react'
import { X, Download, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { PerformanceService, PerformanceMetrics, PerformanceRecommendation } from '../services/performance'

interface PerformanceDashboardProps {
  onClose: () => void
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ onClose }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  const performanceService = PerformanceService.getInstance()

  useEffect(() => {
    loadMetrics()
    performanceService.startMonitoring()
    
    return () => {
      performanceService.stopMonitoring()
    }
  }, [])

  const loadMetrics = () => {
    const latestMetrics = performanceService.getLatestMetrics()
    const latestRecommendations = performanceService.getRecommendations()
    
    setMetrics(latestMetrics)
    setRecommendations(latestRecommendations)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Wait a bit for new metrics to be collected
    setTimeout(() => {
      loadMetrics()
      setIsRefreshing(false)
    }, 1000)
  }

  const handleExport = () => {
    const data = performanceService.exportMetrics()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatMetric = (value: number | null, unit: string = 'ms'): string => {
    if (value === null) return 'N/A'
    return `${value.toFixed(2)}${unit}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'needs-improvement':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'poor':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400'
      case 'needs-improvement':
        return 'text-yellow-600 dark:text-yellow-400'
      case 'poor':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Performance Dashboard</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              title="Refresh metrics"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Export metrics"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!metrics ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Collecting performance metrics...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Core Web Vitals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Web Vitals</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">FCP</span>
                      {getStatusIcon(metrics.fcp && metrics.fcp <= 1800 ? 'good' : metrics.fcp && metrics.fcp <= 3000 ? 'needs-improvement' : 'poor')}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.fcp)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">First Contentful Paint</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">LCP</span>
                      {getStatusIcon(metrics.lcp && metrics.lcp <= 2500 ? 'good' : metrics.lcp && metrics.lcp <= 4000 ? 'needs-improvement' : 'poor')}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.lcp)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Largest Contentful Paint</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">FID</span>
                      {getStatusIcon(metrics.fid && metrics.fid <= 100 ? 'good' : metrics.fid && metrics.fid <= 300 ? 'needs-improvement' : 'poor')}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.fid)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">First Input Delay</div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">CLS</span>
                      {getStatusIcon(metrics.cls && metrics.cls <= 0.1 ? 'good' : metrics.cls && metrics.cls <= 0.25 ? 'needs-improvement' : 'poor')}
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.cls, '')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Cumulative Layout Shift</div>
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Load Time</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.loadTime)}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">DOM Content Loaded</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetric(metrics.domContentLoaded)}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Memory Usage</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {metrics.memoryUsage ? `${(metrics.memoryUsage * 100).toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Performance Recommendations</h3>
                  <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(rec.status)}
                            <span className="font-medium text-gray-900 dark:text-gray-100">{rec.metric}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} priority
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600 dark:text-gray-400">Current: {formatMetric(rec.current)}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">Threshold: {formatMetric(rec.threshold)}</div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{rec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No recommendations */}
              {recommendations.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Great Performance!</h3>
                  <p className="text-gray-600 dark:text-gray-400">All metrics are within recommended thresholds.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard