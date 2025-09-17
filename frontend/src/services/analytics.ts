export interface AnalyticsData {
  totalNotes: number
  totalFolders: number
  totalWords: number
  averageWordsPerNote: number
  notesByMonth: { month: string; count: number }[]
  wordsByMonth: { month: string; words: number }[]
  topFolders: { name: string; count: number }[]
  recentActivity: { date: string; action: string; note: string }[]
  productivityStats: {
    notesThisWeek: number
    notesThisMonth: number
    averageNotesPerDay: number
    mostProductiveDay: string
  }
  contentInsights: {
    longestNote: { title: string; wordCount: number }
    shortestNote: { title: string; wordCount: number }
    mostUsedWords: { word: string; count: number }[]
    averageNoteLength: number
  }
}

export class AnalyticsService {
  static calculateAnalytics(notes: any[], folders: any[]): AnalyticsData {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    // Basic counts
    const totalNotes = notes.length
    const totalFolders = folders.length
    const totalWords = notes.reduce((sum, note) => sum + (note.word_count || 0), 0)
    const averageWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0

    // Notes by month (last 12 months)
    const notesByMonth = this.getNotesByMonth(notes, 12)
    const wordsByMonth = this.getWordsByMonth(notes, 12)

    // Top folders
    const topFolders = this.getTopFolders(notes, folders)

    // Recent activity (last 30 days)
    const recentActivity = this.getRecentActivity(notes)

    // Productivity stats
    const productivityStats = this.getProductivityStats(notes)

    // Content insights
    const contentInsights = this.getContentInsights(notes)

    return {
      totalNotes,
      totalFolders,
      totalWords,
      averageWordsPerNote,
      notesByMonth,
      wordsByMonth,
      topFolders,
      recentActivity,
      productivityStats,
      contentInsights
    }
  }

  private static getNotesByMonth(notes: any[], months: number): { month: string; count: number }[] {
    const data: { [key: string]: number } = {}
    const now = new Date()
    
    // Initialize last 12 months with 0
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      data[key] = 0
    }

    // Count notes by month
    notes.forEach(note => {
      const date = new Date(note.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (data.hasOwnProperty(key)) {
        data[key]++
      }
    })

    return Object.entries(data)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private static getWordsByMonth(notes: any[], months: number): { month: string; words: number }[] {
    const data: { [key: string]: number } = {}
    const now = new Date()
    
    // Initialize last 12 months with 0
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      data[key] = 0
    }

    // Sum words by month
    notes.forEach(note => {
      const date = new Date(note.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (data.hasOwnProperty(key)) {
        data[key] += note.word_count || 0
      }
    })

    return Object.entries(data)
      .map(([month, words]) => ({ month, words }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private static getTopFolders(notes: any[], folders: any[]): { name: string; count: number }[] {
    const folderCounts: { [key: string]: number } = {}
    
    // Count notes per folder
    notes.forEach(note => {
      if (note.folder_name) {
        folderCounts[note.folder_name] = (folderCounts[note.folder_name] || 0) + 1
      }
    })

    return Object.entries(folderCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private static getRecentActivity(notes: any[]): { date: string; action: string; note: string }[] {
    const activities: { date: string; action: string; note: string }[] = []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    notes
      .filter(note => new Date(note.created_at) >= thirtyDaysAgo)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .forEach(note => {
        activities.push({
          date: new Date(note.created_at).toLocaleDateString(),
          action: 'Created',
          note: note.title
        })
      })

    return activities
  }

  private static getProductivityStats(notes: any[]): any {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const notesThisWeek = notes.filter(note => new Date(note.created_at) >= weekAgo).length
    const notesThisMonth = notes.filter(note => new Date(note.created_at) >= monthAgo).length
    const averageNotesPerDay = notesThisMonth > 0 ? Math.round(notesThisMonth / 30) : 0

    // Find most productive day of the week
    const dayCounts: { [key: string]: number } = {}
    notes.forEach(note => {
      const day = new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })

    const mostProductiveDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday'

    return {
      notesThisWeek,
      notesThisMonth,
      averageNotesPerDay,
      mostProductiveDay
    }
  }

  private static getContentInsights(notes: any[]): any {
    if (notes.length === 0) {
      return {
        longestNote: { title: 'No notes', wordCount: 0 },
        shortestNote: { title: 'No notes', wordCount: 0 },
        mostUsedWords: [],
        averageNoteLength: 0
      }
    }

    // Find longest and shortest notes
    const sortedByLength = [...notes].sort((a, b) => (b.word_count || 0) - (a.word_count || 0))
    const longestNote = {
      title: sortedByLength[0].title,
      wordCount: sortedByLength[0].word_count || 0
    }
    const shortestNote = {
      title: sortedByLength[sortedByLength.length - 1].title,
      wordCount: sortedByLength[sortedByLength.length - 1].word_count || 0
    }

    // Most used words (simple implementation)
    const wordCounts: { [key: string]: number } = {}
    notes.forEach(note => {
      const words = (note.content || '').toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      })
    })

    const mostUsedWords = Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))

    const averageNoteLength = Math.round(
      notes.reduce((sum, note) => sum + (note.word_count || 0), 0) / notes.length
    )

    return {
      longestNote,
      shortestNote,
      mostUsedWords,
      averageNoteLength
    }
  }
}