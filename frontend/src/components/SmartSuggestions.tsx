import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  Folder, 
  Tag, 
  Archive, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  ChevronRight,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react'
import { SmartOrganizationService, SmartSuggestion, NoteInsight } from '../services/smartOrganization'
import { Note, Folder as FolderType } from '../types'

interface SmartSuggestionsProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  folders: FolderType[]
  onApplySuggestion: (suggestion: SmartSuggestion) => void
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onApplySuggestion
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([])
  const [insights, setInsights] = useState<NoteInsight[]>([])
  const [activeTab, setActiveTab] = useState<'suggestions' | 'insights' | 'productivity'>('suggestions')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSuggestions()
      loadInsights()
    }
  }, [isOpen, notes, folders])

  const loadSuggestions = async () => {
    setIsLoading(true)
    try {
      // Generate suggestions for the most recent note
      const recentNote = notes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0]
      
      if (recentNote) {
        const newSuggestions = SmartOrganizationService.generateSuggestions(recentNote, notes, folders)
        setSuggestions(newSuggestions)
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadInsights = async () => {
    try {
      const newInsights = SmartOrganizationService.generateInsights(notes)
      setInsights(newInsights)
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }

  const getSuggestionIcon = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'folder': return <Folder className="h-4 w-4" />
      case 'tag': return <Tag className="h-4 w-4" />
      case 'archive': return <Archive className="h-4 w-4" />
      case 'favorite': return <Star className="h-4 w-4" />
      case 'content': return <AlertTriangle className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getSuggestionColor = (type: SmartSuggestion['type']) => {
    switch (type) {
      case 'folder': return 'text-blue-600 dark:text-blue-400'
      case 'tag': return 'text-green-600 dark:text-green-400'
      case 'archive': return 'text-orange-600 dark:text-orange-400'
      case 'favorite': return 'text-yellow-600 dark:text-yellow-400'
      case 'content': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getInsightIcon = (type: NoteInsight['type']) => {
    switch (type) {
      case 'duplicate': return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'similar': return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'incomplete': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'outdated': return <AlertTriangle className="h-5 w-5 text-gray-500" />
      case 'important': return <CheckCircle className="h-5 w-5 text-green-500" />
      default: return <Lightbulb className="h-5 w-5 text-blue-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Smart Suggestions
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
            { id: 'insights', label: 'Insights', icon: Target },
            { id: 'productivity', label: 'Productivity', icon: TrendingUp }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
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
          {activeTab === 'suggestions' && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-400">Analyzing notes...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No suggestions available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create some notes to get smart suggestions
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Smart Suggestions ({suggestions.length})
                  </h3>
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getSuggestionColor(suggestion.type)}`}>
                            {getSuggestionIcon(suggestion.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                              {suggestion.suggestion}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {suggestion.reason}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                                {getConfidenceText(suggestion.confidence)} Confidence
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {Math.round(suggestion.confidence * 100)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => onApplySuggestion(suggestion)}
                          className="p-2 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                          title="Apply suggestion"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Note Insights ({insights.length})
              </h3>
              {insights.length === 0 ? (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No insights available
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Create more notes to get insights
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-start space-x-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            {insight.message}
                          </h4>
                          <div className="space-y-2">
                            {insight.suggestions.map((suggestion, suggestionIndex) => (
                              <div
                                key={suggestionIndex}
                                className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400"
                              >
                                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                <span>{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'productivity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Productivity Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Note Statistics
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                    <div>Total Notes: {notes.length}</div>
                    <div>Average Words: {Math.round(notes.reduce((sum, note) => sum + (note.content || '').split(/\s+/).length, 0) / notes.length) || 0}</div>
                  </div>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
                    Organization
                  </h4>
                  <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                    <div>Folders: {folders.length}</div>
                    <div>Tagged Notes: {notes.filter(note => note.tags && note.tags.length > 0).length}</div>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                  Smart Tips
                </h4>
                <div className="space-y-2 text-sm text-purple-800 dark:text-purple-200">
                  <div>• Use tags to organize related notes</div>
                  <div>• Create folders for different topics</div>
                  <div>• Archive old notes to keep your workspace clean</div>
                  <div>• Use the search function to find notes quickly</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartSuggestions
