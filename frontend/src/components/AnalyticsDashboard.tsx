import React from 'react'
import { X, BarChart3, TrendingUp, FileText, Folder, Calendar, Activity, Target } from 'lucide-react'
import { AnalyticsData } from '../services/analytics'

interface AnalyticsDashboardProps {
  data: AnalyticsData
  onClose: () => void
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data, onClose }) => {
  const StatCard = ({ title, value, icon: Icon, color = 'blue' }: {
    title: string
    value: string | number
    icon: React.ComponentType<any>
    color?: string
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  )

  const SimpleChart = ({ data, title, color = 'blue' }: {
    data: { month: string; count: number }[]
    title: string
    color?: string
  }) => {
    const maxValue = Math.max(...data.map(d => d.count))
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">{title}</h3>
        <div className="flex items-end space-x-2 h-32">
          {data.slice(-6).map((item, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-${color}-500 rounded-t`}
                style={{ height: `${(item.count / maxValue) * 100}%` }}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {item.month.split('-')[1]}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Analytics Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Notes"
              value={data.totalNotes}
              icon={FileText}
              color="blue"
            />
            <StatCard
              title="Total Folders"
              value={data.totalFolders}
              icon={Folder}
              color="green"
            />
            <StatCard
              title="Total Words"
              value={data.totalWords.toLocaleString()}
              icon={BarChart3}
              color="purple"
            />
            <StatCard
              title="Avg Words/Note"
              value={data.averageWordsPerNote}
              icon={TrendingUp}
              color="orange"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SimpleChart
              data={data.notesByMonth}
              title="Notes Created by Month"
              color="blue"
            />
            <SimpleChart
              data={data.wordsByMonth}
              title="Words Written by Month"
              color="green"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Folders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Top Folders</h3>
              {data.topFolders.length > 0 ? (
                <div className="space-y-2">
                  {data.topFolders.map((folder, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300">{folder.name}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {folder.count} notes
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No folders with notes</p>
              )}
            </div>

            {/* Productivity Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Productivity</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">This Week</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.productivityStats.notesThisWeek} notes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">This Month</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.productivityStats.notesThisMonth} notes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Avg per Day</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.productivityStats.averageNotesPerDay} notes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Most Productive Day</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.productivityStats.mostProductiveDay}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Insights */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Content Insights</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Longest Note</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{data.contentInsights.longestNote.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{data.contentInsights.longestNote.wordCount} words</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Note Length</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{data.contentInsights.averageNoteLength} words</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
              {data.recentActivity.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <Activity className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {activity.action}: {activity.note}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
              )}
            </div>
          </div>

          {/* Most Used Words */}
          {data.contentInsights.mostUsedWords.length > 0 && (
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Most Used Words</h3>
              <div className="flex flex-wrap gap-2">
                {data.contentInsights.mostUsedWords.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {word.word} ({word.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard