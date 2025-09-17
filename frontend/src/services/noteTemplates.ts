export interface NoteTemplate {
  id: string
  name: string
  description: string
  content: string
  category: string
  variables?: string[]
}

export class NoteTemplatesService {
  private static templates: NoteTemplate[] = [
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Template for recording meeting notes',
      category: 'Work',
      content: `# Meeting Notes - {{meeting_topic}}

**Date:** {{date}}
**Attendees:** {{attendees}}
**Duration:** {{duration}}

## Agenda
- {{agenda_item_1}}
- {{agenda_item_2}}
- {{agenda_item_3}}

## Discussion Points
- {{discussion_point_1}}
- {{discussion_point_2}}

## Action Items
- [ ] {{action_item_1}} - {{assignee_1}} - {{due_date_1}}
- [ ] {{action_item_2}} - {{assignee_2}} - {{due_date_2}}

## Next Steps
{{next_steps}}

## Notes
{{additional_notes}}`,
      variables: ['meeting_topic', 'date', 'attendees', 'duration', 'agenda_item_1', 'agenda_item_2', 'agenda_item_3', 'discussion_point_1', 'discussion_point_2', 'action_item_1', 'assignee_1', 'due_date_1', 'action_item_2', 'assignee_2', 'due_date_2', 'next_steps', 'additional_notes']
    },
    {
      id: 'daily-journal',
      name: 'Daily Journal',
      description: 'Template for daily reflection and journaling',
      category: 'Personal',
      content: `# Daily Journal - {{date}}

## Today's Highlights
{{highlights}}

## What I Learned
{{learnings}}

## Challenges Faced
{{challenges}}

## Gratitude
{{gratitude}}

## Tomorrow's Goals
- {{goal_1}}
- {{goal_2}}
- {{goal_3}}

## Mood
{{mood}}/10

## Notes
{{additional_thoughts}}`,
      variables: ['date', 'highlights', 'learnings', 'challenges', 'gratitude', 'goal_1', 'goal_2', 'goal_3', 'mood', 'additional_thoughts']
    },
    {
      id: 'project-plan',
      name: 'Project Plan',
      description: 'Template for planning new projects',
      category: 'Work',
      content: `# Project: {{project_name}}

## Overview
{{project_description}}

## Goals
- {{goal_1}}
- {{goal_2}}
- {{goal_3}}

## Timeline
- **Start Date:** {{start_date}}
- **End Date:** {{end_date}}
- **Milestones:**
  - {{milestone_1}} - {{milestone_1_date}}
  - {{milestone_2}} - {{milestone_2_date}}
  - {{milestone_3}} - {{milestone_3_date}}

## Resources Needed
- {{resource_1}}
- {{resource_2}}
- {{resource_3}}

## Team Members
- {{team_member_1}} - {{role_1}}
- {{team_member_2}} - {{role_2}}

## Risks & Mitigation
- **Risk:** {{risk_1}} | **Mitigation:** {{mitigation_1}}
- **Risk:** {{risk_2}} | **Mitigation:** {{mitigation_2}}

## Success Criteria
{{success_criteria}}`,
      variables: ['project_name', 'project_description', 'goal_1', 'goal_2', 'goal_3', 'start_date', 'end_date', 'milestone_1', 'milestone_1_date', 'milestone_2', 'milestone_2_date', 'milestone_3', 'milestone_3_date', 'resource_1', 'resource_2', 'resource_3', 'team_member_1', 'role_1', 'team_member_2', 'role_2', 'risk_1', 'mitigation_1', 'risk_2', 'mitigation_2', 'success_criteria']
    },
    {
      id: 'book-review',
      name: 'Book Review',
      description: 'Template for reviewing books',
      category: 'Personal',
      content: `# Book Review: {{book_title}}

**Author:** {{author}}
**Genre:** {{genre}}
**Pages:** {{pages}}
**Rating:** {{rating}}/5

## Summary
{{summary}}

## Key Takeaways
- {{takeaway_1}}
- {{takeaway_2}}
- {{takeaway_3}}

## What I Liked
{{liked}}

## What I Didn't Like
{{disliked}}

## Favorite Quotes
> {{quote_1}}

> {{quote_2}}

## Would I Recommend?
{{recommendation}}

## Notes
{{additional_notes}}`,
      variables: ['book_title', 'author', 'genre', 'pages', 'rating', 'summary', 'takeaway_1', 'takeaway_2', 'takeaway_3', 'liked', 'disliked', 'quote_1', 'quote_2', 'recommendation', 'additional_notes']
    },
    {
      id: 'idea-capture',
      name: 'Idea Capture',
      description: 'Template for capturing and developing ideas',
      category: 'Creative',
      content: `# Idea: {{idea_title}}

## The Idea
{{idea_description}}

## Why This Matters
{{why_matters}}

## Target Audience
{{target_audience}}

## Implementation Steps
1. {{step_1}}
2. {{step_2}}
3. {{step_3}}
4. {{step_4}}

## Resources Needed
- {{resource_1}}
- {{resource_2}}
- {{resource_3}}

## Potential Challenges
- {{challenge_1}}
- {{challenge_2}}

## Success Metrics
- {{metric_1}}
- {{metric_2}}

## Next Actions
- [ ] {{action_1}}
- [ ] {{action_2}}
- [ ] {{action_3}}

## Notes
{{additional_thoughts}}`,
      variables: ['idea_title', 'idea_description', 'why_matters', 'target_audience', 'step_1', 'step_2', 'step_3', 'step_4', 'resource_1', 'resource_2', 'resource_3', 'challenge_1', 'challenge_2', 'metric_1', 'metric_2', 'action_1', 'action_2', 'action_3', 'additional_thoughts']
    }
  ]

  static getAllTemplates(): NoteTemplate[] {
    return this.templates
  }

  static getTemplatesByCategory(category: string): NoteTemplate[] {
    return this.templates.filter(template => template.category === category)
  }

  static getTemplateById(id: string): NoteTemplate | undefined {
    return this.templates.find(template => template.id === id)
  }

  static searchTemplates(query: string): NoteTemplate[] {
    const lowercaseQuery = query.toLowerCase()
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery)
    )
  }

  static processTemplate(template: NoteTemplate, variables: Record<string, string>): string {
    let content = template.content
    
    // Replace variables with provided values
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value || `{{${key}}}`)
    })

    // Replace any remaining variables with empty strings
    content = content.replace(/{{[^}]+}}/g, '')

    // Set default values for common variables
    const defaults: Record<string, string> = {
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      datetime: new Date().toLocaleString()
    }

    Object.entries(defaults).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, value)
    })

    return content
  }

  static getCategories(): string[] {
    const categories = new Set(this.templates.map(template => template.category))
    return Array.from(categories).sort()
  }
}