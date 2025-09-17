import { Note } from '../types'

export interface CollaborationSession {
  id: string
  noteId: number
  participants: CollaborationParticipant[]
  isActive: boolean
  createdAt: string
  lastActivity: string
}

export interface CollaborationParticipant {
  id: string
  name: string
  email: string
  avatar?: string
  isOnline: boolean
  lastSeen: string
  cursorPosition?: {
    line: number
    column: number
  }
  selection?: {
    start: number
    end: number
  }
}

export interface CollaborationInvite {
  id: string
  noteId: number
  inviterName: string
  inviterEmail: string
  inviteeEmail: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  expiresAt: string
  message?: string
}

export interface CollaborationComment {
  id: string
  noteId: number
  authorId: string
  authorName: string
  content: string
  position: {
    line: number
    column: number
  }
  createdAt: string
  isResolved: boolean
  replies: CollaborationCommentReply[]
}

export interface CollaborationCommentReply {
  id: string
  commentId: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface CollaborationChange {
  id: string
  noteId: number
  authorId: string
  type: 'insert' | 'delete' | 'format'
  position: number
  content: string
  timestamp: string
  version: number
}

export class CollaborationService {
  private static readonly STORAGE_KEY = 'note-app-collaboration'
  private static readonly INVITES_KEY = 'note-app-invites'
  private static readonly COMMENTS_KEY = 'note-app-comments'
  private static readonly CHANGES_KEY = 'note-app-changes'

  /**
   * Create a new collaboration session
   */
  static createSession(noteId: number, participant: CollaborationParticipant): CollaborationSession {
    const session: CollaborationSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      participants: [participant],
      isActive: true,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    }

    this.saveSession(session)
    return session
  }

  /**
   * Join an existing collaboration session
   */
  static joinSession(sessionId: string, participant: CollaborationParticipant): CollaborationSession | null {
    const session = this.getSession(sessionId)
    if (!session || !session.isActive) return null

    // Check if participant already exists
    const existingParticipant = session.participants.find(p => p.id === participant.id)
    if (existingParticipant) {
      existingParticipant.isOnline = true
      existingParticipant.lastSeen = new Date().toISOString()
    } else {
      session.participants.push(participant)
    }

    session.lastActivity = new Date().toISOString()
    this.saveSession(session)
    return session
  }

  /**
   * Leave a collaboration session
   */
  static leaveSession(sessionId: string, participantId: string): void {
    const session = this.getSession(sessionId)
    if (!session) return

    const participant = session.participants.find(p => p.id === participantId)
    if (participant) {
      participant.isOnline = false
      participant.lastSeen = new Date().toISOString()
    }

    // If no participants are online, deactivate session
    const hasOnlineParticipants = session.participants.some(p => p.isOnline)
    if (!hasOnlineParticipants) {
      session.isActive = false
    }

    session.lastActivity = new Date().toISOString()
    this.saveSession(session)
  }

  /**
   * Get collaboration session
   */
  static getSession(sessionId: string): CollaborationSession | null {
    try {
      const sessions = this.getAllSessions()
      return sessions.find(s => s.id === sessionId) || null
    } catch (error) {
      console.error('Failed to get session:', error)
      return null
    }
  }

