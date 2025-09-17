import React, { useState } from 'react'
import { Menu, X, Home, Folder, Star, Archive, Settings, Plus } from 'lucide-react'

interface MobileNavigationProps {
  onNavigate: (page: string) => void
  currentPage: string
  onNewNote: () => void
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ onNavigate, currentPage, onNewNote }) => {
  const [isOpen, setIsOpen] = useState(false)

  const navigationItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'folders', label: 'Folders', icon: Folder },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const handleNavigate = (page: string) => {
    onNavigate(page)
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between h-16 px-4">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Note App</h1>
          
          <button
            onClick={onNewNote}
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Items */}
              <nav className="flex-1 px-4 py-6">
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavigate(item.id)}
                        className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                          currentPage === item.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    onNewNote()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Note
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MobileNavigation