import React, { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Code, 
  Link, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Type
} from 'lucide-react'
import { RichTextEditorService, RichTextFormat } from '../services/richTextEditor'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Start writing...",
  className = ""
}) => {
  const [isRichMode, setIsRichMode] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || ''
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML
      onChange(content)
    }
  }

  const handleSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      setSelectedText(selection.toString())
    } else {
      setSelectedText('')
    }
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    handleInput()
  }

  const toggleFormat = (format: keyof RichTextFormat) => {
    switch (format) {
      case 'bold':
        execCommand('bold')
        break
      case 'italic':
        execCommand('italic')
        break
      case 'underline':
        execCommand('underline')
        break
      case 'strikethrough':
        execCommand('strikeThrough')
        break
      case 'code':
        execCommand('formatBlock', 'code')
        break
      case 'heading':
        execCommand('formatBlock', 'h2')
        break
      case 'listType':
        execCommand('insertUnorderedList')
        break
    }
  }

  const insertLink = () => {
    if (selectedText && linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`
      execCommand('insertHTML', linkHtml)
      setShowLinkDialog(false)
      setLinkUrl('')
      setSelectedText('')
    }
  }

  const insertHeading = (level: number) => {
    execCommand('formatBlock', `h${level}`)
  }

  const insertList = (ordered: boolean = false) => {
    if (ordered) {
      execCommand('insertOrderedList')
    } else {
      execCommand('insertUnorderedList')
    }
  }

  const clearFormatting = () => {
    execCommand('removeFormat')
  }

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
        <button
          onClick={() => toggleFormat('bold')}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleFormat('italic')}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleFormat('underline')}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Underline"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggleFormat('strikethrough')}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <button
          onClick={() => insertHeading(1)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertHeading(2)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertHeading(3)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <button
          onClick={() => insertList(false)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertList(true)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <button
          onClick={() => toggleFormat('code')}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Code"
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowLinkDialog(true)}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        
        <div className="flex-1" />
        
        <button
          onClick={clearFormatting}
          className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Clear Formatting"
        >
          <Type className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onSelect={handleSelection}
        className="min-h-[200px] p-4 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        style={{ whiteSpace: 'pre-wrap' }}
        data-placeholder={placeholder}
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Insert Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  value={selectedText}
                  onChange={(e) => setSelectedText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Link text"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="https://example.com"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowLinkDialog(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={insertLink}
                  disabled={!selectedText || !linkUrl}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Insert Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RichTextEditor