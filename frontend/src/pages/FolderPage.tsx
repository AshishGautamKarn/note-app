import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Folder, 
  Plus, 
  Edit3, 
  Trash2, 
  MoreVertical,
  Star,
  Archive
} from 'lucide-react'
import { api } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import NoteEditor from '../components/NoteEditor'
import FolderModal from '../components/FolderModal'

const FolderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedNote, setSelectedNote] = useState<number | null>(null)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: folder, isLoading: folderLoading } = useQuery(
    ['folder', id],
    () => api.getFolder(Number(id)).then(res => res.data),
    {
      enabled: !!id,
    }
  )

  const { data: notes, isLoading: notesLoading } = useQuery(
    ['folder-notes', id],
    () => api.folders.getFolderNotes(Number(id), true).then(res => res.data),
    {
      enabled: !!id,
    }
  )

  const deleteFolderMutation = useMutation(
    () => api.deleteFolder(Number(id), true),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('folders')
        toast.success('Folder deleted successfully')
        navigate('/')
      },
      onError: () => {
        toast.error('Failed to delete folder')
      }
    }
  )

  const deleteNoteMutation = useMutation(
    (noteId: number) => api.deleteNote(noteId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['folder-notes', id])
        queryClient.invalidateQueries('notes')
        toast.success('Note deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete note')
      }
    }
  )

  const toggleFavoriteMutation = useMutation(
    ({ id, is_favorite }: { id: number; is_favorite: boolean }) => 
      api.updateNote(id, { is_favorite }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['folder-notes', id])
        queryClient.invalidateQueries('notes')
        toast.success('Note updated')
      }
    }
  )

  const handleDeleteFolder = () => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder?.name}" and all its contents?`)) {
      deleteFolderMutation.mutate()
    }
  }

  const handleDeleteNote = (noteId: number) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(noteId)
    }
  }

  const handleToggleFavorite = (noteId: number, is_favorite: boolean) => {
    toggleFavoriteMutation.mutate({ id: noteId, is_favorite: !is_favorite })
  }

  if (folderLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!folder) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Folder not found</h2>
        <p className="text-gray-600 mb-6">The folder you're looking for doesn't exist or has been deleted.</p>
        <button
          onClick={() => navigate('/')}
          className="btn btn-primary btn-md"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="btn btn-secondary btn-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-primary-100 rounded-lg">
              <Folder className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{folder.name}</h1>
              {folder.description && (
                <p className="text-gray-600 mt-1">{folder.description}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="btn btn-secondary btn-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Folder
          </button>
          <button
            onClick={() => setSelectedNote(0)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </button>
        </div>
      </div>

      {/* Folder Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Path:</span>
            <span className="ml-2 text-gray-600">{folder.path}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Notes:</span>
            <span className="ml-2 text-gray-600">{folder.notes_count}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Created:</span>
            <span className="ml-2 text-gray-600">
              {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Grid */}
      {notesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="card-content">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : notes && notes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {notes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="card hover:shadow-medium transition-shadow cursor-pointer group"
                onClick={() => setSelectedNote(note.id)}
              >
                <div className="card-content">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                      {note.title}
                    </h3>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleFavorite(note.id, note.is_favorite)
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star className={`h-4 w-4 ${note.is_favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteNote(note.id)
                        }}
                        className="p-1 hover:bg-gray-100 rounded text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {note.content && (
                    <p className="text-sm text-gray-600 line-clamp-3 mb-3">
                      {note.content}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                    <div className="flex items-center space-x-2">
                      <span>{note.word_count} words</span>
                    </div>
                  </div>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notes in this folder</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first note in this folder</p>
          <button
            onClick={() => setSelectedNote(0)}
            className="btn btn-primary btn-md"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Note
          </button>
        </div>
      )}

      {/* Note Editor Modal */}
      <AnimatePresence>
        {selectedNote !== null && (
          <NoteEditor
            noteId={selectedNote}
            onClose={() => setSelectedNote(null)}
          />
        )}
      </AnimatePresence>

      {/* Folder Modal */}
      <FolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
      />
    </div>
  )
}

export default FolderPage
