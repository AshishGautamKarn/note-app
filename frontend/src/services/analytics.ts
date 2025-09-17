import { Note, Folder } from '../types'

export interface NoteStats {
  totalNotes: number
  totalFolders: number
  totalWords: number
  totalCharacters: number
  averageWordsPerNote: number
  averageCharactersPerNote: number
  notesByFolder: { [folderId: string]: number }
  notesByTag: { [tag: string]: number }
  notesByMonth: { [month: string]: number }
  favoriteNotes: number
  archivedNotes: number
  recentActivity: {
    date: string
    notesCreated: number
    notesUpdated: number
    notesDeleted: number
  }[]
}

export interface SearchResult {
  note: Note
  score: number
  matchedFields: string[]
  highlights: {
    title: string
    content: string
  }
}

export class AnalyticsService {
  /**
   * Calculate comprehensive statistics for notes and folders
   */
  static calculateStats(notes: Note[], folders: Folder[]): NoteStats {
    const totalNotes = notes.length
    const totalFolders = folders.length
    
    // Word and character counts
    const totalWords = notes.reduce((sum, note) => {
      const content = note.content || ''
      const words = content.split(/\s+/).filter(word => word.length > 0)
      return sum + words.length
    }, 0)
    
    const totalCharacters = notes.reduce((sum, note) => {
      return sum + (note.content || '').length
    }, 0)
    
    const averageWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0
    const averageCharactersPerNote = totalNotes > 0 ? Math.round(totalCharacters / totalNotes) : 0
    
    // Notes by folder
    const notesByFolder: { [folderId: string]: number } = {}
    notes.forEach(note => {
      const folderId = note.folder_id?.toString() || 'no-folder'
      notesByFolder[folderId] = (notesByFolder[folderId] || 0) + 1
    })
    
    // Notes by tag
    const notesByTag: { [tag: string]: number } = {}
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          notesByTag[tag] = (notesByTag[tag] || 0) + 1
        })
      }
    })
    
    // Notes by month
    const notesByMonth: { [month: string]: number } = {}
    notes.forEach(note => {
      const date = new Date(note.created_at)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      notesByMonth[month] = (notesByMonth[month] || 0) + 1
    })
    
    // Favorites and archived
    const favoriteNotes = notes.filter(note => note.is_favorite).length
    const archivedNotes = notes.filter(note => note.is_archived).length
    
    // Recent activity (last 30 days)
    const recentActivity = this.calculateRecentActivity(notes)
    
    return {
      totalNotes,
      totalFolders,
      totalWords,
      totalCharacters,
      averageWordsPerNote,
      averageCharactersPerNote,
      notesByFolder,
      notesByTag,
      notesByMonth,
      favoriteNotes,
      archivedNotes,
      recentActivity
    }
  }
  
  /**
   * Calculate recent activity for the last 30 days
   */
  private static calculateRecentActivity(notes: Note[]): NoteStats['recentActivity'] {
    const activity: { [date: string]: { notesCreated: number; notesUpdated: number; notesDeleted: number } } = {}
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    notes.forEach(note => {
      const createdDate = new Date(note.created_at)
      const updatedDate = new Date(note.updated_at)
      
      if (createdDate >= thirtyDaysAgo) {
        const dateKey = createdDate.toISOString().split('T')[0]
        if (!activity[dateKey]) {
          activity[dateKey] = { notesCreated: 0, notesUpdated: 0, notesDeleted: 0 }
        }
        activity[dateKey].notesCreated++
      }
      
      if (updatedDate >= thirtyDaysAgo && updatedDate.getTime() !== createdDate.getTime()) {
        const dateKey = updatedDate.toISOString().split('T')[0]
        if (!activity[dateKey]) {
          activity[dateKey] = { notesCreated: 0, notesUpdated: 0, notesDeleted: 0 }
        }
        activity[dateKey].notesUpdated++
      }
    })
    
    return Object.entries(activity)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }
  
  /**
   * Advanced search with scoring and highlighting
   */
  static searchNotes(notes: Note[], query: string): SearchResult[] {
    if (!query.trim()) return []
    
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    const results: SearchResult[] = []
    
    notes.forEach(note => {
      let score = 0
      const matchedFields: string[] = []
      const highlights = { title: note.title || '', content: note.content || '' }
      
      // Search in title
      const titleLower = (note.title || '').toLowerCase()
      searchTerms.forEach(term => {
        if (titleLower.includes(term)) {
          score += 10 // High weight for title matches
          matchedFields.push('title')
          highlights.title = this.highlightText(highlights.title, term)
        }
      })
      
      // Search in content
      const contentLower = (note.content || '').toLowerCase()
      searchTerms.forEach(term => {
        if (contentLower.includes(term)) {
          score += 5 // Medium weight for content matches
          matchedFields.push('content')
          highlights.content = this.highlightText(highlights.content, term)
        }
      })
      
      // Search in tags
      if (note.tags) {
        note.tags.forEach(tag => {
          const tagLower = tag.toLowerCase()
          searchTerms.forEach(term => {
            if (tagLower.includes(term)) {
              score += 8 // High weight for tag matches
              matchedFields.push('tags')
            }
          })
        })
      }
      
      // Boost score for exact matches
      if (titleLower === query.toLowerCase()) {
        score += 20
      }
      
      if (score > 0) {
        results.push({
          note,
          score,
          matchedFields: [...new Set(matchedFields)],
          highlights
        })
      }
    })
    
    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score)
  }
  
  /**
   * Highlight search terms in text
   */
  private static highlightText(text: string, term: string): string {
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
  }
  
  /**
   * Get top tags by usage
   */
  static getTopTags(notes: Note[], limit: number = 10): { tag: string; count: number }[] {
    const tagCounts: { [tag: string]: number } = {}
    
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }
  
  /**
   * Get productivity insights
   */
  static getProductivityInsights(notes: Note[]): {
    mostProductiveDay: string
    averageNotesPerDay: number
    longestNote: Note | null
    shortestNote: Note | null
    mostUsedWords: { word: string; count: number }[]
  } {
    if (notes.length === 0) {
      return {
        mostProductiveDay: 'N/A',
        averageNotesPerDay: 0,
        longestNote: null,
        shortestNote: null,
        mostUsedWords: []
      }
    }
    
    // Most productive day of week
    const dayCounts: { [day: string]: number } = {}
    notes.forEach(note => {
      const day = new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const mostProductiveDay = Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
    
    // Average notes per day
    const firstNote = new Date(Math.min(...notes.map(n => new Date(n.created_at).getTime())))
    const lastNote = new Date(Math.max(...notes.map(n => new Date(n.created_at).getTime())))
    const daysDiff = Math.ceil((lastNote.getTime() - firstNote.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const averageNotesPerDay = daysDiff > 0 ? Math.round(notes.length / daysDiff * 10) / 10 : 0
    
    // Longest and shortest notes
    const sortedByLength = [...notes].sort((a, b) => (b.content || '').length - (a.content || '').length)
    const longestNote = sortedByLength[0] || null
    const shortestNote = sortedByLength[sortedByLength.length - 1] || null
    
    // Most used words
    const wordCounts: { [word: string]: number } = {}
    notes.forEach(note => {
      const words = (note.content || '').toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      })
    })
    
    const mostUsedWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))
    
    return {
      mostProductiveDay,
      averageNotesPerDay,
      longestNote,
      shortestNote,
      mostUsedWords
    }
  }
  
  /**
   * Export analytics data
   */
  static exportAnalytics(stats: NoteStats, insights: ReturnType<typeof this.getProductivityInsights>): string {
    const data = {
      generatedAt: new Date().toISOString(),
      statistics: stats,
      insights,
      summary: {
        totalNotes: stats.totalNotes,
        totalWords: stats.totalWords,
        averageWordsPerNote: stats.averageWordsPerNote,
        mostProductiveDay: insights.mostProductiveDay,
        averageNotesPerDay: insights.averageNotesPerDay
      }
    }
    
    return JSON.stringify(data, null, 2)
  }
}