  /**
   * Get all collaboration sessions
   */
  static getAllSessions(): CollaborationSession[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load sessions:', error)
      return []
    }
  }

  /**
   * Save collaboration session
   */
  private static saveSession(session: CollaborationSession): void {
    try {
      const sessions = this.getAllSessions()
      const index = sessions.findIndex(s => s.id === session.id)
      
      if (index >= 0) {
        sessions[index] = session
      } else {
        sessions.push(session)
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  /**
   * Create collaboration invite
   */
  static createInvite(
    noteId: number,
    inviter: { name: string; email: string },
    inviteeEmail: string,
    message?: string
  ): CollaborationInvite {
    const invite: CollaborationInvite = {
      id: `invite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      inviterName: inviter.name,
      inviterEmail: inviter.email,
      inviteeEmail,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      message
    }

    this.saveInvite(invite)
    return invite
  }

  /**
   * Get collaboration invites
   */
  static getInvites(): CollaborationInvite[] {
    try {
      const stored = localStorage.getItem(this.INVITES_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load invites:', error)
      return []
    }
  }

  /**
   * Save collaboration invite
   */
  private static saveInvite(invite: CollaborationInvite): void {
    try {
      const invites = this.getInvites()
      invites.push(invite)
      localStorage.setItem(this.INVITES_KEY, JSON.stringify(invites))
    } catch (error) {
      console.error('Failed to save invite:', error)
    }
  }

  /**
   * Update invite status
   */
  static updateInviteStatus(inviteId: string, status: 'accepted' | 'declined'): void {
    try {
      const invites = this.getInvites()
      const invite = invites.find(i => i.id === inviteId)
      if (invite) {
        invite.status = status
        localStorage.setItem(this.INVITES_KEY, JSON.stringify(invites))
      }
    } catch (error) {
      console.error('Failed to update invite status:', error)
    }
  }

  /**
   * Add collaboration comment
   */
  static addComment(
    noteId: number,
    author: { id: string; name: string },
    content: string,
    position: { line: number; column: number }
  ): CollaborationComment {
    const comment: CollaborationComment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      authorId: author.id,
      authorName: author.name,
      content,
      position,
      createdAt: new Date().toISOString(),
      isResolved: false,
      replies: []
    }

    this.saveComment(comment)
    return comment
  }

  /**
   * Get comments for a note
   */
  static getComments(noteId: number): CollaborationComment[] {
    try {
      const stored = localStorage.getItem(this.COMMENTS_KEY)
      const comments: CollaborationComment[] = stored ? JSON.parse(stored) : []
      return comments.filter(c => c.noteId === noteId)
    } catch (error) {
      console.error('Failed to load comments:', error)
      return []
    }
  }

  /**
   * Save collaboration comment
   */
  private static saveComment(comment: CollaborationComment): void {
    try {
      const stored = localStorage.getItem(this.COMMENTS_KEY)
      const comments: CollaborationComment[] = stored ? JSON.parse(stored) : []
      comments.push(comment)
      localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments))
    } catch (error) {
      console.error('Failed to save comment:', error)
    }
  }

  /**
   * Add reply to comment
   */
  static addCommentReply(
    commentId: string,
    author: { id: string; name: string },
    content: string
  ): CollaborationCommentReply {
    const reply: CollaborationCommentReply = {
      id: `reply-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      commentId,
      authorId: author.id,
      authorName: author.name,
      content,
      createdAt: new Date().toISOString()
    }

    this.saveCommentReply(reply)
    return reply
  }

  /**
   * Save comment reply
   */
  private static saveCommentReply(reply: CollaborationCommentReply): void {
    try {
      const stored = localStorage.getItem(this.COMMENTS_KEY)
      const comments: CollaborationComment[] = stored ? JSON.parse(stored) : []
      
      const comment = comments.find(c => c.id === reply.commentId)
      if (comment) {
        comment.replies.push(reply)
        localStorage.setItem(this.COMMENTS_KEY, JSON.stringify(comments))
      }
    } catch (error) {
      console.error('Failed to save comment reply:', error)
    }
  }

  /**
   * Track collaboration change
   */
  static trackChange(
    noteId: number,
    authorId: string,
    type: 'insert' | 'delete' | 'format',
    position: number,
    content: string,
    version: number
  ): CollaborationChange {
    const change: CollaborationChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      noteId,
      authorId,
      type,
      position,
      content,
      timestamp: new Date().toISOString(),
      version
    }

    this.saveChange(change)
    return change
  }

  /**
   * Get changes for a note
   */
  static getChanges(noteId: number): CollaborationChange[] {
    try {
      const stored = localStorage.getItem(this.CHANGES_KEY)
      const changes: CollaborationChange[] = stored ? JSON.parse(stored) : []
      return changes.filter(c => c.noteId === noteId).sort((a, b) => a.version - b.version)
    } catch (error) {
      console.error('Failed to load changes:', error)
      return []
    }
  }

  /**
   * Save collaboration change
   */
  private static saveChange(change: CollaborationChange): void {
    try {
      const stored = localStorage.getItem(this.CHANGES_KEY)
      const changes: CollaborationChange[] = stored ? JSON.parse(stored) : []
      changes.push(change)
      localStorage.setItem(this.CHANGES_KEY, JSON.stringify(changes))
    } catch (error) {
      console.error('Failed to save change:', error)
    }
  }

  /**
   * Generate shareable link for note
   */
  static generateShareLink(noteId: number, baseUrl: string = window.location.origin): string {
    return `${baseUrl}/note/${noteId}?collaborate=true`
  }

  /**
   * Parse shareable link
   */
  static parseShareLink(url: string): { noteId: number; isCollaboration: boolean } | null {
    try {
      const urlObj = new URL(url)
      const pathParts = urlObj.pathname.split('/')
      const noteId = parseInt(pathParts[pathParts.length - 1])
      const isCollaboration = urlObj.searchParams.get('collaborate') === 'true'
      
      if (isNaN(noteId)) return null
      
      return { noteId, isCollaboration }
    } catch (error) {
      console.error('Failed to parse share link:', error)
      return null
    }
  }

  /**
   * Clean up expired sessions and invites
   */
  static cleanup(): void {
    const now = new Date()
    
    // Clean up expired invites
    const invites = this.getInvites()
    const activeInvites = invites.filter(invite => new Date(invite.expiresAt) > now)
    localStorage.setItem(this.INVITES_KEY, JSON.stringify(activeInvites))
    
    // Clean up inactive sessions (older than 24 hours)
    const sessions = this.getAllSessions()
    const activeSessions = sessions.filter(session => {
      const lastActivity = new Date(session.lastActivity)
      const hoursSinceActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      return hoursSinceActivity < 24
    })
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeSessions))
  }
}
