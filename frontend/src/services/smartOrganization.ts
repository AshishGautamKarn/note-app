import { Note, Folder } from '../types'

export interface SmartSuggestion {
  type: 'folder' | 'tag' | 'title' | 'content' | 'archive' | 'favorite'
  confidence: number
  suggestion: string
  reason: string
  action: () => void
}

export interface NoteInsight {
  type: 'duplicate' | 'similar' | 'incomplete' | 'outdated' | 'important'
  confidence: number
  message: string
  suggestions: string[]
}

export interface AutoCategorization {
  suggestedFolder: string
  suggestedTags: string[]
  confidence: number
  reasoning: string[]
}

export class SmartOrganizationService {
  private static readonly KEYWORDS = {
    work: ['meeting', 'project', 'deadline', 'task', 'work', 'office', 'business'],
    personal: ['personal', 'family', 'home', 'hobby', 'travel', 'vacation'],
    study: ['study', 'learn', 'course', 'book', 'education', 'research', 'notes'],
    health: ['health', 'exercise', 'diet', 'medical', 'doctor', 'fitness'],
    finance: ['money', 'budget', 'expense', 'income', 'investment', 'finance'],
    ideas: ['idea', 'brainstorm', 'creative', 'innovation', 'concept', 'thought']
  }

  private static readonly TAG_PATTERNS = {
    urgent: ['urgent', 'asap', 'important', 'critical', 'deadline'],
    todo: ['todo', 'task', 'reminder', 'do', 'complete'],
    meeting: ['meeting', 'call', 'conference', 'discussion'],
    project: ['project', 'initiative', 'campaign', 'program'],
    idea: ['idea', 'brainstorm', 'concept', 'thought', 'inspiration']
  }

  /**
   * Generate smart suggestions for note organization
   */
  static generateSuggestions(note: Note, allNotes: Note[], allFolders: Folder[]): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = []

    // Analyze title and content for folder suggestions
    const folderSuggestion = this.suggestFolder(note, allFolders)
    if (folderSuggestion) {
      suggestions.push({
        type: 'folder',
        confidence: folderSuggestion.confidence,
        suggestion: folderSuggestion.folder,
        reason: folderSuggestion.reason,
        action: () => {
          // This would be handled by the parent component
          console.log('Suggest folder:', folderSuggestion.folder)
        }
      })
    }

    // Analyze content for tag suggestions
    const tagSuggestions = this.suggestTags(note)
    tagSuggestions.forEach(tag => {
      suggestions.push({
        type: 'tag',
        confidence: tag.confidence,
        suggestion: tag.tag,
        reason: tag.reason,
        action: () => {
          console.log('Suggest tag:', tag.tag)
        }
      })
    })

    // Check for duplicate or similar notes
    const duplicateSuggestion = this.checkForDuplicates(note, allNotes)
    if (duplicateSuggestion) {
      suggestions.push({
        type: 'content',
        confidence: duplicateSuggestion.confidence,
        suggestion: 'Similar note found',
        reason: duplicateSuggestion.reason,
        action: () => {
          console.log('Show similar note:', duplicateSuggestion.noteId)
        }
      })
    }

    // Check if note should be archived
    const archiveSuggestion = this.suggestArchive(note)
    if (archiveSuggestion) {
      suggestions.push({
        type: 'archive',
        confidence: archiveSuggestion.confidence,
        suggestion: 'Consider archiving',
        reason: archiveSuggestion.reason,
        action: () => {
          console.log('Suggest archiving')
        }
      })
    }

