import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Menu, 
  Search, 
  Bell, 
  User, 
  Plus,
  Mic,
  MoreVertical
} from 'lucide-react'
import SearchBar from './SearchBar'

interface HeaderProps {
  onMenuClick: () => void
  onMobileMenuClick: () => void
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, onMobileMenuClick }) => {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-lg mx-4">
          <SearchBar />
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Quick Actions */}
          <div className="hidden sm:flex items-center space-x-2">
            <Link
              to="/note/new"
              className="btn btn-primary btn-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              New Note
            </Link>
            <Link
              to="/transcribe"
              className="btn btn-secondary btn-sm"
            >
              <Mic className="h-4 w-4 mr-1" />
              Voice
            </Link>
          </div>

          {/* Notifications */}
          <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors">
              <User className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={onMobileMenuClick}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
