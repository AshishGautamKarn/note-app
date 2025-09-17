import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Home, 
  Search, 
  Folder, 
  Plus, 
  Settings, 
  Mic,
  Star,
  Archive,
  X
} from 'lucide-react'
import { useQuery } from 'react-query'
import { api } from '../services/api'

interface SidebarProps {
  onClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const location = useLocation()

  const { data: folders } = useQuery('folders', api.getFolders)
  const { data: notes } = useQuery('notes', () => api.getNotes({ limit: 10 }))

  const navigation = [
    { name: 'All Notes', href: '/', icon: Home, count: notes?.length || 0 },
    { name: 'Favorites', href: '/?favorites=true', icon: Star, count: notes?.filter(n => n.is_favorite).length || 0 },
    { name: 'Archived', href: '/?archived=true', icon: Archive, count: notes?.filter(n => n.is_archived).length || 0 },
    { name: 'Search', href: '/search', icon: Search },
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white shadow-lg">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold gradient-text">Note App</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <Link
          to="/note/new"
          className="btn btn-primary btn-md w-full mb-3"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Note
        </Link>
        <Link
          to="/transcribe"
          className="btn btn-secondary btn-md w-full"
        >
          <Mic className="h-4 w-4 mr-2" />
          Voice Note
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <item.icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.name}
              {item.count !== undefined && (
                <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {item.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Folders Section */}
        <div className="mt-8">
          <div className="flex items-center px-3 py-2">
            <Folder className="h-5 w-5 mr-2 text-gray-400" />
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Folders
            </h3>
          </div>
          <div className="mt-2 space-y-1">
            {folders?.slice(0, 5).map((folder) => (
              <Link
                key={folder.id}
                to={`/folder/${folder.id}`}
                onClick={onClose}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  location.pathname === `/folder/${folder.id}`
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Folder className="h-4 w-4 mr-3 flex-shrink-0" />
                <span className="truncate">{folder.name}</span>
                <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                  {folder.notes_count}
                </span>
              </Link>
            ))}
            {folders && folders.length > 5 && (
              <Link
                to="/folders"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <span className="ml-6">View all folders...</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <Link
          to="/settings"
          className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
        >
          <Settings className="h-5 w-5 mr-3" />
          Settings
        </Link>
      </div>
    </div>
  )
}

export default Sidebar
