import React, { useState, useEffect } from 'react'
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw,
  Download,
  BarChart3,
  Gauge,
  Target
} from 'lucide-react'
import { PerformanceService, PerformanceMetric, PerformanceReport } from '../services/performance'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<PerformanceReport | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      refreshData()
    }
  }, [isOpen])

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      const newReport = PerformanceService.getPerformanceReport()
      const newSummary = PerformanceService.getPerformanceSummary()
      setReport(newReport)
      setSummary(newSummary)
    } catch (error) {
      console.error('Failed to refresh performance data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const exportData = () => {
    const data = PerformanceService.exportPerformanceData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 80) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 70) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 dark:bg-green-900'
    if (score >= 80) return 'bg-yellow-100 dark:bg-yellow-900'
    if (score >= 70) return 'bg-orange-100 dark:bg-orange-900'
    return 'bg-red-100 dark:bg-red-900'
  }

  const formatMetricValue = (value: number, unit: string) => {
    if (unit === 'ms') {
      return `${Math.round(value)}ms`
    }
    if (unit === 'score') {
      return value.toFixed(3)
    }
    return `${value.toFixed(2)}${unit}`
  }

  const getMetricStatus = (name: string, value: number) => {
    const thresholds: Record<string, { good: number; poor: number }> = {
      'first-contentful-paint': { good: 1800, poor: 3000 },
      'largest-contentful-paint': { good: 2500, poor: 4000 },
      'layout-shift': { good: 0.1, poor: 0.25 },
      'first-input-delay': { good: 100, poor: 300 },
      'total-blocking-time': { good: 200, poor: 600 }
    }

    const threshold = thresholds[name]
    if (!threshold) return 'unknown'

    if (value <= threshold.good) return 'good'
    if (value <= threshold.poor) return 'needs-improvement'
    return 'poor'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'needs-improvement':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'poor':
        return <X className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Performance Dashboard
            </h2>
            {summary && (
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(summary.score)} ${getScoreColor(summary.score)}`}>
                {summary.grade} ({summary.score}/100)
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={exportData}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              title="Export data"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {!summary ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading performance data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Performance Score */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Performance Score
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Gauge className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <span className={`text-2xl font-bold ${getScoreColor(summary.score)}`}>
                      {summary.score}/100
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      summary.score >= 90 ? 'bg-green-500' :
                      summary.score >= 80 ? 'bg-yellow-500' :
                      summary.score >= 70 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${summary.score}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Grade: {summary.grade} - {summary.score >= 90 ? 'Excellent' : 
                   summary.score >= 80 ? 'Good' : 
                   summary.score >= 70 ? 'Needs Improvement' : 'Poor'}
                </p>
              </div>

              {/* Core Web Vitals */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Core Web Vitals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">First Contentful Paint</h4>
                      {getStatusIcon(getMetricStatus('first-contentful-paint', summary.metrics.fcp))}
                    </div>
                    <p className={`text-2xl font-bold ${getStatusColor(getMetricStatus('first-contentful-paint', summary.metrics.fcp))}`}>
                      {formatMetricValue(summary.metrics.fcp, 'ms')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Good: &lt; 1.8s, Poor: &gt; 3.0s
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Largest Contentful Paint</h4>
                      {getStatusIcon(getMetricStatus('largest-contentful-paint', summary.metrics.lcp))}
                    </div>
                    <p className={`text-2xl font-bold ${getStatusColor(getMetricStatus('largest-contentful-paint', summary.metrics.lcp))}`}>
                      {formatMetricValue(summary.metrics.lcp, 'ms')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Good: &lt; 2.5s, Poor: &gt; 4.0s
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Cumulative Layout Shift</h4>
                      {getStatusIcon(getMetricStatus('layout-shift', summary.metrics.cls))}
                    </div>
                    <p className={`text-2xl font-bold ${getStatusColor(getMetricStatus('layout-shift', summary.metrics.cls))}`}>
                      {formatMetricValue(summary.metrics.cls, 'score')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Good: &lt; 0.1, Poor: &gt; 0.25
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">First Input Delay</h4>
                      {getStatusIcon(getMetricStatus('first-input-delay', summary.metrics.fid))}
                    </div>
                    <p className={`text-2xl font-bold ${getStatusColor(getMetricStatus('first-input-delay', summary.metrics.fid))}`}>
                      {formatMetricValue(summary.metrics.fid, 'ms')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Good: &lt; 100ms, Poor: &gt; 300ms
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Total Blocking Time</h4>
                      {getStatusIcon(getMetricStatus('total-blocking-time', summary.metrics.tbt))}
                    </div>
                    <p className={`text-2xl font-bold ${getStatusColor(getMetricStatus('total-blocking-time', summary.metrics.tbt))}`}>
                      {formatMetricValue(summary.metrics.tbt, 'ms')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Good: &lt; 200ms, Poor: &gt; 600ms
                    </p>
                  </div>

                  <div className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">Total Load Time</h4>
                      <Clock className="h-4 w-4 text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatMetricValue(summary.metrics.loadTime, 'ms')}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Time from navigation start to load complete
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Performance Recommendations
                  </h3>
                  <div className="space-y-2">
                    {summary.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metrics History */}
              {report && report.metrics.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Performance Metrics
                  </h3>
                  <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Metric
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Value
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Time
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                          {report.metrics.slice(-20).reverse().map((metric, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">
                                {metric.name}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                {formatMetricValue(metric.value, metric.unit)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                                  {metric.category}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(getMetricStatus(metric.name, metric.value))}
                                  <span className={getStatusColor(getMetricStatus(metric.name, metric.value))}>
                                    {getMetricStatus(metric.name, metric.value)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {metric.timestamp.toLocaleTimeString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
