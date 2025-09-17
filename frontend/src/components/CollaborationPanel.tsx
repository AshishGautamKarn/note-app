import React, { useState, useEffect } from 'react'
import { Users, UserPlus, MessageCircle, Share2, Copy, Check, X, MoreVertical, Reply } from 'lucide-react'
import { CollaborationService, CollaborationSession, CollaborationInvite, CollaborationComment, CollaborationParticipant } from '../services/collaboration'

interface CollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
  noteId: number
  noteTitle: string
  currentUser: { id: string; name: string; email: string }
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isOpen,
  onClose,
  noteId,
  noteTitle,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'participants' | 'comments' | 'share'>('participants')
  const [session, setSession] = useState<CollaborationSession | null>(null)
  const [invites, setInvites] = useState<CollaborationInvite[]>([])
  const [comments, setComments] = useState<CollaborationComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [newInviteMessage, setNewInviteMessage] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadCollaborationData()
      generateShareLink()
    }
  }, [isOpen, noteId])

  const loadCollaborationData = () => {
    // Load existing session or create new one
    const existingSessions = CollaborationService.getAllSessions()
    const existingSession = existingSessions.find(s => s.noteId === noteId && s.isActive)
    
    if (existingSession) {
      setSession(existingSession)
    } else {
      const newSession = CollaborationService.createSession(noteId, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        isOnline: true,
        lastSeen: new Date().toISOString()
      })
      setSession(newSession)
    }

    // Load invites and comments
    setInvites(CollaborationService.getInvites().filter(invite => invite.noteId === noteId))
    setComments(CollaborationService.getComments(noteId))
  }

  const generateShareLink = () => {
    const link = CollaborationService.generateShareLink(noteId)
    setShareLink(link)
  }

  const handleInviteUser = () => {
    if (!newInviteEmail.trim()) return

    const invite = CollaborationService.createInvite(
      noteId,
      { name: currentUser.name, email: currentUser.email },
      newInviteEmail,
      newInviteMessage || undefined
    )

    setInvites(prev => [...prev, invite])
    setNewInviteEmail('')
    setNewInviteMessage('')
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return

    const comment = CollaborationService.addComment(
      noteId,
      { id: currentUser.id, name: currentUser.name },
      newComment,
      { line: 1, column: 0 } // Default position
    )

    setComments(prev => [...prev, comment])
    setNewComment('')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const handleAcceptInvite = (inviteId: string) => {
    CollaborationService.updateInviteStatus(inviteId, 'accepted')
    setInvites(prev => prev.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'accepted' as const } : invite
    ))
  }

  const handleDeclineInvite = (inviteId: string) => {
    CollaborationService.updateInviteStatus(inviteId, 'declined')
    setInvites(prev => prev.map(invite => 
      invite.id === inviteId ? { ...invite, status: 'declined' as const } : invite
    ))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Collaboration
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{noteTitle}</p>
            </div>
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
          {[
            { id: 'participants', label: 'Participants', icon: Users },
            { id: 'comments', label: 'Comments', icon: MessageCircle },
            { id: 'share', label: 'Share', icon: Share2 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'participants' && (
            <div className="space-y-6">
              {/* Current Participants */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Active Participants ({session?.participants.filter(p => p.isOnline).length || 0})
                </h3>
                <div className="space-y-3">
                  {session?.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {participant.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {participant.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          participant.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {participant.isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invite New User */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Invite Collaborators
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={newInviteMessage}
                      onChange={(e) => setNewInviteMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleInviteUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invite
                  </button>
                </div>
              </div>

              {/* Pending Invites */}
              {invites.filter(invite => invite.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Pending Invites
                  </h3>
                  <div className="space-y-3">
                    {invites
                      .filter(invite => invite.status === 'pending')
                      .map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {invite.inviteeEmail}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Invited by {invite.inviterName}
                            </p>
                            {invite.message && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                "{invite.message}"
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleAcceptInvite(invite.id)}
                              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20 rounded"
                              title="Accept"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeclineInvite(invite.id)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                              title="Decline"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              {/* Add Comment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Add Comment
                </h3>
                <div className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment or suggestion..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddComment}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Add Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Comments ({comments.length})
                </h3>
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                              {comment.authorName.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {comment.authorName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
                        <div className="flex items-center space-x-4">
                          <button className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            <Reply className="h-3 w-3" />
                            <span>Reply</span>
                          </button>
                          <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                            Resolve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-6">
              {/* Share Link */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Share Note
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Shareable Link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={shareLink}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg"
                      />
                      <button
                        onClick={handleCopyLink}
                        className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
                          linkCopied
                            ? 'bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      How to share:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Copy the link above and send it to collaborators</li>
                      <li>• Recipients can view and edit the note in real-time</li>
                      <li>• All changes are automatically synchronized</li>
                      <li>• You can revoke access at any time</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Collaboration Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Collaboration Settings
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Real-time Editing
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Allow multiple users to edit simultaneously
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Comment Notifications
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get notified when someone adds a comment
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Show Cursors
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Display other users' cursors and selections
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CollaborationPanel
