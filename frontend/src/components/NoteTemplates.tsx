import React, { useState } from 'react'
import { X, Search, Plus, Edit3, Trash2, Star, Filter } from 'lucide-react'
import { NoteTemplatesService, NoteTemplate } from '../services/noteTemplates'

interface NoteTemplatesProps {
  isOpen: boolean
  onClose: () => void
  onSelectTemplate: (template: NoteTemplate) => void
}

const NoteTemplates: React.FC<NoteTemplatesProps> = ({ 
  isOpen, 
  onClose, 
  onSelectTemplate 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [showCustomOnly, setShowCustomOnly] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<NoteTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  if (!isOpen) return null

  const templates = NoteTemplatesService.getTemplates()
  const categories = ['All', ...NoteTemplatesService.getCategories()]
  
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    const matchesCustom = !showCustomOnly || !template.isBuiltIn
    
    return matchesSearch && matchesCategory && matchesCustom
  })

  const handleSelectTemplate = (template: NoteTemplate) => {
    onSelectTemplate(template)
    onClose()
  }

  const handleDeleteTemplate = (template: NoteTemplate) => {
    if (template.isBuiltIn) return
    
    if (window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      NoteTemplatesService.deleteCustomTemplate(template.id)
      // Force re-render by updating state
      setSearchQuery(searchQuery)
    }
  }

  const handleEditTemplate = (template: NoteTemplate) => {
    setEditingTemplate(template)
  }

  const handleCreateTemplate = () => {
    setIsCreating(true)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Star className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Note Templates
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Custom Only Toggle */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showCustomOnly}
                onChange={(e) => setShowCustomOnly(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Custom Only</span>
            </label>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search terms' : 'No templates match your filters'}
              </p>
              <button
                onClick={handleCreateTemplate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center mx-auto transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{template.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {template.category}
                        </p>
                      </div>
                    </div>
                    {!template.isBuiltIn && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditTemplate(template)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-blue-600 dark:text-blue-400"
                          title="Edit template"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTemplate(template)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-600 dark:text-red-400"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        +{template.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {template.isBuiltIn ? 'Built-in' : 'Custom'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectTemplate(template)
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Create Template
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NoteTemplates
