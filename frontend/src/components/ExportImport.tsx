import React, { useState, useRef } from 'react'
import { Download, Upload, FileText, FileSpreadsheet, FileCode, X } from 'lucide-react'
import { ExportImportService, ExportData } from '../services/exportImport'

interface ExportImportProps {
  notes: any[]
  folders: any[]
  onImport: (data: ExportData) => void
  onClose: () => void
}

const ExportImport: React.FC<ExportImportProps> = ({ notes, folders, onImport, onClose }) => {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async (format: 'json' | 'csv' | 'markdown') => {
    setIsExporting(true)
    try {
      let content: string
      let filename: string
      let mimeType: string

      switch (format) {
        case 'json':
          content = await ExportImportService.exportToJSON(notes, folders)
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.json`
          mimeType = 'application/json'
          break
        case 'csv':
          content = await ExportImportService.exportToCSV(notes, folders)
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.csv`
          mimeType = 'text/csv'
          break
        case 'markdown':
          content = await ExportImportService.exportToMarkdown(notes, folders)
          filename = `notes-export-${new Date().toISOString().split('T')[0]}.md`
          mimeType = 'text/markdown'
          break
        default:
          throw new Error('Unsupported format')
      }

      ExportImportService.downloadFile(content, filename, mimeType)
    } catch (error) {
      console.error('Export failed:', error)
      setImportError('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportError(null)

    try {
      const content = await file.text()
      const data = await ExportImportService.importFromJSON(content)
      onImport(data)
      onClose()
    } catch (error) {
      console.error('Import failed:', error)
      setImportError('Invalid file format. Please select a valid JSON export file.')
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Export/Import</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Export Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Export Data</h3>
            <div className="space-y-2">
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('markdown')}
                disabled={isExporting}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as Markdown
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Import Data</h3>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isImporting ? 'Importing...' : 'Import from JSON'}
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Select a JSON file exported from this app
            </p>
          </div>

          {/* Error Message */}
          {importError && (
            <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md text-sm">
              {importError}
            </div>
          )}

          {/* Stats */}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Notes: {notes.length}</p>
            <p>Folders: {folders.length}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportImport