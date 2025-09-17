import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Search, Edit3, Trash2, Star, Folder, FolderOpen, Settings, Mic, Archive, ArchiveRestore, Tag } from 'lucide-react'
import NoteEditor from '../components/NoteEditor'
import FolderManager from '../components/FolderManager'
import AudioRecorder from '../components/AudioRecorder'

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showFolderManager, setShowFolderManager] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const queryClient = useQueryClient()

  // Fetch notes
  const { data: notes, isLoading, error } = useQuery(
    'notes',
    async () => {
      const response = await fetch('http://localhost:8000/api/notes/')
      if (!response.ok) {
        throw new Error('Failed to fetch notes')
      }
      return response.json()
    }
  )

  // Fetch folders
  const { data: folders } = useQuery(
    'folders',
    async () => {
      const response = await fetch('http://localhost:8000/api/folders/')
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }
      return response.json()
    }
  )

  // Delete note mutation
  const deleteNoteMutation = useMutation(
    async (id: number) => {
      const response = await fetch(`http://localhost:8000/api/notes/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete note')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
      },
      onError: (error) => {
        console.error('Failed to delete note:', error)
        alert('Failed to delete note. Please try again.')
      }
    }
  )

  const handleDeleteNote = (id: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(id)
    }
  }

  const filteredNotes = notes?.filter((note: any) => {
    const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFolder = selectedFolderId === null || 
                         note.folder_id === selectedFolderId
    
    const matchesFavorites = !showFavorites || note.is_favorite === true
    
    const matchesArchived = showArchived ? note.is_archived === true : note.is_archived !== true
    
    const matchesTag = selectedTag === null || 
                      (note.tags && note.tags.includes(selectedTag))
    
    return matchesSearch && matchesFolder && matchesFavorites && matchesArchived && matchesTag
  }) || []

  // Get all unique tags from notes
  const allTags = Array.from(new Set(
    notes?.flatMap((note: any) => note.tags || []) || []
  )).sort()

  const selectedFolder = folders?.find((folder: any) => folder.id === selectedFolderId)

  const handleTranscriptionComplete = (text: string) => {
    // Create a new note with the transcribed text
    setSelectedNote(0) // Open new note editor
    setShowAudioRecorder(false)
    // The NoteEditor will handle setting the content
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 Note App</h1>
            <p className="text-lg text-gray-600">Modern Note Taking Application</p>
            {selectedFolder && (
              <div className="flex items-center mt-2 text-sm text-blue-600">
                <FolderOpen className="h-4 w-4 mr-1" />
                <span>Viewing: {selectedFolder.name}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <button
              onClick={() => setShowAudioRecorder(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Mic className="h-4 w-4 mr-2" />
              Record Audio
            </button>
            <button
              onClick={() => setShowFolderManager(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Folders
            </button>
            <button 
              onClick={() => setSelectedNote(0)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </button>
          </div>
        </div>

        {/* Search and Folder Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center space-x-2 flex-wrap">
            {/* Folder Filter */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  selectedFolderId === null
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Folder className="h-4 w-4 mr-2" />
                All Notes
              </button>
              
              {folders?.slice(0, 2).map((folder: any) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FolderOpen className="h-4 w-4 mr-2" />
                  {folder.name}
                </button>
              ))}
              
              {folders && folders.length > 2 && (
                <button
                  onClick={() => setShowFolderManager(true)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  +{folders.length - 2} more
                </button>
              )}
            </div>
            
            {/* Favorites and Archiving Filter */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFavorites(!showFavorites)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  showFavorites
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Star className={`h-4 w-4 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                Favorites
              </button>
              
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                  showArchived
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showArchived ? (
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                ) : (
                  <Archive className="h-4 w-4 mr-2" />
                )}
                {showArchived ? 'Show Active' : 'Archived'}
              </button>
            </div>
            
            {/* Tags Filter */}
            {allTags.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedTag(null)}
                  className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                    selectedTag === null
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  All Tags
                </button>
                
                {allTags.slice(0, 3).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                      selectedTag === tag
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    {tag}
                  </button>
                ))}
                
                {allTags.length > 3 && (
                  <span className="text-sm text-gray-500">
                    +{allTags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* API Status */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Backend Connection Status</h2>
          
          {isLoading && (
            <div className="flex items-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Connecting to backend...
            </div>
          )}
          
          {error && (
            <div className="text-red-600">
              ❌ Backend connection failed: {error.message}
            </div>
          )}
          
          {notes && (
            <div className="text-green-600">
              ✅ Backend connected successfully! Found {notes.length} notes.
            </div>
          )}

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Features Ready:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>✅ React Router navigation</li>
              <li>✅ React Query state management</li>
              <li>✅ Tailwind CSS styling</li>
              <li>✅ Backend API connection</li>
              <li>🔄 Note creation and editing (coming next)</li>
              <li>🔄 Folder management (coming next)</li>
              <li>🔄 Audio transcription (coming next)</li>
            </ul>
          </div>
        </div>

        {/* Notes Display */}
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Loading notes...</span>
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <Edit3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery ? 'Try a different search term' : 'Get started by creating your first note'}
            </p>
            <button
              onClick={() => setSelectedNote(0)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Note
            </button>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Your Notes ({filteredNotes.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note: any) => (
                <div 
                  key={note.id} 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedNote(note.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {note.title || 'Untitled Note'}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {note.is_favorite && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" title="Favorite" />
                        )}
                        {note.is_archived && (
                          <Archive className="h-4 w-4 text-orange-500" title="Archived" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedNote(note.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-blue-600"
                        title="Edit note"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-red-600"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {note.content || 'No content'}
                  </p>
                  
                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.slice(0, 3).map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{note.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Note Editor Modal */}
        {selectedNote !== null && (
          <NoteEditor
            noteId={selectedNote}
            onClose={() => setSelectedNote(null)}
          />
        )}

        {/* Folder Manager Modal */}
        {showFolderManager && (
          <FolderManager
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onClose={() => setShowFolderManager(false)}
          />
        )}

        {/* Audio Recorder Modal */}
        {showAudioRecorder && (
          <AudioRecorder
            onTranscriptionComplete={handleTranscriptionComplete}
            onClose={() => setShowAudioRecorder(false)}
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
