import React, { useState, useRef, useEffect } from 'react'
import { X, Plus, Tag } from 'lucide-react'

interface TagsInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
}

const TagsInput: React.FC<TagsInputProps> = ({ 
  tags, 
  onChange, 
  placeholder = "Add tags...", 
  maxTags = 10,
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase()
    
    if (trimmedTag && 
        !tags.includes(trimmedTag) && 
        tags.length < maxTags &&
        trimmedTag.length <= 20) {
      onChange([...tags, trimmedTag])
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Prevent adding commas in the input
    if (!value.includes(',')) {
      setInputValue(value)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  // Focus input when component mounts
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  return (
    <div className={`relative ${className}`}>
      <div
        className={`min-h-[40px] w-full border rounded-lg px-3 py-2 cursor-text transition-colors ${
          isFocused 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Existing Tags */}
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
            >
              <Tag className="h-3 w-3" />
              {tag}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          
          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={tags.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] border-none outline-none bg-transparent text-sm"
            disabled={tags.length >= maxTags}
          />
        </div>
      </div>
      
      {/* Helper Text */}
      <div className="mt-1 text-xs text-gray-500">
        {tags.length >= maxTags ? (
          <span className="text-red-500">Maximum {maxTags} tags allowed</span>
        ) : (
          <span>Press Enter or comma to add tags • {tags.length}/{maxTags}</span>
        )}
      </div>
    </div>
  )
}

export default TagsInput