    // Check if note should be favorited
    const favoriteSuggestion = this.suggestFavorite(note)
    if (favoriteSuggestion) {
      suggestions.push({
        type: 'favorite',
        confidence: favoriteSuggestion.confidence,
        suggestion: 'Mark as favorite',
        reason: favoriteSuggestion.reason,
        action: () => {
          console.log('Suggest favoriting')
        }
      })
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Suggest folder based on note content
   */
  private static suggestFolder(note: Note, folders: Folder[]): { folder: string; confidence: number; reason: string } | null {
    const content = `${note.title} ${note.content}`.toLowerCase()
    
    for (const [category, keywords] of Object.entries(this.KEYWORDS)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length
      if (matches > 0) {
        const confidence = Math.min(matches / keywords.length, 1)
        const existingFolder = folders.find(f => f.name.toLowerCase().includes(category))
        
        if (existingFolder) {
          return {
            folder: existingFolder.name,
            confidence,
            reason: `Content matches ${category} keywords (${matches}/${keywords.length})`
          }
        }
      }
    }

    return null
  }

  /**
   * Suggest tags based on note content
   */
  private static suggestTags(note: Note): { tag: string; confidence: number; reason: string }[] {
    const suggestions: { tag: string; confidence: number; reason: string }[] = []
    const content = `${note.title} ${note.content}`.toLowerCase()

    for (const [tag, patterns] of Object.entries(this.TAG_PATTERNS)) {
      const matches = patterns.filter(pattern => content.includes(pattern)).length
      if (matches > 0) {
        const confidence = Math.min(matches / patterns.length, 1)
        suggestions.push({
          tag,
          confidence,
          reason: `Content contains ${tag} patterns (${matches}/${patterns.length})`
        })
      }
    }

    // Extract potential tags from content
    const words = content.split(/\s+/).filter(word => word.length > 3)
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const frequentWords = Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)

    frequentWords.forEach(([word, count]) => {
      suggestions.push({
        tag: word,
        confidence: Math.min(count / 3, 1),
        reason: `Word "${word}" appears ${count} times`
      })
    })

    return suggestions.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Check for duplicate or similar notes
   */
  private static checkForDuplicates(note: Note, allNotes: Note[]): { noteId: number; confidence: number; reason: string } | null {
    const otherNotes = allNotes.filter(n => n.id !== note.id)
    
    for (const otherNote of otherNotes) {
      const similarity = this.calculateSimilarity(note, otherNote)
      if (similarity > 0.7) {
        return {
          noteId: otherNote.id,
          confidence: similarity,
          reason: `Similar to "${otherNote.title}" (${Math.round(similarity * 100)}% match)`
        }
      }
    }

    return null
  }

  /**
   * Calculate similarity between two notes
   */
  private static calculateSimilarity(note1: Note, note2: Note): number {
    const text1 = `${note1.title} ${note1.content}`.toLowerCase()
    const text2 = `${note2.title} ${note2.content}`.toLowerCase()
    
    const words1 = new Set(text1.split(/\s+/))
    const words2 = new Set(text2.split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

  /**
   * Suggest archiving based on note age and content
   */
  private static suggestArchive(note: Note): { confidence: number; reason: string } | null {
    const createdDate = new Date(note.created_at)
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    
    // Suggest archiving if note is old and not recently updated
    if (daysSinceCreated > 30) {
      const updatedDate = new Date(note.updated_at)
      const daysSinceUpdated = (Date.now() - updatedDate.getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceUpdated > 14) {
        return {
          confidence: 0.8,
          reason: `Note is ${Math.round(daysSinceCreated)} days old and hasn't been updated in ${Math.round(daysSinceUpdated)} days`
        }
      }
    }

    return null
  }

  /**
   * Suggest favoriting based on content importance
   */
  private static suggestFavorite(note: Note): { confidence: number; reason: string } | null {
    const content = `${note.title} ${note.content}`.toLowerCase()
    const importantKeywords = ['important', 'critical', 'urgent', 'key', 'essential', 'vital']
    
    const matches = importantKeywords.filter(keyword => content.includes(keyword)).length
    if (matches > 0) {
      return {
        confidence: Math.min(matches / importantKeywords.length, 1),
        reason: `Content contains ${matches} important keywords`
      }
    }

    // Check for long, detailed notes
    if (note.content && note.content.length > 500) {
      return {
        confidence: 0.6,
        reason: 'Detailed note with substantial content'
      }
    }

    return null
  }

  /**
   * Generate insights about notes
   */
  static generateInsights(notes: Note[]): NoteInsight[] {
    const insights: NoteInsight[] = []

    // Check for incomplete notes
    const incompleteNotes = notes.filter(note => 
      !note.title || note.title.trim() === '' || 
      !note.content || note.content.trim() === ''
    )

    if (incompleteNotes.length > 0) {
      insights.push({
        type: 'incomplete',
        confidence: 1,
        message: `${incompleteNotes.length} notes appear to be incomplete`,
        suggestions: [
          'Add titles to untitled notes',
          'Add content to empty notes',
          'Consider deleting empty notes'
        ]
      })
    }

    // Check for outdated notes
    const outdatedNotes = notes.filter(note => {
      const createdDate = new Date(note.created_at)
      const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceCreated > 90
    })

    if (outdatedNotes.length > 0) {
      insights.push({
        type: 'outdated',
        confidence: 0.8,
        message: `${outdatedNotes.length} notes are older than 90 days`,
        suggestions: [
          'Review old notes for relevance',
          'Archive outdated information',
          'Update important but old notes'
        ]
      })
    }

    // Check for duplicate notes
    const duplicates = this.findDuplicates(notes)
    if (duplicates.length > 0) {
      insights.push({
        type: 'duplicate',
        confidence: 0.9,
        message: `${duplicates.length} potential duplicate notes found`,
        suggestions: [
          'Review duplicate notes',
          'Merge similar notes',
          'Delete redundant notes'
        ]
      })
    }

    return insights
  }

  /**
   * Find duplicate notes
   */
  private static findDuplicates(notes: Note[]): { note1: Note; note2: Note; similarity: number }[] {
    const duplicates: { note1: Note; note2: Note; similarity: number }[] = []
    
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const similarity = this.calculateSimilarity(notes[i], notes[j])
        if (similarity > 0.8) {
          duplicates.push({
            note1: notes[i],
            note2: notes[j],
            similarity
          })
        }
      }
    }

    return duplicates
  }

  /**
   * Auto-categorize a note
   */
  static autoCategorize(note: Note, existingFolders: Folder[]): AutoCategorization {
    const content = `${note.title} ${note.content}`.toLowerCase()
    const reasoning: string[] = []
    let maxConfidence = 0
    let suggestedFolder = 'General'
    const suggestedTags: string[] = []

    // Analyze for folder suggestion
    for (const [category, keywords] of Object.entries(this.KEYWORDS)) {
      const matches = keywords.filter(keyword => content.includes(keyword)).length
      if (matches > 0) {
        const confidence = matches / keywords.length
        if (confidence > maxConfidence) {
          maxConfidence = confidence
          suggestedFolder = category.charAt(0).toUpperCase() + category.slice(1)
          reasoning.push(`Content matches ${category} keywords (${matches}/${keywords.length})`)
        }
      }
    }

    // Analyze for tag suggestions
    for (const [tag, patterns] of Object.entries(this.TAG_PATTERNS)) {
      const matches = patterns.filter(pattern => content.includes(pattern)).length
      if (matches > 0) {
        suggestedTags.push(tag)
        reasoning.push(`Content contains ${tag} patterns`)
      }
    }

    // Extract frequent words as potential tags
    const words = content.split(/\s+/).filter(word => word.length > 3)
    const wordCounts = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const frequentWords = Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([word]) => word)

    suggestedTags.push(...frequentWords)

    return {
      suggestedFolder,
      suggestedTags: [...new Set(suggestedTags)],
      confidence: maxConfidence,
      reasoning
    }
  }

