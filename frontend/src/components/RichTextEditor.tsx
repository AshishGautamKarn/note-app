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
  CheckSquare, 
  Quote, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  Palette, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Minus,
  Table,
  MoreHorizontal
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
  placeholder = 'Start typing...',
  className = ''
}) => {
  const [isFocused, setIsFocused] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [currentFormat, setCurrentFormat] = useState<RichTextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    link: null,
    color: null,
    backgroundColor: null,
    fontSize: null,
    fontFamily: null,
    alignment: 'left',
    listType: 'none',
    indent: 0,
    quote: false
  })
  
  const editorRef = useRef<HTMLDivElement>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)
  const fontPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
      if (fontPickerRef.current && !fontPickerRef.current.contains(event.target as Node)) {
        setShowFontPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML
      onChange(html)
    }
  }

  const handleSelectionChange = () => {
    const format = RichTextEditorService.getCurrentFormat()
    setCurrentFormat(format)
  }

  const applyFormat = (format: Partial<RichTextFormat>) => {
    RichTextEditorService.applyFormat(format)
    setCurrentFormat(prev => ({ ...prev, ...format }))
    handleInput()
  }

  const applyLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      RichTextEditorService.applyLink(url)
      handleInput()
    }
  }

  const applyList = (listType: 'bullet' | 'number' | 'check') => {
    RichTextEditorService.applyList(listType)
    setCurrentFormat(prev => ({ ...prev, listType }))
    handleInput()
  }

  const applyQuote = () => {
    RichTextEditorService.applyQuote()
    setCurrentFormat(prev => ({ ...prev, quote: !prev.quote }))
    handleInput()
  }

  const applyCodeBlock = () => {
    RichTextEditorService.applyCodeBlock()
    handleInput()
  }

  const applyHeading = (level: 1 | 2 | 3) => {
    RichTextEditorService.applyHeading(level)
    handleInput()
  }

  const insertHorizontalRule = () => {
    RichTextEditorService.insertHorizontalRule()
    handleInput()
  }

  const insertTable = () => {
    const rows = prompt('Number of rows:', '3')
    const cols = prompt('Number of columns:', '3')
    if (rows && cols) {
      RichTextEditorService.insertTable(parseInt(rows), parseInt(cols))
      handleInput()
    }
  }

  const clearFormatting = () => {
    RichTextEditorService.clearFormatting()
    setCurrentFormat({
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      code: false,
      link: null,
      color: null,
      backgroundColor: null,
      fontSize: null,
      fontFamily: null,
      alignment: 'left',
      listType: 'none',
      indent: 0,
      quote: false
    })
    handleInput()
  }

  const ToolbarButton: React.FC<{
    onClick: () => void
    isActive?: boolean
    icon: React.ReactNode
    title: string
  }> = ({ onClick, isActive = false, icon, title }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
      }`}
      title={title}
    >
      {icon}
    </button>
  )

  const ColorPicker: React.FC<{ onColorSelect: (color: string) => void }> = ({ onColorSelect }) => {
    const colors = RichTextEditorService.getAvailableColors()
    
    return (
      <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
        <div className="grid grid-cols-6 gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    )
  }

  const FontPicker: React.FC<{ onFontSelect: (font: string) => void }> = ({ onFontSelect }) => {
    const fonts = RichTextEditorService.getAvailableFonts()
    
    return (
      <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
        <div className="space-y-1">
          {fonts.map((font) => (
            <button
              key={font}
              onClick={() => onFontSelect(font)}
              className="w-full text-left px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
              style={{ fontFamily: font }}
            >
              {font}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => applyFormat({ bold: !currentFormat.bold })}
              isActive={currentFormat.bold}
              icon={<Bold className="h-4 w-4" />}
              title="Bold"
            />
            <ToolbarButton
              onClick={() => applyFormat({ italic: !currentFormat.italic })}
              isActive={currentFormat.italic}
              icon={<Italic className="h-4 w-4" />}
              title="Italic"
            />
            <ToolbarButton
              onClick={() => applyFormat({ underline: !currentFormat.underline })}
              isActive={currentFormat.underline}
              icon={<Underline className="h-4 w-4" />}
              title="Underline"
            />
            <ToolbarButton
              onClick={() => applyFormat({ strikethrough: !currentFormat.strikethrough })}
              isActive={currentFormat.strikethrough}
              icon={<Strikethrough className="h-4 w-4" />}
              title="Strikethrough"
            />
            <ToolbarButton
              onClick={() => applyFormat({ code: !currentFormat.code })}
              isActive={currentFormat.code}
              icon={<Code className="h-4 w-4" />}
              title="Code"
            />
          </div>

          {/* Headings */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => applyHeading(1)}
              icon={<Heading1 className="h-4 w-4" />}
              title="Heading 1"
            />
            <ToolbarButton
              onClick={() => applyHeading(2)}
              icon={<Heading2 className="h-4 w-4" />}
              title="Heading 2"
            />
            <ToolbarButton
              onClick={() => applyHeading(3)}
              icon={<Heading3 className="h-4 w-4" />}
              title="Heading 3"
            />
          </div>

          {/* Lists */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => applyList('bullet')}
              isActive={currentFormat.listType === 'bullet'}
              icon={<List className="h-4 w-4" />}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => applyList('number')}
              isActive={currentFormat.listType === 'number'}
              icon={<ListOrdered className="h-4 w-4" />}
              title="Numbered List"
            />
            <ToolbarButton
              onClick={() => applyList('check')}
              isActive={currentFormat.listType === 'check'}
              icon={<CheckSquare className="h-4 w-4" />}
              title="Checklist"
            />
          </div>

          {/* Alignment */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={() => applyFormat({ alignment: 'left' })}
              isActive={currentFormat.alignment === 'left'}
              icon={<AlignLeft className="h-4 w-4" />}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => applyFormat({ alignment: 'center' })}
              isActive={currentFormat.alignment === 'center'}
              icon={<AlignCenter className="h-4 w-4" />}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => applyFormat({ alignment: 'right' })}
              isActive={currentFormat.alignment === 'right'}
              icon={<AlignRight className="h-4 w-4" />}
              title="Align Right"
            />
            <ToolbarButton
              onClick={() => applyFormat({ alignment: 'justify' })}
              isActive={currentFormat.alignment === 'justify'}
              icon={<AlignJustify className="h-4 w-4" />}
              title="Justify"
            />
          </div>

          {/* Special Elements */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={applyQuote}
              isActive={currentFormat.quote}
              icon={<Quote className="h-4 w-4" />}
              title="Quote"
            />
            <ToolbarButton
              onClick={applyCodeBlock}
              icon={<Code className="h-4 w-4" />}
              title="Code Block"
            />
            <ToolbarButton
              onClick={insertHorizontalRule}
              icon={<Minus className="h-4 w-4" />}
              title="Horizontal Rule"
            />
            <ToolbarButton
              onClick={insertTable}
              icon={<Table className="h-4 w-4" />}
              title="Insert Table"
            />
          </div>

          {/* Links and Colors */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-700 pr-2 mr-2">
            <ToolbarButton
              onClick={applyLink}
              icon={<Link className="h-4 w-4" />}
              title="Insert Link"
            />
            
            <div className="relative" ref={colorPickerRef}>
              <ToolbarButton
                onClick={() => setShowColorPicker(!showColorPicker)}
                icon={<Palette className="h-4 w-4" />}
                title="Text Color"
              />
              {showColorPicker && (
                <ColorPicker onColorSelect={(color) => applyFormat({ color })} />
              )}
            </div>
          </div>

          {/* Font Selection */}
          <div className="relative" ref={fontPickerRef}>
            <ToolbarButton
              onClick={() => setShowFontPicker(!showFontPicker)}
              icon={<Type className="h-4 w-4" />}
              title="Font Family"
            />
            {showFontPicker && (
              <FontPicker onFontSelect={(font) => applyFormat({ fontFamily: font })} />
            )}
          </div>

          {/* Clear Formatting */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={clearFormatting}
              icon={<MoreHorizontal className="h-4 w-4" />}
              title="Clear Formatting"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onSelect={handleSelectionChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`min-h-[200px] p-4 focus:outline-none ${
          isFocused ? 'ring-2 ring-blue-500' : ''
        }`}
        style={{ minHeight: '200px' }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

export default RichTextEditor
