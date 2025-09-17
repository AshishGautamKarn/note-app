import React, { useState, useRef } from 'react'
import { Download, Upload, FileText, FileSpreadsheet, FileCode, X, AlertCircle, CheckCircle } from 'lucide-react'
import { ExportImportService, ExportData, ImportResult } from '../services/exportImport'
import { Note, Folder } from '../types'

interface ExportImportProps {
  isOpen: boolean
  onClose: () => void
  notes: Note[]
  folders: Folder[]
  onImport: (notes: Note[], folders: Folder[]) => void
}

const ExportImport: React.FC<ExportImportProps> = ({ 
  isOpen, 
  onClose, 
  notes, 
  folders, 
  onImport 
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'markdown'>('json')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    try {
      let content: string
      let filename: string
      let mimeType: string

      switch (exportFormat) {
        case 'json':
          content = await ExportImportService.exportData(notes, folders)
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
          throw new Error('Invalid export format')
      }

      ExportImportService.downloadFile(content, filename, mimeType)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/json', 'text/json', '.json']
    if (!ExportImportService.validateFileType(file, allowedTypes)) {
      alert('Please select a valid JSON file.')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large. Please select a file smaller than 10MB.')
      return
    }

    setIsImporting(true)
    setImportResult(null)

    try {
      const content = await ExportImportService.readFile(file)
      const result = await ExportImportService.importFromJSON(content)
      
      setImportResult(result)
      
      if (result.success) {
        // Parse the data and call onImport
        const data: ExportData = JSON.parse(content)
        onImport(data.notes, data.folders)
      }
    } catch (error) {
      setImportResult({
        success: false,
        importedNotes: 0,
        importedFolders: 0,
        errors: [`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`]
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const resetImport = () => {
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Export & Import
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'export'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Export Data
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'import'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            Import Data
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'export' ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Export Your Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Export your notes and folders to a file for backup or sharing.
                </p>
              </div>

              {/* Export Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Export Format
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'json', label: 'JSON', description: 'Complete data with metadata', icon: FileCode },
                    { value: 'csv', label: 'CSV', description: 'Spreadsheet format', icon: FileSpreadsheet },
                    { value: 'markdown', label: 'Markdown', description: 'Human-readable format', icon: FileText }
                  ].map(({ value, label, description, icon: Icon }) => (
                    <label
                      key={value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        exportFormat === value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportFormat"
                        value={value}
                        checked={exportFormat === value}
                        onChange={(e) => setExportFormat(e.target.value as any)}
                        className="sr-only"
                      />
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Summary */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>• {notes.length} notes</div>
                  <div>• {folders.length} folders</div>
                  <div>• Format: {exportFormat.toUpperCase()}</div>
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Import Notes
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Import notes and folders from a previously exported JSON file.
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Choose a JSON file to import
                  </p>
                  <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isImporting ? 'Processing...' : 'Choose File'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${
                  importResult.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                }`}>
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-3 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-medium ${
                        importResult.success 
                          ? 'text-green-900 dark:text-green-100'
                          : 'text-red-900 dark:text-red-100'
                      }`}>
                        {importResult.success ? 'Import Successful' : 'Import Failed'}
                      </h4>
                      <div className={`text-sm mt-1 ${
                        importResult.success 
                          ? 'text-green-700 dark:text-green-300'
                          : 'text-red-700 dark:text-red-300'
                      }`}>
                        {importResult.success ? (
                          <div>
                            <div>• {importResult.importedNotes} notes imported</div>
                            <div>• {importResult.importedFolders} folders imported</div>
                          </div>
                        ) : (
                          <div>
                            <div>Errors:</div>
                            <ul className="list-disc list-inside mt-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Import Button */}
              <div className="flex space-x-3">
                <button
                  onClick={handleImportClick}
                  disabled={isImporting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isImporting ? 'Processing...' : 'Import Data'}
                </button>
                {importResult && (
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeTab === 'export' 
              ? 'Export includes all notes, folders, and metadata'
              : 'Only JSON format files are supported for import'
            }
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportImport
