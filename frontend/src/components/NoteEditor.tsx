import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from 'react-query'
import { X, Save, Trash2, Folder, Mic, Star, Archive, Users } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import TagsInput from './TagsInput'
import CollaborationPanel from './CollaborationPanel'
import RichTextEditor from './RichTextEditor'

interface NoteEditorProps {
  noteId: number | null
  onClose: () => void
}

interface Note {
  id: number
  title: string
  content: string
  folder_id?: number
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onClose }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [folderId, setFolderId] = useState<number | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAudioRecorder, setShowAudioRecorder] = useState(false)
  const [showCollaboration, setShowCollaboration] = useState(false)
  const queryClient = useQueryClient()

  // Fetch folders for dropdown
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

  // Load existing note if editing
  useEffect(() => {
    if (noteId && noteId > 0) {
      setIsLoading(true)
      fetch(`http://localhost:8000/api/notes/${noteId}`)
        .then(res => res.json())
        .then((note: Note) => {
          setTitle(note.title || '')
          setContent(note.content || '')
          setFolderId(note.folder_id || null)
          setIsFavorite(note.is_favorite || false)
          setIsArchived(note.is_archived || false)
          setTags(note.tags || [])
        })
        .catch(err => console.error('Failed to load note:', err))
        .finally(() => setIsLoading(false))
    } else {
      // Check for template content
      const templateContent = localStorage.getItem('note-app-template-content')
      if (templateContent) {
        setContent(templateContent)
        localStorage.removeItem('note-app-template-content')
      } else {
        setContent('')
      }
      
      setTitle('')
      setFolderId(null)
      setIsFavorite(false)
      setIsArchived(false)
      setTags([])
    }
  }, [noteId])

  // Save note mutation
  const saveNoteMutation = useMutation(
    async (noteData: { title: string; content: string; folder_id?: number | null; is_favorite?: boolean; is_archived?: boolean; tags?: string[] }) => {
      const url = noteId && noteId > 0 
        ? `http://localhost:8000/api/notes/${noteId}` 
        : 'http://localhost:8000/api/notes/'
      
      const method = noteId && noteId > 0 ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(noteData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save note')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
        onClose()
      },
      onError: (error) => {
        console.error('Failed to save note:', error)
        alert('Failed to save note. Please try again.')
      }
    }
  )

  // Delete note mutation
  const deleteNoteMutation = useMutation(
    async () => {
      if (!noteId || noteId <= 0) return
      
      const response = await fetch(`http://localhost:8000/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete note')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
        onClose()
      },
      onError: (error) => {
        console.error('Failed to delete note:', error)
        alert('Failed to delete note. Please try again.')
      }
    }
  )

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      alert('Please enter a title or content for the note.')
      return
    }
    
    saveNoteMutation.mutate({ 
      title: title.trim(), 
      content: content.trim(),
      folder_id: folderId,
      is_favorite: isFavorite,
      is_archived: isArchived,
      tags: tags
    })
  }

  const handleDelete = () => {
    if (noteId && noteId > 0) {
      if (window.confirm('Are you sure you want to delete this note?')) {
        deleteNoteMutation.mutate()
      }
    }
  }

  const handleTranscriptionComplete = (text: string) => {
    setContent(prev => prev + (prev ? '\n\n' : '') + text)
    setShowAudioRecorder(false)
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading note...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {noteId && noteId > 0 ? 'Edit Note' : 'New Note'}
          </h2>
          <div className="flex items-center space-x-2">
            {noteId && noteId > 0 && (
              <>
                <button
                  onClick={() => setShowCollaboration(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Collaborate"
                >
                  <Users className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
          {/* Title Input */}
          <div>
            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-medium border-none outline-none placeholder-gray-400"
              autoFocus
            />
          </div>

          {/* Folder Selector and Audio Recording */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-gray-500" />
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No folder</option>
                  {folders?.map((folder: any) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Favorites and Archiving */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`p-2 rounded-lg transition-colors ${
                    isFavorite 
                      ? 'bg-yellow-100 text-yellow-600' 
                      : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-600'
                  }`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                
                <button
                  onClick={() => setIsArchived(!isArchived)}
                  className={`p-2 rounded-lg transition-colors ${
                    isArchived 
                      ? 'bg-orange-100 text-orange-600' 
                      : 'text-gray-400 hover:bg-gray-100 hover:text-orange-600'
                  }`}
                  title={isArchived ? 'Unarchive note' : 'Archive note'}
                >
                  <Archive className={`h-4 w-4 ${isArchived ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
            
            <button
              onClick={() => setShowAudioRecorder(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Mic className="h-4 w-4" />
              <span>Record Audio</span>
            </button>
          </div>

          {/* Tags Input */}
          <div>
            <TagsInput
              tags={tags}
              onChange={setTags}
              placeholder="Add tags to organize your note..."
              maxTags={10}
            />
          </div>

          {/* Rich Text Editor */}
          <div className="flex-1">
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Start writing your note..."
              className="h-full"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-500">
            {content.length} characters
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saveNoteMutation.isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center transition-colors disabled:opacity-50"
            >
              {saveNoteMutation.isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {noteId && noteId > 0 ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Recorder Modal */}
      {showAudioRecorder && (
        <AudioRecorder
          onTranscriptionComplete={handleTranscriptionComplete}
          onClose={() => setShowAudioRecorder(false)}
        />
      )}

      {/* Collaboration Panel Modal */}
      {showCollaboration && noteId && noteId > 0 && (
        <CollaborationPanel
          isOpen={showCollaboration}
          onClose={() => setShowCollaboration(false)}
          noteId={noteId}
          noteTitle={title || 'Untitled Note'}
          currentUser={{
            id: 'current-user',
            name: 'Current User',
            email: 'user@example.com'
          }}
        />
      )}
    </div>
  )
}

export default NoteEditor