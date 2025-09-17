import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Hash, Star, Archive, Download, Search, Filter } from 'lucide-react'
import { AnalyticsService, NoteStats, SearchResult } from '../services/analytics'
import { Note, Folder } from '../types'

interface AnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  folders: Folder[]
  onNoteSelect: (noteId: number) => void
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onNoteSelect
}) => {
  const [stats, setStats] = useState<NoteStats | null>(null)
  const [insights, setInsights] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'insights'>('overview')

  useEffect(() => {
    if (isOpen && notes.length > 0) {
      const calculatedStats = AnalyticsService.calculateStats(notes, folders)
      const calculatedInsights = AnalyticsService.getProductivityInsights(notes)
      setStats(calculatedStats)
      setInsights(calculatedInsights)
    }
  }, [isOpen, notes, folders])

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = AnalyticsService.searchNotes(notes, searchQuery)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchQuery, notes])

  if (!isOpen || !stats) return null

  const topTags = AnalyticsService.getTopTags(notes, 10)

  const handleExportAnalytics = () => {
    if (stats && insights) {
      const data = AnalyticsService.exportAnalytics(stats, insights)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Analytics Dashboard
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportAnalytics}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              title="Export analytics"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'search', label: 'Advanced Search', icon: Search },
            { id: 'insights', label: 'Insights', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Hash className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Notes</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalNotes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Words</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalWords.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Favorites</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.favoriteNotes}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Archive className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Archived</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.archivedNotes}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Tags */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Top Tags</h3>
                  <div className="space-y-2">
                    {topTags.slice(0, 5).map(({ tag, count }, index) => (
                      <div key={tag} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">#{tag}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(count / topTags[0].count) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes by Folder */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notes by Folder</h3>
                  <div className="space-y-2">
                    {Object.entries(stats.notesByFolder).slice(0, 5).map(([folderId, count]) => {
                      const folder = folders.find(f => f.id.toString() === folderId)
                      const folderName = folder ? folder.name : 'No Folder'
                      return (
                        <div key={folderId} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{folderName}</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity (Last 30 Days)</h3>
                <div className="space-y-2">
                  {stats.recentActivity.slice(-7).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {new Date(activity.date).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-4">
                        <span className="text-green-600 dark:text-green-400">+{activity.notesCreated} created</span>
                        <span className="text-blue-600 dark:text-blue-400">~{activity.notesUpdated} updated</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search notes with advanced scoring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Search Results */}
              {searchResults.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Search Results ({searchResults.length})
                    </h3>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Sorted by relevance score
                    </div>
                  </div>
                  
                  {searchResults.map((result, index) => (
                    <div
                      key={result.note.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => onNoteSelect(result.note.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100">
                          {result.note.title || 'Untitled Note'}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                            Score: {result.score}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {result.matchedFields.join(', ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: result.highlights.content.substring(0, 200) + '...'
                          }}
                        />
                      </div>
                      
                      {result.note.tags && result.note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {result.note.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded-md"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try different search terms or check your spelling
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Advanced Search
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Enter search terms to find notes with intelligent scoring and highlighting
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && insights && (
            <div className="space-y-6">
              {/* Productivity Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">Productivity</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Most Productive Day</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{insights.mostProductiveDay}</p>
                    </div>
                    <div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">Average Notes per Day</p>
                      <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{insights.averageNotesPerDay}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">Content Stats</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Average Words per Note</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">{stats.averageWordsPerNote}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Total Characters</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">{stats.totalCharacters.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Longest and Shortest Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {insights.longestNote && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Longest Note</h3>
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => onNoteSelect(insights.longestNote.id)}
                    >
                      <p className="font-medium mb-2">{insights.longestNote.title || 'Untitled Note'}</p>
                      <p className="line-clamp-3">{(insights.longestNote.content || '').substring(0, 150)}...</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {(insights.longestNote.content || '').length} characters
                      </p>
                    </div>
                  </div>
                )}

                {insights.shortestNote && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shortest Note</h3>
                    <div
                      className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                      onClick={() => onNoteSelect(insights.shortestNote.id)}
                    >
                      <p className="font-medium mb-2">{insights.shortestNote.title || 'Untitled Note'}</p>
                      <p className="line-clamp-3">{(insights.shortestNote.content || '').substring(0, 150)}...</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {(insights.shortestNote.content || '').length} characters
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Most Used Words */}
              {insights.mostUsedWords.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Most Used Words</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.mostUsedWords.map(({ word, count }, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full"
                      >
                        {word} ({count})
                      </span>
                    ))}
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

export default AnalyticsDashboard
