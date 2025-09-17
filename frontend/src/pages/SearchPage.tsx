import React, { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { Search, FileText, Clock, Folder } from 'lucide-react'
import { api } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const { data: searchResults, isLoading } = useQuery(
    ['search', searchQuery],
    () => api.searchNotes(searchQuery).then(res => res.data),
    {
      enabled: searchQuery.length > 2,
      staleTime: 30000,
    }
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleNoteClick = (noteId: number) => {
    navigate(`/note/${noteId}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Notes</h1>
        <p className="text-gray-600">Find your notes quickly and easily</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search notes by title or content..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input pl-12 pr-4 w-full text-lg"
          autoFocus
        />
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {query.length <= 2 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-500">Enter at least 3 characters to search your notes</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="card-content">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-gray-500">
              Found {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} for "{searchQuery}"
            </div>
            {searchResults.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="card hover:shadow-medium transition-shadow cursor-pointer group"
                onClick={() => handleNoteClick(note.id)}
              >
                <div className="card-content">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                        {note.title}
                      </h3>
                      {note.content && (
                        <p className="text-gray-600 line-clamp-3 mb-3">
                          {note.content}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                        </span>
                        {note.folder_name && (
                          <span className="flex items-center">
                            <Folder className="h-4 w-4 mr-1" />
                            {note.folder_name}
                          </span>
                        )}
                        <span>{note.word_count} words</span>
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {note.tags.slice(0, 5).map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {note.tags.length > 5 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              +{note.tags.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500 mb-4">
              No notes match your search for "{searchQuery}"
            </p>
            <div className="text-sm text-gray-400">
              <p>Try:</p>
              <ul className="mt-2 space-y-1">
                <li>• Using different keywords</li>
                <li>• Checking your spelling</li>
                <li>• Using more general terms</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchPage
