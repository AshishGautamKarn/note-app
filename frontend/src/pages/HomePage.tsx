import React, { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Plus, Search, Edit3, Trash2, Star, Folder, FolderOpen, Sun, Moon, Keyboard, Archive, Download, FileText, BarChart3 } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'
import NoteEditor from '../components/NoteEditor'
import ExportImport from '../components/ExportImport'
import NoteTemplates from '../components/NoteTemplates'
import AnalyticsDashboard from '../components/AnalyticsDashboard'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { ExportData } from '../services/exportImport'
import { NoteTemplate } from '../services/noteTemplates'
import { AnalyticsService, AnalyticsData } from '../services/analytics'

interface Note {
  id: number
  title: string
  content: string
  folder_id: number | null
  folder_name: string | null
  tags: string[]
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string | null
  word_count: number
  char_count: number
}

interface Folder {
  id: number
  name: string
  description: string | null
  parent_id: number | null
  path: string
  created_at: string
  updated_at: string | null
  notes_count: number
  children_count: number
}

const HomePage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [showNoteEditor, setShowNoteEditor] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showExportImport, setShowExportImport] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()
  const searchInputRef = useRef<HTMLInputElement>(null)

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

  // Handler functions
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
    // Note is saved via the mutation in NoteEditor
    setShowNoteEditor(false)
    setEditingNote(null)
  }

  const handleImport = async (data: ExportData) => {
    try {
      // Import folders first
      for (const folder of data.folders) {
        await fetch('http://localhost:8000/api/folders/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folder.name })
        })
      }

      // Import notes
      for (const note of data.notes) {
        await fetch('http://localhost:8000/api/notes/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            is_favorite: note.is_favorite || false,
            is_archived: note.is_archived || false,
            folder_id: null // Will be handled by folder name matching
          })
        })
      }

      // Refresh data
      queryClient.invalidateQueries('notes')
      queryClient.invalidateQueries('folders')
    } catch (error) {
      console.error('Import failed:', error)
    }
  }

  const handleTemplateSelect = (template: NoteTemplate) => {
    // Create a new note with template content
    setEditingNote({
      id: 0,
      title: `New ${template.name}`,
      content: template.content,
      is_favorite: false,
      is_archived: false,
      folder_id: null,
      folder_name: null,
      word_count: 0,
      created_at: new Date().toISOString(),
      updated_at: null
    })
    setShowNoteEditor(true)
  }

  // Calculate analytics data
  const analyticsData: AnalyticsData = AnalyticsService.calculateAnalytics(notes, folders)

  // Filter notes based on search and folder
  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFolder = selectedFolderId === null || note.folder_id === selectedFolderId
    const matchesFavorites = !showFavorites || note.is_favorite
    const matchesArchived = !showArchived || note.is_archived
    return matchesSearch && matchesFolder && matchesFavorites && matchesArchived
  })

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
      action: () => searchInputRef.current?.focus(),
      description: 'Focus search'
    },
    {
      key: 'd',
      ctrlKey: true,
      action: toggleTheme,
      description: 'Toggle dark mode'
    },
    {
      key: '?',
      ctrlKey: true,
      action: () => setShowKeyboardHelp(true),
      description: 'Show keyboard shortcuts'
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Note App</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Toggle theme (Ctrl+D)"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowKeyboardHelp(true)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Keyboard shortcuts (Ctrl+?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowExportImport(true)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Export/Import data"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Note templates"
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Analytics dashboard"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleNewNote}
                className="btn btn-primary"
                title="New note (Ctrl+N)"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Folders</h2>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedFolderId(null)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    selectedFolderId === null
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All Notes ({notes.length})
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      selectedFolderId === folder.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Folder className="w-4 h-4 inline mr-2" />
                    {folder.name} ({folder.notes_count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search notes... (Ctrl+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showFavorites
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Star className="w-4 h-4 inline mr-1" />
                  Favorites
                </button>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    showArchived
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Archive className="w-4 h-4 inline mr-1" />
                  Archived
                </button>
              </div>
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedNote(note.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {note.is_favorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditNote(note)
                        }}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="text-gray-400 dark:text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3">
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
        </div>
      </div>

        {/* Note Editor Modal */}
        {showNoteEditor && (
          <NoteEditor
            note={editingNote}
            folders={folders}
            onClose={handleCloseEditor}
            onSave={handleSaveNote}
          />
        )}

        {/* Keyboard Shortcuts Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="text-xl">&times;</span>
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Create new note</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm">Ctrl+N</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Focus search</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm">Ctrl+K</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Toggle dark mode</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm">Ctrl+D</kbd>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Show shortcuts</span>
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm">Ctrl+?</kbd>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Export/Import Modal */}
        {showExportImport && (
          <ExportImport
            notes={notes}
            folders={folders}
            onImport={handleImport}
            onClose={() => setShowExportImport(false)}
          />
        )}

        {/* Note Templates Modal */}
        {showTemplates && (
          <NoteTemplates
            onSelectTemplate={handleTemplateSelect}
            onClose={() => setShowTemplates(false)}
          />
        )}

        {/* Analytics Dashboard Modal */}
        {showAnalytics && (
          <AnalyticsDashboard
            data={analyticsData}
            onClose={() => setShowAnalytics(false)}
          />
        )}

      </div>
    )
  }

  export default HomePage