  /**
   * Generate smart search suggestions
   */
  static generateSearchSuggestions(query: string, notes: Note[]): string[] {
    if (!query || query.length < 2) return []

    const suggestions: string[] = []
    const queryLower = query.toLowerCase()

    // Extract unique words from all notes
    const allWords = new Set<string>()
    notes.forEach(note => {
      const text = `${note.title} ${note.content}`.toLowerCase()
      const words = text.split(/\s+/).filter(word => word.length > 2)
      words.forEach(word => allWords.add(word))
    })

    // Find words that start with the query
    const matchingWords = Array.from(allWords)
      .filter(word => word.startsWith(queryLower))
      .sort()
      .slice(0, 10)

    suggestions.push(...matchingWords)

    // Find words that contain the query
    const containingWords = Array.from(allWords)
      .filter(word => word.includes(queryLower) && !word.startsWith(queryLower))
      .sort()
      .slice(0, 5)

    suggestions.push(...containingWords)

    return [...new Set(suggestions)]
  }

  /**
   * Generate productivity insights
   */
  static generateProductivityInsights(notes: Note[]): {
    totalNotes: number
    averageWordsPerNote: number
    mostProductiveDay: string
    notesByCategory: Record<string, number>
    suggestions: string[]
  } {
    const totalNotes = notes.length
    const totalWords = notes.reduce((sum, note) => {
      const words = (note.content || '').split(/\s+/).filter(word => word.length > 0)
      return sum + words.length
    }, 0)
    const averageWordsPerNote = totalNotes > 0 ? Math.round(totalWords / totalNotes) : 0

    // Find most productive day
    const dayCounts: Record<string, number> = {}
    notes.forEach(note => {
      const day = new Date(note.created_at).toLocaleDateString('en-US', { weekday: 'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    })
    const mostProductiveDay = Object.entries(dayCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday'

    // Categorize notes
    const notesByCategory: Record<string, number> = {}
    notes.forEach(note => {
      const content = `${note.title} ${note.content}`.toLowerCase()
      for (const [category, keywords] of Object.entries(this.KEYWORDS)) {
        const matches = keywords.filter(keyword => content.includes(keyword)).length
        if (matches > 0) {
          notesByCategory[category] = (notesByCategory[category] || 0) + 1
        }
      }
    })

    // Generate suggestions
    const suggestions: string[] = []
    if (averageWordsPerNote < 50) {
      suggestions.push('Consider adding more detail to your notes')
    }
    if (totalNotes > 100) {
      suggestions.push('Consider organizing notes into more folders')
    }
    if (Object.keys(notesByCategory).length < 3) {
      suggestions.push('Try diversifying your note topics')
    }

    return {
      totalNotes,
      averageWordsPerNote,
      mostProductiveDay,
      notesByCategory,
      suggestions
    }
  }
}
