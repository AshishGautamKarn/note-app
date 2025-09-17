import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Folder, FolderPlus, Edit3, Trash2, X, Save, ChevronRight, ChevronDown } from 'lucide-react'

interface Folder {
  id: number
  name: string
  description?: string
  color?: string
  created_at: string
  updated_at?: string
  note_count?: number
}

interface FolderManagerProps {
  selectedFolderId: number | null
  onFolderSelect: (folderId: number | null) => void
  onClose: () => void
}

const FolderManager: React.FC<FolderManagerProps> = ({ 
  selectedFolderId, 
  onFolderSelect, 
  onClose 
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [editingFolder, setEditingFolder] = useState<number | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set())
  const queryClient = useQueryClient()

  // Fetch folders
  const { data: folders, isLoading } = useQuery(
    'folders',
    async () => {
      const response = await fetch('http://localhost:8000/api/folders/')
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }
      return response.json()
    }
  )

  // Create folder mutation
  const createFolderMutation = useMutation(
    async (folderData: { name: string; description?: string }) => {
      const response = await fetch('http://localhost:8000/api/folders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(folderData),
      })
      
      if (!response.ok) {
        throw new Error('Failed to create folder')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('folders')
        setIsCreating(false)
        setNewFolderName('')
        setNewFolderDescription('')
      },
      onError: (error) => {
        console.error('Failed to create folder:', error)
        alert('Failed to create folder. Please try again.')
      }
    }
  )

  // Update folder mutation
  const updateFolderMutation = useMutation(
    async ({ id, data }: { id: number; data: { name: string; description?: string } }) => {
      const response = await fetch(`http://localhost:8000/api/folders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update folder')
      }
      
      return response.json()
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('folders')
        setEditingFolder(null)
      },
      onError: (error) => {
        console.error('Failed to update folder:', error)
        alert('Failed to update folder. Please try again.')
      }
    }
  )

  // Delete folder mutation
  const deleteFolderMutation = useMutation(
    async (id: number) => {
      const response = await fetch(`http://localhost:8000/api/folders/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete folder')
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('folders')
        if (selectedFolderId === editingFolder) {
          onFolderSelect(null)
        }
      },
      onError: (error) => {
        console.error('Failed to delete folder:', error)
        alert('Failed to delete folder. Please try again.')
      }
    }
  )

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name.')
      return
    }
    
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      description: newFolderDescription.trim() || undefined,
    })
  }

  const handleUpdateFolder = (id: number) => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name.')
      return
    }
    
    updateFolderMutation.mutate({
      id,
      data: {
        name: newFolderName.trim(),
        description: newFolderDescription.trim() || undefined,
      }
    })
  }

  const handleDeleteFolder = (id: number) => {
    if (window.confirm('Are you sure you want to delete this folder? All notes in this folder will be moved to "All Notes".')) {
      deleteFolderMutation.mutate(id)
    }
  }

  const toggleFolderExpansion = (folderId: number) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const startEditing = (folder: Folder) => {
    setEditingFolder(folder.id)
    setNewFolderName(folder.name)
    setNewFolderDescription(folder.description || '')
  }

  const cancelEditing = () => {
    setEditingFolder(null)
    setNewFolderName('')
    setNewFolderDescription('')
  }

  const startCreating = () => {
    setIsCreating(true)
    setNewFolderName('')
    setNewFolderDescription('')
  }

  const cancelCreating = () => {
    setIsCreating(false)
    setNewFolderName('')
    setNewFolderDescription('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Folders</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={startCreating}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Create new folder"
            >
              <FolderPlus className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Loading folders...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* All Notes Option */}
              <div
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedFolderId === null
                    ? 'bg-blue-50 border-2 border-blue-200'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
                onClick={() => onFolderSelect(null)}
              >
                <div className="flex items-center">
                  <Folder className="h-5 w-5 text-gray-500 mr-3" />
                  <span className="font-medium text-gray-900">All Notes</span>
                  <span className="ml-auto text-sm text-gray-500">
                    {folders?.reduce((total: number, folder: Folder) => total + (folder.note_count || 0), 0) || 0} notes
                  </span>
                </div>
              </div>

              {/* Folders List */}
              {folders?.map((folder: Folder) => (
                <div key={folder.id} className="border border-gray-200 rounded-lg">
                  <div
                    className={`p-3 cursor-pointer transition-colors ${
                      selectedFolderId === folder.id
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                    onClick={() => onFolderSelect(folder.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFolderExpansion(folder.id)
                          }}
                          className="mr-2 p-1 hover:bg-gray-200 rounded"
                        >
                          {expandedFolders.has(folder.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <Folder className="h-5 w-5 text-gray-500 mr-3" />
                        <div className="flex-1">
                          {editingFolder === folder.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Folder name"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={newFolderDescription}
                                onChange={(e) => setNewFolderDescription(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Description (optional)"
                              />
                            </div>
                          ) : (
                            <div>
                              <span className="font-medium text-gray-900">{folder.name}</span>
                              {folder.description && (
                                <p className="text-sm text-gray-500 mt-1">{folder.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">
                          {folder.note_count || 0} notes
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {editingFolder === folder.id ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleUpdateFolder(folder.id)
                              }}
                              className="p-1 hover:bg-green-100 rounded text-green-600"
                              title="Save changes"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelEditing()
                              }}
                              className="p-1 hover:bg-gray-100 rounded text-gray-600"
                              title="Cancel editing"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(folder)
                              }}
                              className="p-1 hover:bg-blue-100 rounded text-blue-600"
                              title="Edit folder"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteFolder(folder.id)
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                              title="Delete folder"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create New Folder Form */}
              {isCreating && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Folder name"
                      autoFocus
                    />
                    <input
                      type="text"
                      value={newFolderDescription}
                      onChange={(e) => setNewFolderDescription(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      placeholder="Description (optional)"
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCreateFolder}
                        disabled={createFolderMutation.isLoading}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center transition-colors disabled:opacity-50"
                      >
                        {createFolderMutation.isLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                        ) : (
                          <Save className="h-3 w-3 mr-1" />
                        )}
                        Create
                      </button>
                      <button
                        onClick={cancelCreating}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FolderManager
