export interface ExportData {
  notes: any[]
  folders: any[]
  exportDate: string
  version: string
}

export class ExportImportService {
  static async exportToJSON(notes: any[], folders: any[]): Promise<string> {
    const exportData: ExportData = {
      notes,
      folders,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    }
    return JSON.stringify(exportData, null, 2)
  }

  static async exportToCSV(notes: any[], folders: any[]): Promise<string> {
    // Export notes as CSV
    const notesCSV = this.convertToCSV(notes, [
      'id', 'title', 'content', 'is_favorite', 'is_archived', 'folder_name', 'word_count', 'created_at'
    ])
    
    // Export folders as CSV
    const foldersCSV = this.convertToCSV(folders, [
      'id', 'name', 'notes_count', 'children_count', 'created_at'
    ])
    
    return `Notes:\n${notesCSV}\n\nFolders:\n${foldersCSV}`
  }

  static async exportToMarkdown(notes: any[], folders: any[]): Promise<string> {
    let markdown = `# Note App Export\n\n**Export Date:** ${new Date().toLocaleDateString()}\n\n`
    
    // Export folders
    if (folders.length > 0) {
      markdown += `## Folders\n\n`
      folders.forEach(folder => {
        markdown += `### ${folder.name}\n`
        markdown += `- **Notes Count:** ${folder.notes_count}\n`
        markdown += `- **Created:** ${new Date(folder.created_at).toLocaleDateString()}\n\n`
      })
    }
    
    // Export notes
    markdown += `## Notes\n\n`
    notes.forEach(note => {
      markdown += `### ${note.title}\n`
      if (note.folder_name) {
        markdown += `**Folder:** ${note.folder_name}\n`
      }
      markdown += `**Created:** ${new Date(note.created_at).toLocaleDateString()}\n`
      if (note.is_favorite) markdown += `⭐ **Favorite**\n`
      if (note.is_archived) markdown += `📁 **Archived**\n`
      markdown += `\n${note.content}\n\n---\n\n`
    })
    
    return markdown
  }

  static async importFromJSON(jsonData: string): Promise<ExportData> {
    try {
      const data = JSON.parse(jsonData)
      if (!data.notes || !data.folders) {
        throw new Error('Invalid export format')
      }
      return data
    } catch (error) {
      throw new Error('Failed to parse JSON data')
    }
  }

  static downloadFile(content: string, filename: string, mimeType: string) {
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

  private static convertToCSV(data: any[], fields: string[]): string {
    if (data.length === 0) return ''
    
    const headers = fields.join(',')
    const rows = data.map(item => 
      fields.map(field => {
        const value = item[field] || ''
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }
}