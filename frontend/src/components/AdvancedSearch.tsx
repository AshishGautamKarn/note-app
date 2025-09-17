import React, { useState, useEffect, useRef } from 'react'
import { 
  Search, 
  Filter, 
  X, 
  Calendar, 
  Tag, 
  Folder, 
  Star, 
  Archive, 
  SortAsc, 
  SortDesc,
  Download,
  History,
  Clock,
  ChevronDown,
  Check
} from 'lucide-react'
import { AdvancedSearchService, SearchFilter, SearchResult, SearchSuggestion } from '../services/advancedSearch'
import { Note, Folder as FolderType } from '../types'

interface AdvancedSearchProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  folders: FolderType[]
  onNoteSelect: (noteId: number) => void
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  isOpen,
  onClose,
  notes,
  folders,
  onNoteSelect
}) => {
  const [filter, setFilter] = useState<SearchFilter>(AdvancedSearchService.getDefaultFilter())
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showExport, setShowExport] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'markdown'>('json')
  
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadSearchHistory()
      performSearch()
      searchInputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    performSearch()
  }, [filter, notes, folders])

  useEffect(() => {
    if (filter.query.trim()) {
      const newSuggestions = AdvancedSearchService.getSuggestions(
        filter.query,
        notes,
        folders,
        searchHistory
      )
      setSuggestions(newSuggestions)
    } else {
      setSuggestions([])
    }
  }, [filter.query, notes, folders, searchHistory])

  const loadSearchHistory = () => {
    const history = AdvancedSearchService.getSearchHistory()
    setSearchHistory(history)
  }

  const performSearch = async () => {
    setIsSearching(true)
    try {
      const searchResults = AdvancedSearchService.search(notes, filter, folders)
      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleQueryChange = (query: string) => {
    setFilter(prev => ({ ...prev, query }))
    setShowSuggestions(true)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setFilter(prev => ({ ...prev, query: suggestion.text }))
    setShowSuggestions(false)
    AdvancedSearchService.saveSearch(suggestion.text)
    loadSearchHistory()
  }

  const handleSearch = () => {
    if (filter.query.trim()) {
      AdvancedSearchService.saveSearch(filter.query)
      loadSearchHistory()
    }
    setShowSuggestions(false)
  }

  const handleFilterChange = (key: keyof SearchFilter, value: any) => {
    setFilter(prev => ({ ...prev, [key]: value }))
  }

  const handleClearFilters = () => {
    setFilter(AdvancedSearchService.getDefaultFilter())
  }

  const handleExport = () => {
    const data = AdvancedSearchService.exportSearchResults(results, exportFormat)
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `search-results-${new Date().toISOString().split('T')[0]}.${exportFormat}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const handleClearHistory = () => {
    AdvancedSearchService.clearSearchHistory()
    setSearchHistory([])
  }

  const stats = AdvancedSearchService.getSearchStats(results)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Search className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Advanced Search
            </h2>
            {results.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {results.length} results
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowExport(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
              title="Export results"
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

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes, tags, folders..."
              value={filter.query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch()
                if (e.key === 'Escape') setShowSuggestions(false)
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    {suggestion.type === 'recent' && <History className="h-4 w-4 text-gray-400" />}
                    {suggestion.type === 'tag' && <Tag className="h-4 w-4 text-green-500" />}
                    {suggestion.type === 'folder' && <Folder className="h-4 w-4 text-blue-500" />}
                    {suggestion.type === 'query' && <Search className="h-4 w-4 text-gray-400" />}
                    <span className="text-gray-900 dark:text-gray-100">{suggestion.text}</span>
                  </div>
                  {suggestion.count && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Folders Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folders
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {folders.map((folder) => (
                    <label key={folder.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.folders.includes(folder.id)}
                        onChange={(e) => {
                          const newFolders = e.target.checked
                            ? [...filter.folders, folder.id]
                            : filter.folders.filter(id => id !== folder.id)
                          handleFilterChange('folders', newFolders)
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                        {folder.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {Array.from(new Set(notes.flatMap(note => note.tags || []))).map((tag) => (
                    <label key={tag} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filter.tags.includes(tag)}
                        onChange={(e) => {
                          const newTags = e.target.checked
                            ? [...filter.tags, tag]
                            : filter.tags.filter(t => t !== tag)
                          handleFilterChange('tags', newTags)
                        }}
                        className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                        {tag}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filter.dateRange.start ? filter.dateRange.start.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filter.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    value={filter.dateRange.end ? filter.dateRange.end.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filter.dateRange,
                      end: e.target.value ? new Date(e.target.value) : null
                    })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Status Filters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filter.favorites === true}
                      onChange={(e) => handleFilterChange('favorites', e.target.checked ? true : null)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <Star className="h-4 w-4 ml-2 text-yellow-500" />
                    <span className="ml-1 text-sm text-gray-900 dark:text-gray-100">Favorites</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filter.archived === true}
                      onChange={(e) => handleFilterChange('archived', e.target.checked ? true : null)}
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <Archive className="h-4 w-4 ml-2 text-orange-500" />
                    <span className="ml-1 text-sm text-gray-900 dark:text-gray-100">Archived</span>
                  </label>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sort By
                </label>
                <div className="space-y-2">
                  <select
                    value={filter.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date Created</option>
                    <option value="title">Title</option>
                    <option value="updated">Last Updated</option>
                  </select>
                  <select
                    value={filter.sortOrder}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear all filters
              </button>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleClearHistory}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Clear history
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No results found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try adjusting your search terms or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search Stats */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Total Results:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {stats.totalResults}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Average Score:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {stats.averageScore}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Date Range:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {stats.dateRange.earliest.toLocaleDateString()} - {stats.dateRange.latest.toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Top Field:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                      {Object.entries(stats.topMatchedFields).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              {results.map((result, index) => (
                <div
                  key={result.note.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    onNoteSelect(result.note.id)
                    onClose()
                  }}
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
                  
                  {result.snippets.length > 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      {result.snippets[0].substring(0, 100)}...
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>Created: {new Date(result.note.created_at).toLocaleDateString()}</span>
                      <span>Updated: {new Date(result.note.updated_at).toLocaleDateString()}</span>
                    </div>
                    {result.note.tags && result.note.tags.length > 0 && (
                      <div className="flex space-x-1">
                        {result.note.tags.slice(0, 3).map((tag, tagIndex) => (
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export Modal */}
        {showExport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Export Search Results
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    onClick={() => setShowExport(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearch
