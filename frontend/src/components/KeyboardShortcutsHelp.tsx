import React from 'react'
import { X, Command, Keyboard } from 'lucide-react'

interface KeyboardShortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ 
  isOpen, 
  onClose, 
  shortcuts 
}) => {
  if (!isOpen) return null

  const getKeyDisplay = (shortcut: KeyboardShortcut) => {
    const keys = []
    
    if (shortcut.ctrlKey) {
      keys.push('Ctrl')
    }
    if (shortcut.metaKey) {
      keys.push('Cmd')
    }
    if (shortcut.shiftKey) {
      keys.push('Shift')
    }
    if (shortcut.altKey) {
      keys.push('Alt')
    }
    
    keys.push(shortcut.key)
    
    return keys.join(' + ')
  }

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Keyboard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* General Shortcuts */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                General
              </h3>
              <div className="space-y-3">
                {shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center space-x-1">
                      {getKeyDisplay(shortcut).split(' + ').map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 dark:text-gray-500 mx-1">+</span>
                          )}
                          <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm rounded border border-gray-300 dark:border-gray-500 font-mono">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                💡 Tips
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Shortcuts work when you're not typing in input fields</li>
                <li>• Use {isMac ? 'Cmd' : 'Ctrl'} + K to quickly focus the search</li>
                <li>• Press {isMac ? 'Cmd' : 'Ctrl'} + D to toggle between light and dark themes</li>
                <li>• All shortcuts are also available in the main interface</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-xs">Esc</kbd> to close
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsHelp
