import { Note, Folder } from '../types'

export interface SearchFilter {
  query: string
  folders: number[]
  tags: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  favorites: boolean | null
  archived: boolean | null
  sortBy: 'relevance' | 'date' | 'title' | 'updated'
  sortOrder: 'asc' | 'desc'
  contentTypes: ('text' | 'audio' | 'image')[]
}

export interface SearchResult {
  note: Note
  score: number
  matchedFields: string[]
  highlights: {
    title: string
    content: string
  }
  snippets: string[]
}

export interface SearchSuggestion {
  text: string
  type: 'query' | 'tag' | 'folder' | 'recent'
  count?: number
}

export class AdvancedSearchService {
  private static readonly SEARCH_HISTORY_KEY = 'note-app-search-history'
  private static readonly MAX_HISTORY = 20

  /**
   * Perform advanced search with filters
   */
  static search(
    notes: Note[],
    filter: SearchFilter,
    folders: Folder[] = []
  ): SearchResult[] {
    let results = notes

    // Apply text search
    if (filter.query.trim()) {
      results = this.performTextSearch(results, filter.query)
    }

    // Apply folder filter
    if (filter.folders.length > 0) {
      results = results.filter(note => 
        filter.folders.includes(note.folder_id || 0)
      )
    }

    // Apply tag filter
    if (filter.tags.length > 0) {
      results = results.filter(note => 
        note.tags && note.tags.some(tag => filter.tags.includes(tag))
      )
    }

    // Apply date range filter
    if (filter.dateRange.start || filter.dateRange.end) {
      results = results.filter(note => {
        const noteDate = new Date(note.created_at)
        if (filter.dateRange.start && noteDate < filter.dateRange.start) return false
        if (filter.dateRange.end && noteDate > filter.dateRange.end) return false
        return true
      })
    }

    // Apply favorites filter
    if (filter.favorites !== null) {
      results = results.filter(note => note.is_favorite === filter.favorites)
    }

    // Apply archived filter
    if (filter.archived !== null) {
      results = results.filter(note => note.is_archived === filter.archived)
    }

    // Convert to search results with scoring
    const searchResults: SearchResult[] = results.map(note => {
      const score = this.calculateScore(note, filter, folders)
      const matchedFields = this.getMatchedFields(note, filter)
      const highlights = this.generateHighlights(note, filter.query)
      const snippets = this.generateSnippets(note, filter.query)

      return {
        note,
        score,
        matchedFields,
        highlights,
        snippets
      }
    })

    // Sort results
    return this.sortResults(searchResults, filter.sortBy, filter.sortOrder)
  }

  /**
   * Perform text search with advanced matching
   */
  private static performTextSearch(notes: Note[], query: string): Note[] {
    if (!query.trim()) return notes

    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0)
    
