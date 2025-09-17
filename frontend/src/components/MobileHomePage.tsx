import React, { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Search, Edit3, Trash2, Star, Folder, Sun, Moon, Archive, BarChart3, Download, FileText } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import MobileNoteEditor from './MobileNoteEditor'
import MobileNavigation from './MobileNavigation'
import { TouchGesturesService, isMobileDevice } from '../services/touchGestures'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

interface Note {
  id: number
  title: string
  content: string
  is_favorite: boolean
  is_archived: boolean
  folder_id: number | null
  folder_name: string | null
  word_count: number
  created_at: string
  updated_at: string | null
}

interface Folder {
  id: number
  name: string
  created_at: string
  updated_at: string | null
  notes_count: number
  children_count: number
}

const MobileHomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [currentPage, setCurrentPage] = useState('home')
  const [showSearch, setShowSearch] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fetch notes
  const { data: notes = [], isLoading: notesLoading } = useQuery<Note[]>(
    'notes',
    async () => {
      const response = await fetch('http://localhost:8000/api/notes/')
      if (!response.ok) throw new Error('Failed to fetch notes')
      return response.json()
    }
  )

  // Fetch folders
  const { data: folders = [], isLoading: foldersLoading } = useQuery<Folder[]>(
    'folders',
    async () => {
      const response = await fetch('http://localhost:8000/api/folders/')
      if (!response.ok) throw new Error('Failed to fetch folders')
      return response.json()
    }
  )

  // Delete note mutation
  const deleteNoteMutation = useMutation(
    async (noteId: number) => {
      const response = await fetch(`http://localhost:8000/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete note')
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
      },
    }
  )

  const handleNewNote = () => {
    setEditingNote(null)
    setShowNoteEditor(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setShowNoteEditor(true)
  }

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId)
    }
  }

  const handleCloseEditor = () => {
    setShowNoteEditor(false)
    setEditingNote(null)
  }

  const handleSaveNote = (note: Note) => {
    setShowNoteEditor(false)
    setEditingNote(null)
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
    switch (page) {
      case 'favorites':
        setShowFavorites(true)
        setShowArchived(false)
        break
      case 'archived':
        setShowArchived(true)
        setShowFavorites(false)
        break
      default:
        setShowFavorites(false)
        setShowArchived(false)
        break
    }
  }

  // Filter notes based on search and folder
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = selectedFolderId === null || note.folder_id === selectedFolderId
    const matchesFavorites = !showFavorites || note.is_favorite
    const matchesArchived = !showArchived || note.is_archived
    return matchesSearch && matchesFolder && matchesFavorites && matchesArchived
  })

  // Touch gestures
  useEffect(() => {
    if (containerRef.current && isMobileDevice()) {
      const touchService = new TouchGesturesService(containerRef.current, {
        onSwipe: (direction, distance) => {
          if (direction === 'right' && distance > 100) {
            // Swipe right to go back
            if (showNoteEditor) {
              setShowNoteEditor(false)
            }
          }
        },
        onTap: (x, y) => {
          // Handle tap gestures if needed
        }
      })

      return () => touchService.destroy()
    }
  }, [showNoteEditor])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'n',
      ctrlKey: true,
      action: handleNewNote,
      description: 'Create new note'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: () => setShowSearch(true),
      description: 'Focus search'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: toggleTheme,
      description: 'Toggle dark mode'
    }
  ])

  if (notesLoading || foldersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading notes...</p>
        </div>
      </div>
    )
  }

  if (showNoteEditor) {
    return (
      <MobileNoteEditor
        note={editingNote}
        folders={folders}
        onClose={handleCloseEditor}
        onSave={handleSaveNote}
      />
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Navigation */}
      <MobileNavigation
        onNavigate={handleNavigate}
        currentPage={currentPage}
        onNewNote={handleNewNote}
      />

      {/* Search Bar */}
      {showSearch && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              autoFocus
            />
            <button
              onClick={() => setShowSearch(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => handleNavigate('favorites')}
              className={`p-2 rounded-md ${
                showFavorites
                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Star className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleNavigate('archived')}
              className={`p-2 rounded-md ${
                showArchived
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Archive className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="p-4">
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex-1 mr-2">
                  {note.title}
                </h3>
                <div className="flex items-center space-x-1">
                  {note.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  <button
                    onClick={() => handleEditNote(note)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                {note.content}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{note.word_count} words</span>
                <span>{new Date(note.created_at).toLocaleDateString()}</span>
              </div>

              {note.folder_name && (
                <div className="mt-2 flex items-center text-xs text-blue-600 dark:text-blue-400">
                  <Folder className="w-3 h-3 mr-1" />
                  {note.folder_name}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredNotes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Edit3 className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No notes found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Try adjusting your search terms' : 'Create your first note to get started'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleNewNote}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}

export default MobileHomePage