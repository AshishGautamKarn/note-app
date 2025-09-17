import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  metaKey?: boolean
  action: () => void
  description: string
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const pressedKey = event.key.toLowerCase()
    
    for (const shortcut of shortcuts) {
      const keyMatch = pressedKey === shortcut.key.toLowerCase()
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey
      const altMatch = !!shortcut.altKey === event.altKey
      const metaMatch = !!shortcut.metaKey === event.metaKey
      
      if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
        event.preventDefault()
        shortcut.action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
}

export const createNoteShortcuts = (actions: {
  newNote: () => void
  search: () => void
  toggleTheme: () => void
  toggleFavorites: () => void
  toggleArchived: () => void
  showKeyboardHelp: () => void
}) => [
  {
    key: 'n',
    ctrlKey: true,
    action: actions.newNote,
    description: 'Create new note'
  },
  {
    key: 'k',
    ctrlKey: true,
    action: actions.search,
    description: 'Focus search'
  },
  {
    key: 'd',
    ctrlKey: true,
    action: actions.toggleTheme,
    description: 'Toggle dark mode'
  },
  {
    key: 'f',
    ctrlKey: true,
    action: actions.toggleFavorites,
    description: 'Toggle favorites filter'
  },
  {
    key: 'a',
    ctrlKey: true,
    action: actions.toggleArchived,
    description: 'Toggle archived filter'
  },
  {
    key: '?',
    ctrlKey: true,
    action: actions.showKeyboardHelp,
    description: 'Show keyboard shortcuts'
  }
]