    return notes.filter(note => {
      const searchText = `${note.title || ''} ${note.content || ''}`.toLowerCase()
      
      // Check for exact phrase match
      if (searchText.includes(query.toLowerCase())) {
        return true
      }

      // Check for all terms match
      return searchTerms.every(term => searchText.includes(term))
    })
  }

  /**
   * Calculate relevance score for a note
   */
  private static calculateScore(note: Note, filter: SearchFilter, folders: Folder[]): number {
    let score = 0
    const query = filter.query.toLowerCase()

    if (!query) return 1

    // Title match (highest weight)
    if (note.title && note.title.toLowerCase().includes(query)) {
      score += 10
    }

    // Content match
    if (note.content && note.content.toLowerCase().includes(query)) {
      score += 5
    }

    // Tag match
    if (note.tags) {
      const tagMatches = note.tags.filter(tag => 
        tag.toLowerCase().includes(query)
      ).length
      score += tagMatches * 3
    }

    // Exact phrase match bonus
    const fullText = `${note.title || ''} ${note.content || ''}`.toLowerCase()
    if (fullText.includes(query)) {
      score += 2
    }

    // Recency bonus
    const daysSinceCreated = (Date.now() - new Date(note.created_at).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceCreated < 7) score += 1
    if (daysSinceCreated < 1) score += 2

    // Favorites bonus
    if (note.is_favorite) score += 1

    return Math.max(score, 0)
  }

  /**
   * Get matched fields for a note
   */
  private static getMatchedFields(note: Note, filter: SearchFilter): string[] {
    const fields: string[] = []
    const query = filter.query.toLowerCase()

    if (!query) return fields

    if (note.title && note.title.toLowerCase().includes(query)) {
      fields.push('title')
    }

    if (note.content && note.content.toLowerCase().includes(query)) {
      fields.push('content')
    }

    if (note.tags && note.tags.some(tag => tag.toLowerCase().includes(query))) {
      fields.push('tags')
    }

    return fields
  }

  /**
   * Generate highlights for search results
   */
  private static generateHighlights(note: Note, query: string): { title: string; content: string } {
    if (!query.trim()) {
      return {
        title: note.title || '',
        content: note.content || ''
      }
    }

    const highlight = (text: string) => {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
    }

    return {
      title: highlight(note.title || ''),
      content: highlight(note.content || '')
    }
  }

  /**
   * Generate content snippets for search results
   */
  private static generateSnippets(note: Note, query: string): string[] {
    if (!query.trim() || !note.content) return []

    const content = note.content
    const queryLower = query.toLowerCase()
    const snippets: string[] = []

    // Find all occurrences of the query
    const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    let match
    let lastIndex = 0

    while ((match = regex.exec(content)) !== null && snippets.length < 3) {
      const start = Math.max(0, match.index - 50)
      const end = Math.min(content.length, match.index + match[0].length + 50)
      const snippet = content.substring(start, end)
      
      if (snippet.trim()) {
        snippets.push(snippet.trim())
      }
      
      lastIndex = match.index + match[0].length
    }

    // If no matches found, return first 200 characters
    if (snippets.length === 0) {
      snippets.push(content.substring(0, 200))
    }

    return snippets
  }

  /**
   * Sort search results
   */
  private static sortResults(
    results: SearchResult[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): SearchResult[] {
    return results.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'relevance':
          comparison = b.score - a.score
          break
        case 'date':
          comparison = new Date(a.note.created_at).getTime() - new Date(b.note.created_at).getTime()
          break
        case 'title':
          comparison = (a.note.title || '').localeCompare(b.note.title || '')
          break
        case 'updated':
          comparison = new Date(a.note.updated_at).getTime() - new Date(b.note.updated_at).getTime()
          break
        default:
          comparison = b.score - a.score
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }

  /**
   * Get search suggestions
   */
  static getSuggestions(
    query: string,
    notes: Note[],
    folders: Folder[],
    recentSearches: string[] = []
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = []

    if (!query.trim()) {
      // Return recent searches
      return recentSearches.slice(0, 5).map(search => ({
        text: search,
        type: 'recent'
      }))
    }

    const queryLower = query.toLowerCase()

    // Get unique tags from notes
    const allTags = new Set<string>()
    notes.forEach(note => {
      if (note.tags) {
        note.tags.forEach(tag => allTags.add(tag))
      }
    })

    // Filter tags that match query
    const matchingTags = Array.from(allTags)
      .filter(tag => tag.toLowerCase().includes(queryLower))
      .slice(0, 5)
      .map(tag => ({
        text: tag,
        type: 'tag' as const,
        count: notes.filter(note => note.tags?.includes(tag)).length
      }))

    suggestions.push(...matchingTags)

    // Filter folders that match query
    const matchingFolders = folders
      .filter(folder => folder.name.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(folder => ({
        text: folder.name,
        type: 'folder' as const,
        count: notes.filter(note => note.folder_id === folder.id).length
      }))

    suggestions.push(...matchingFolders)

    // Get common query patterns
    const commonQueries = this.getCommonQueries(notes)
    const matchingQueries = commonQueries
      .filter(q => q.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .map(q => ({
        text: q,
        type: 'query' as const
      }))

    suggestions.push(...matchingQueries)

    return suggestions.slice(0, 10)
  }

  /**
   * Get common query patterns from notes
   */
  private static getCommonQueries(notes: Note[]): string[] {
    const queries: string[] = []

    // Extract common phrases from note titles
    const titles = notes.map(note => note.title || '').filter(title => title.length > 0)
    const commonWords = this.extractCommonWords(titles)

    queries.push(...commonWords)

    // Extract common phrases from note content
    const contents = notes.map(note => note.content || '').filter(content => content.length > 0)
    const commonContentWords = this.extractCommonWords(contents)

    queries.push(...commonContentWords)

    return [...new Set(queries)].slice(0, 20)
  }

  /**
   * Extract common words from text
   */
  private static extractCommonWords(texts: string[]): string[] {
    const wordCounts: Record<string, number> = {}

    texts.forEach(text => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3)

      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1
      })
    })

    return Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
  }

  /**
   * Save search to history
   */
  static saveSearch(query: string): void {
    if (!query.trim()) return

    try {
      const history = this.getSearchHistory()
      const newHistory = [query, ...history.filter(item => item !== query)].slice(0, this.MAX_HISTORY)
      localStorage.setItem(this.SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    } catch (error) {
      console.error('Failed to save search:', error)
    }
  }

  /**
   * Get search history
   */
  static getSearchHistory(): string[] {
    try {
      const stored = localStorage.getItem(this.SEARCH_HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load search history:', error)
      return []
    }
  }

  /**
   * Clear search history
   */
  static clearSearchHistory(): void {
    try {
      localStorage.removeItem(this.SEARCH_HISTORY_KEY)
    } catch (error) {
      console.error('Failed to clear search history:', error)
    }
  }

  /**
   * Get default search filter
   */
  static getDefaultFilter(): SearchFilter {
    return {
      query: '',
      folders: [],
      tags: [],
      dateRange: {
        start: null,
        end: null
      },
      favorites: null,
      archived: null,
      sortBy: 'relevance',
      sortOrder: 'desc',
      contentTypes: ['text', 'audio', 'image']
    }
  }

  /**
   * Export search results
   */
  static exportSearchResults(results: SearchResult[], format: 'json' | 'csv' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2)
      
      case 'csv':
        const csvHeaders = 'Title,Content,Score,Matched Fields,Created,Updated\n'
        const csvRows = results.map(result => {
          const note = result.note
          return `"${note.title || ''}","${(note.content || '').replace(/"/g, '""')}",${result.score},"${result.matchedFields.join(', ')}","${note.created_at}","${note.updated_at}"`
        }).join('\n')
        return csvHeaders + csvRows
      
      case 'markdown':
        const mdContent = results.map(result => {
          const note = result.note
          return `# ${note.title || 'Untitled'}\n\n${note.content || ''}\n\n---\n\n**Score:** ${result.score} | **Matched Fields:** ${result.matchedFields.join(', ')} | **Created:** ${new Date(note.created_at).toLocaleDateString()}\n`
        }).join('\n')
        return mdContent
      
      default:
        return JSON.stringify(results, null, 2)
    }
  }

  /**
   * Get search statistics
   */
  static getSearchStats(results: SearchResult[]): {
    totalResults: number
    averageScore: number
    topMatchedFields: Record<string, number>
    dateRange: { earliest: Date; latest: Date }
  } {
    if (results.length === 0) {
      return {
        totalResults: 0,
        averageScore: 0,
        topMatchedFields: {},
        dateRange: { earliest: new Date(), latest: new Date() }
      }
    }

    const totalResults = results.length
    const averageScore = results.reduce((sum, result) => sum + result.score, 0) / totalResults

    const fieldCounts: Record<string, number> = {}
    results.forEach(result => {
      result.matchedFields.forEach(field => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1
      })
    })

    const dates = results.map(result => new Date(result.note.created_at))
    const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
    const latest = new Date(Math.max(...dates.map(d => d.getTime())))

    return {
      totalResults,
      averageScore: Math.round(averageScore * 100) / 100,
      topMatchedFields: fieldCounts,
      dateRange: { earliest, latest }
    }
  }
}
