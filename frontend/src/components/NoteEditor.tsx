import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { X, Save, Star, Archive, Tag, Folder } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import { RichTextEditorService } from '../services/richTextEditor'

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

interface NoteEditorProps {
  note: Note | null
  folders: Folder[]
  onClose: () => void
  onSave: (note: Note) => void
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, folders, onClose, onSave }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [useRichText, setUseRichText] = useState(false)

  const queryClient = useQueryClient()

  // Update note mutation
  const updateNoteMutation = useMutation(
    async (updatedNote: Partial<Note>) => {
      const response = await fetch(`http://localhost:8000/api/notes/${note?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedNote),
      })
      if (!response.ok) throw new Error('Failed to update note')
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
        onClose()
      },
    }
  )

  // Create note mutation
  const createNoteMutation = useMutation(
    async (newNote: Partial<Note>) => {
      const response = await fetch('http://localhost:8000/api/notes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newNote),
      })
      if (!response.ok) throw new Error('Failed to create note')
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notes')
        onClose()
      },
    }
  )

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setSelectedFolderId(note.folder_id)
      setTags(note.tags)
      setIsFavorite(note.is_favorite)
      setIsArchived(note.is_archived)
    } else {
      setTitle('')
      setContent('')
      setSelectedFolderId(null)
      setTags([])
      setIsFavorite(false)
      setIsArchived(false)
    }
  }, [note])

  const handleSave = async () => {
    // Calculate word count based on content type
    const wordCount = useRichText 
      ? RichTextEditorService.getWordCount(content)
      : content.split(/\s+/).filter(word => word.length > 0).length

    const noteData = {
      title,
      content,
      folder_id: selectedFolderId,
      tags,
      is_favorite: isFavorite,
      is_archived: isArchived,
      word_count: wordCount,
      char_count: content.length,
    }

    if (note) {
      updateNoteMutation.mutate(noteData)
    } else {
      createNoteMutation.mutate(noteData)
    }
  }

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {note ? 'Edit Note' : 'New Note'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="Enter note title..."
                onKeyDown={handleKeyPress}
              />
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Content
                </label>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <input
                      type="checkbox"
                      checked={useRichText}
                      onChange={(e) => setUseRichText(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mr-2"
                    />
                    Rich Text Editor
                  </label>
                </div>
              </div>
              
              {useRichText ? (
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Enter note content..."
                  className="h-64"
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 h-64 resize-none"
                  placeholder="Enter note content..."
                  onKeyDown={handleKeyPress}
                />
              )}
            </div>

            {/* Folder Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Folder
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              >
                <option value="">No folder</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  Favorite
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                  <Archive className="w-4 h-4 mr-1" />
                  Archived
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || updateNoteMutation.isLoading || createNoteMutation.isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateNoteMutation.isLoading || createNoteMutation.isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NoteEditor