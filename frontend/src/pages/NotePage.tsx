import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit3, 
  Star, 
  Archive, 
  Trash2, 
  Copy, 
  Move,
  Share2,
  Download
} from 'lucide-react'
import { api } from '../services/api'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import NoteEditor from '../components/NoteEditor'

const NotePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showEditor, setShowEditor] = useState(false)
  const queryClient = useQueryClient()

  const { data: note, isLoading } = useQuery(
    ['note', id],
    () => api.getNote(Number(id)).then(res => res.data),
    {
      enabled: !!id,
    }
  )

  const deleteMutation = useMutation(
    () => api.deleteNote(Number(id)),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
        toast.success('Note deleted successfully')
        navigate('/')
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
        queryClient.invalidateQueries(['note', id])
        queryClient.invalidateQueries('notes')
        toast.success('Note updated')
      }
    }
  )

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      deleteMutation.mutate()
    }
  }

  const handleToggleFavorite = () => {
    if (note) {
      toggleFavoriteMutation.mutate({ id: note.id, is_favorite: note.is_favorite })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!note) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Note not found</h2>
        <p className="text-gray-600 mb-6">The note you're looking for doesn't exist or has been deleted.</p>
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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/')}
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-md transition-colors ${
              note.is_favorite ? 'text-yellow-500 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            <Star className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowEditor(true)}
            className="btn btn-primary btn-sm"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      {/* Note Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="card"
      >
        <div className="card-content">
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {note.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <span>
              Created {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
            </span>
            <span>•</span>
            <span>
              Updated {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
            </span>
            <span>•</span>
            <span>{note.word_count} words</span>
            <span>•</span>
            <span>{note.char_count} characters</span>
            {note.folder_name && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <span className="mr-1">📁</span>
                  {note.folder_name}
                </span>
              </>
            )}
          </div>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {note.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {note.content ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {note.content}
              </div>
            ) : (
              <div className="text-gray-500 italic">
                No content available
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="card-footer">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowEditor(true)}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="btn btn-ghost btn-sm">
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </button>
              <button className="btn btn-ghost btn-sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Note Editor Modal */}
      {showEditor && (
        <NoteEditor
          noteId={note.id}
          onClose={() => setShowEditor(false)}
        />
      )}
    </div>
  )
}

export default NotePage
