import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  action: () => void
  description: string
}

interface UseKeyboardShortcutsProps {
  shortcuts: KeyboardShortcut[]
  enabled?: boolean
}

export const useKeyboardShortcuts = ({ 
  shortcuts, 
  enabled = true 
}: UseKeyboardShortcutsProps) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true' ||
      target.closest('[contenteditable="true"]')
    ) {
      return
    }

    shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, altKey, action }) => {
      const isCtrlPressed = ctrlKey ? event.ctrlKey : !event.ctrlKey
      const isMetaPressed = metaKey ? event.metaKey : !event.metaKey
      const isShiftPressed = shiftKey ? event.shiftKey : !event.shiftKey
      const isAltPressed = altKey ? event.altKey : !event.altKey

      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        isCtrlPressed &&
        isMetaPressed &&
        isShiftPressed &&
        isAltPressed
      ) {
        event.preventDefault()
        action()
      }
    })
  }, [shortcuts, enabled])

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown, enabled])
}

// Common keyboard shortcuts for the note app
export const createNoteShortcuts = (actions: {
  newNote: () => void
  search: () => void
  toggleTheme: () => void
  saveNote?: () => void
  deleteNote?: () => void
  toggleFavorites?: () => void
  toggleArchived?: () => void
}) => {
  return [
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
    ...(actions.saveNote ? [{
      key: 's',
      ctrlKey: true,
      action: actions.saveNote,
      description: 'Save note'
    }] : []),
    ...(actions.deleteNote ? [{
      key: 'Delete',
      ctrlKey: true,
      action: actions.deleteNote,
      description: 'Delete note'
    }] : []),
    ...(actions.toggleFavorites ? [{
      key: 'f',
      ctrlKey: true,
      action: actions.toggleFavorites,
      description: 'Toggle favorites filter'
    }] : []),
    ...(actions.toggleArchived ? [{
      key: 'a',
      ctrlKey: true,
      action: actions.toggleArchived,
      description: 'Toggle archived filter'
    }] : [])
  ] as KeyboardShortcut[]
}
