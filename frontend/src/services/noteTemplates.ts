export interface NoteTemplate {
  id: string
  name: string
  description: string
  category: string
  content: string
  tags: string[]
  icon: string
  isBuiltIn: boolean
}

export class NoteTemplatesService {
  private static readonly STORAGE_KEY = 'note-app-templates'
  private static readonly BUILT_IN_TEMPLATES: NoteTemplate[] = [
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Template for recording meeting discussions and action items',
      category: 'Work',
      content: `# Meeting Notes

**Date:** {{date}}
**Attendees:** {{attendees}}
**Location:** {{location}}

## Agenda
- 
- 
- 

## Discussion Points
- 
- 
- 

## Action Items
- [ ] 
- [ ] 
- [ ] 

## Next Meeting
**Date:** 
**Agenda:** `,
      tags: ['meeting', 'work', 'notes'],
      icon: '📝',
      isBuiltIn: true
    },
    {
      id: 'daily-journal',
      name: 'Daily Journal',
      description: 'Template for daily reflection and journaling',
      category: 'Personal',
      content: `# Daily Journal - {{date}}

## Today's Highlights
- 
- 
- 

## What I Learned
- 
- 
- 

## Challenges Faced
- 
- 
- 

## Tomorrow's Goals
- [ ] 
- [ ] 
- [ ] 

## Gratitude
- 
- 
- 

## Notes
`,
      tags: ['journal', 'personal', 'reflection'],
      icon: '📔',
      isBuiltIn: true
    },
    {
      id: 'project-plan',
      name: 'Project Plan',
      description: 'Template for planning and tracking project progress',
      category: 'Work',
      content: `# Project: {{projectName}}

**Start Date:** {{startDate}}
**End Date:** {{endDate}}
**Status:** {{status}}

## Project Overview
{{projectDescription}}

## Goals & Objectives
- 
- 
- 

## Key Deliverables
- [ ] 
- [ ] 
- [ ] 

## Timeline
| Phase | Start Date | End Date | Status |
|-------|------------|----------|--------|
| Planning | | | |
| Development | | | |
| Testing | | | |
| Launch | | | |

## Resources Needed
- 
- 
- 

## Risks & Mitigation
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| | | | |

## Notes
`,
      tags: ['project', 'planning', 'work'],
      icon: '📋',
      isBuiltIn: true
    },
    {
      id: 'book-notes',
      name: 'Book Notes',
      description: 'Template for taking notes while reading books',
      category: 'Learning',
      content: `# {{bookTitle}} - {{author}}

**Reading Date:** {{date}}
**Rating:** {{rating}}/5
**Genre:** {{genre}}

## Summary
{{summary}}

## Key Concepts
- 
- 
- 

## Important Quotes
> 

> 

> 

## Personal Insights
- 
- 
- 

## Action Items
- [ ] 
- [ ] 
- [ ] 

## Related Books
- 
- 
- 

## Notes
`,
      tags: ['book', 'reading', 'learning'],
      icon: '📚',
      isBuiltIn: true
    },
    {
      id: 'idea-brainstorm',
      name: 'Idea Brainstorm',
      description: 'Template for brainstorming and capturing creative ideas',
      category: 'Creative',
      content: `# Brainstorming: {{topic}}

**Date:** {{date}}
**Participants:** {{participants}}

## Problem Statement
{{problemStatement}}

## Initial Ideas
- 
- 
- 

## Refined Ideas
- 
- 
- 

## Evaluation Criteria
- 
- 
- 

## Top Ideas
1. 
2. 
3. 

## Next Steps
- [ ] 
- [ ] 
- [ ] 

## Additional Notes
`,
      tags: ['brainstorm', 'ideas', 'creative'],
      icon: '💡',
      isBuiltIn: true
    },
    {
      id: 'travel-plan',
      name: 'Travel Plan',
      description: 'Template for planning and documenting travel experiences',
      category: 'Personal',
      content: `# Travel: {{destination}}

**Dates:** {{startDate}} - {{endDate}}
**Travelers:** {{travelers}}

## Itinerary
| Date | Location | Activities | Accommodation |
|------|----------|------------|---------------|
| | | | |
| | | | |
| | | | |

## Packing List
- [ ] 
- [ ] 
- [ ] 

## Important Information
- **Emergency Contacts:** 
- **Travel Insurance:** 
- **Passport/Visa:** 
- **Currency:** 

## Budget
| Category | Budget | Actual | Notes |
|----------|--------|--------|-------|
| Flights | | | |
| Accommodation | | | |
| Food | | | |
| Activities | | | |

## Notes & Tips
`,
      tags: ['travel', 'planning', 'personal'],
      icon: '✈️',
      isBuiltIn: true
    }
  ]

  /**
   * Get all available templates
   */
  static getTemplates(): NoteTemplate[] {
    const customTemplates = this.getCustomTemplates()
    return [...this.BUILT_IN_TEMPLATES, ...customTemplates]
  }

  /**
   * Get templates by category
   */
  static getTemplatesByCategory(category: string): NoteTemplate[] {
    return this.getTemplates().filter(template => template.category === category)
  }

  /**
   * Get template by ID
   */
  static getTemplateById(id: string): NoteTemplate | undefined {
    return this.getTemplates().find(template => template.id === id)
  }

  /**
   * Get custom templates from localStorage
   */
  static getCustomTemplates(): NoteTemplate[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load custom templates:', error)
      return []
    }
  }

  /**
   * Save custom template
   */
  static saveCustomTemplate(template: Omit<NoteTemplate, 'id' | 'isBuiltIn'>): string {
    const customTemplates = this.getCustomTemplates()
    const newTemplate: NoteTemplate = {
      ...template,
      id: `custom-${Date.now()}`,
      isBuiltIn: false
    }
    
    customTemplates.push(newTemplate)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customTemplates))
    
    return newTemplate.id
  }

  /**
   * Update custom template
   */
  static updateCustomTemplate(id: string, updates: Partial<NoteTemplate>): boolean {
    const customTemplates = this.getCustomTemplates()
    const index = customTemplates.findIndex(template => template.id === id)
    
    if (index === -1) return false
    
    customTemplates[index] = { ...customTemplates[index], ...updates }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(customTemplates))
    
    return true
  }

  /**
   * Delete custom template
   */
  static deleteCustomTemplate(id: string): boolean {
    const customTemplates = this.getCustomTemplates()
    const filtered = customTemplates.filter(template => template.id !== id)
    
    if (filtered.length === customTemplates.length) return false
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
    return true
  }

  /**
   * Process template content with variables
   */
  static processTemplate(template: NoteTemplate, variables: Record<string, string> = {}): string {
    let content = template.content
    
    // Add default variables
    const defaultVariables = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      datetime: new Date().toLocaleString(),
      ...variables
    }
    
    // Replace variables in content
    Object.entries(defaultVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })
    
    return content
  }

  /**
   * Get all categories
   */
  static getCategories(): string[] {
    const templates = this.getTemplates()
    const categories = [...new Set(templates.map(template => template.category))]
    return categories.sort()
  }

  /**
   * Search templates
   */
  static searchTemplates(query: string): NoteTemplate[] {
    const templates = this.getTemplates()
    const lowercaseQuery = query.toLowerCase()
    
    return templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      template.category.toLowerCase().includes(lowercaseQuery)
    )
  }
}
