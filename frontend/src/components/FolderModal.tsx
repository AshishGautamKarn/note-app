import React, { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Folder, FolderPlus } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface FolderModalProps {
  isOpen: boolean
  onClose: () => void
  folderId?: number
}

const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, folderId }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState<number | null>(null)
  const queryClient = useQueryClient()

  const { data: folders } = useQuery(
    'folders',
    () => api.getFolders().then(res => res.data)
  )

  const createMutation = useMutation(
    (data: { name: string; description?: string; parent_id?: number }) =>
      api.createFolder(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('folders')
        toast.success('Folder created successfully')
        onClose()
        setName('')
        setDescription('')
        setParentId(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.detail || 'Failed to create folder')
      }
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Folder name is required')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
      parent_id: parentId || undefined,
    })
  }

  const handleClose = () => {
    onClose()
    setName('')
    setDescription('')
    setParentId(null)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FolderPlus className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">New Folder</h3>
              </div>
              <button
                onClick={handleClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Folder Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter folder name..."
                  className="input w-full"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter folder description (optional)..."
                  className="textarea w-full"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent Folder
                </label>
                <select
                  value={parentId || ''}
                  onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)}
                  className="input w-full"
                >
                  <option value="">No parent (root folder)</option>
                  {folders?.map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.path}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isLoading || !name.trim()}
                  className="btn btn-primary btn-md"
                >
                  {createMutation.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <FolderPlus className="h-4 w-4 mr-2" />
                  )}
                  Create Folder
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default FolderModal
