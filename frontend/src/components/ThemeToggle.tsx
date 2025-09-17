import React from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, toggleTheme } = useTheme()

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-4 w-4" />
    }
    return actualTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />
  }

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Switch to dark mode'
      case 'dark':
        return 'Switch to system theme'
      case 'system':
        return 'Switch to light mode'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
      title={getTooltip()}
    >
      {getIcon()}
    </button>
  )
}

export default ThemeToggle
