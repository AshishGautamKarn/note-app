import { Note, Folder } from '../types'

export interface ExportData {
  notes: Note[]
  folders: Folder[]
  exportDate: string
  version: string
  appName: string
}

export interface ImportResult {
  success: boolean
  importedNotes: number
  importedFolders: number
  errors: string[]
}

export class ExportImportService {
  private static readonly EXPORT_VERSION = '1.0.0'
  private static readonly APP_NAME = 'Note App'

  /**
   * Export all data to JSON format
   */
  static async exportData(notes: Note[], folders: Folder[]): Promise<string> {
    const exportData: ExportData = {
      notes,
      folders,
      exportDate: new Date().toISOString(),
      version: this.EXPORT_VERSION,
      appName: this.APP_NAME
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Export data to CSV format
   */
  static async exportToCSV(notes: Note[], folders: Folder[]): Promise<string> {
    const csvRows: string[] = []
    
    // Add header
    csvRows.push('Type,ID,Title,Content,Folder,Tags,Favorite,Archived,Created,Modified')
    
    // Add folders
    folders.forEach(folder => {
      csvRows.push(`Folder,${folder.id},"${folder.name}","",,"",false,false,"${folder.created_at}","${folder.updated_at}"`)
    })
    
    // Add notes
    notes.forEach(note => {
      const folderName = folders.find(f => f.id === note.folder_id)?.name || ''
      const tags = note.tags?.join(';') || ''
      const content = (note.content || '').replace(/"/g, '""') // Escape quotes
      
      csvRows.push(`Note,${note.id},"${note.title || ''}","${content}","${folderName}","${tags}",${note.is_favorite || false},${note.is_archived || false},"${note.created_at}","${note.updated_at}"`)
    })
    
    return csvRows.join('\n')
  }

  /**
   * Export data to Markdown format
   */
  static async exportToMarkdown(notes: Note[], folders: Folder[]): Promise<string> {
    const markdownRows: string[] = []
    
    markdownRows.push('# Note App Export')
    markdownRows.push(`**Export Date:** ${new Date().toLocaleString()}`)
    markdownRows.push(`**Total Notes:** ${notes.length}`)
    markdownRows.push(`**Total Folders:** ${folders.length}`)
    markdownRows.push('')
    
    // Add folders
    if (folders.length > 0) {
      markdownRows.push('## Folders')
      folders.forEach(folder => {
        markdownRows.push(`- **${folder.name}** (ID: ${folder.id})`)
      })
      markdownRows.push('')
    }
    
    // Add notes
    if (notes.length > 0) {
      markdownRows.push('## Notes')
      notes.forEach((note, index) => {
        const folderName = folders.find(f => f.id === note.folder_id)?.name || 'No Folder'
        const tags = note.tags?.length ? `\n**Tags:** ${note.tags.join(', ')}` : ''
        const favorite = note.is_favorite ? ' ⭐' : ''
        const archived = note.is_archived ? ' 📁' : ''
        
        markdownRows.push(`### ${index + 1}. ${note.title || 'Untitled Note'}${favorite}${archived}`)
        markdownRows.push(`**Folder:** ${folderName}`)
        markdownRows.push(`**Created:** ${new Date(note.created_at).toLocaleString()}`)
        if (tags) markdownRows.push(tags)
        markdownRows.push('')
        markdownRows.push(note.content || '*No content*')
        markdownRows.push('')
        markdownRows.push('---')
        markdownRows.push('')
      })
    }
    
    return markdownRows.join('\n')
  }

  /**
   * Import data from JSON format
   */
  static async importFromJSON(jsonData: string): Promise<ImportResult> {
    try {
      const data: ExportData = JSON.parse(jsonData)
      
      // Validate data structure
      if (!data.notes || !data.folders || !Array.isArray(data.notes) || !Array.isArray(data.folders)) {
        return {
          success: false,
          importedNotes: 0,
          importedFolders: 0,
          errors: ['Invalid data format. Expected notes and folders arrays.']
        }
      }

      // Validate version compatibility
      if (data.version && data.version !== this.EXPORT_VERSION) {
        console.warn(`Version mismatch: Export version ${data.version}, Current version ${this.EXPORT_VERSION}`)
      }

      return {
        success: true,
        importedNotes: data.notes.length,
        importedFolders: data.folders.length,
        errors: []
      }
    } catch (error) {
      return {
        success: false,
        importedNotes: 0,
        importedFolders: 0,
        errors: [`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }
  }

  /**
   * Download data as file
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  /**
   * Read file content
   */
  static readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string)
        } else {
          reject(new Error('Failed to read file'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Validate file type
   */
  static validateFileType(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.includes(file.type) || 
           allowedTypes.some(type => file.name.toLowerCase().endsWith(type.replace('*', '')))
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
