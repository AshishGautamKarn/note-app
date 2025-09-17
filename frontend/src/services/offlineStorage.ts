import { Note, Folder } from '../types'

export interface OfflineNote extends Note {
  isOffline: boolean
  lastSynced?: Date
  pendingSync: boolean
}

export interface OfflineFolder extends Folder {
  isOffline: boolean
  lastSynced?: Date
  pendingSync: boolean
}

export interface SyncStatus {
  isOnline: boolean
  lastSync: Date | null
  pendingItems: number
  syncInProgress: boolean
}

export class OfflineStorageService {
  private static readonly DB_NAME = 'NoteAppDB'
  private static readonly DB_VERSION = 1
  private static readonly NOTES_STORE = 'notes'
  private static readonly FOLDERS_STORE = 'folders'
  private static readonly SYNC_QUEUE_STORE = 'syncQueue'

  private static db: IDBDatabase | null = null
  private static syncStatus: SyncStatus = {
    isOnline: navigator.onLine,
    lastSync: null,
    pendingItems: 0,
    syncInProgress: false
  }

  private static listeners: ((status: SyncStatus) => void)[] = []

  /**
   * Initialize IndexedDB
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        this.updateSyncStatus()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create notes store
        if (!db.objectStoreNames.contains(this.NOTES_STORE)) {
          const notesStore = db.createObjectStore(this.NOTES_STORE, { keyPath: 'id' })
          notesStore.createIndex('folder_id', 'folder_id', { unique: false })
          notesStore.createIndex('is_favorite', 'is_favorite', { unique: false })
          notesStore.createIndex('is_archived', 'is_archived', { unique: false })
          notesStore.createIndex('created_at', 'created_at', { unique: false })
          notesStore.createIndex('isOffline', 'isOffline', { unique: false })
        }

        // Create folders store
        if (!db.objectStoreNames.contains(this.FOLDERS_STORE)) {
          const foldersStore = db.createObjectStore(this.FOLDERS_STORE, { keyPath: 'id' })
          foldersStore.createIndex('name', 'name', { unique: false })
          foldersStore.createIndex('isOffline', 'isOffline', { unique: false })
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains(this.SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(this.SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true })
          syncStore.createIndex('type', 'type', { unique: false })
          syncStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * Save note offline
   */
  static async saveNoteOffline(note: Note): Promise<void> {
    if (!this.db) await this.initialize()

    const offlineNote: OfflineNote = {
      ...note,
      isOffline: true,
      lastSynced: new Date(),
      pendingSync: true
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.NOTES_STORE], 'readwrite')
      const store = transaction.objectStore(this.NOTES_STORE)
      const request = store.put(offlineNote)

      request.onsuccess = () => {
        this.addToSyncQueue('note', offlineNote)
        this.updateSyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Save folder offline
   */
  static async saveFolderOffline(folder: Folder): Promise<void> {
    if (!this.db) await this.initialize()

    const offlineFolder: OfflineFolder = {
      ...folder,
      isOffline: true,
      lastSynced: new Date(),
      pendingSync: true
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.FOLDERS_STORE], 'readwrite')
      const store = transaction.objectStore(this.FOLDERS_STORE)
      const request = store.put(offlineFolder)

      request.onsuccess = () => {
        this.addToSyncQueue('folder', offlineFolder)
        this.updateSyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all offline notes
   */
  static async getOfflineNotes(): Promise<OfflineNote[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.NOTES_STORE], 'readonly')
      const store = transaction.objectStore(this.NOTES_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const notes = request.result.filter(note => note.isOffline) as OfflineNote[]
        resolve(notes)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get all offline folders
   */
  static async getOfflineFolders(): Promise<OfflineFolder[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.FOLDERS_STORE], 'readonly')
      const store = transaction.objectStore(this.FOLDERS_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const folders = request.result.filter(folder => folder.isOffline) as OfflineFolder[]
        resolve(folders)
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete note from offline storage
   */
  static async deleteNoteOffline(noteId: number): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.NOTES_STORE], 'readwrite')
      const store = transaction.objectStore(this.NOTES_STORE)
      const request = store.delete(noteId)

      request.onsuccess = () => {
        this.addToSyncQueue('delete_note', { id: noteId })
        this.updateSyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Delete folder from offline storage
   */
  static async deleteFolderOffline(folderId: number): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.FOLDERS_STORE], 'readwrite')
      const store = transaction.objectStore(this.FOLDERS_STORE)
      const request = store.delete(folderId)

      request.onsuccess = () => {
        this.addToSyncQueue('delete_folder', { id: folderId })
        this.updateSyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Add item to sync queue
   */
  private static async addToSyncQueue(type: string, data: any): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE)
      const request = store.add({
        type,
        data,
        timestamp: new Date()
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Get sync queue
   */
  static async getSyncQueue(): Promise<any[]> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readonly')
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Clear sync queue
   */
  static async clearSyncQueue(): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE)
      const request = store.clear()

      request.onsuccess = () => {
        this.updateSyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Sync offline data with server
   */
  static async syncWithServer(): Promise<void> {
    if (!this.syncStatus.isOnline || this.syncStatus.syncInProgress) return

    this.syncStatus.syncInProgress = true
    this.updateSyncStatus()

    try {
      const syncQueue = await this.getSyncQueue()
      
      for (const item of syncQueue) {
        try {
          await this.syncItem(item)
          await this.removeFromSyncQueue(item.id)
        } catch (error) {
          console.error('Failed to sync item:', error)
        }
      }

      this.syncStatus.lastSync = new Date()
      this.syncStatus.pendingItems = 0
    } catch (error) {
      console.error('Sync failed:', error)
    } finally {
      this.syncStatus.syncInProgress = false
      this.updateSyncStatus()
    }
  }

  /**
   * Sync individual item
   */
  private static async syncItem(item: any): Promise<void> {
    const { type, data } = item

    switch (type) {
      case 'note':
        await this.syncNote(data)
        break
      case 'folder':
        await this.syncFolder(data)
        break
      case 'delete_note':
        await this.syncDeleteNote(data.id)
        break
      case 'delete_folder':
        await this.syncDeleteFolder(data.id)
        break
    }
  }

  /**
   * Sync note with server
   */
  private static async syncNote(note: OfflineNote): Promise<void> {
    const response = await fetch(`/api/notes/${note.id}`, {
      method: note.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(note)
    })

    if (!response.ok) {
      throw new Error('Failed to sync note')
    }

    // Update local storage
    const updatedNote = await response.json()
    await this.updateNoteInStorage(updatedNote)
  }

  /**
   * Sync folder with server
   */
  private static async syncFolder(folder: OfflineFolder): Promise<void> {
    const response = await fetch(`/api/folders/${folder.id}`, {
      method: folder.id ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(folder)
    })

    if (!response.ok) {
      throw new Error('Failed to sync folder')
    }

    // Update local storage
    const updatedFolder = await response.json()
    await this.updateFolderInStorage(updatedFolder)
  }

  /**
   * Sync note deletion with server
   */
  private static async syncDeleteNote(noteId: number): Promise<void> {
    const response = await fetch(`/api/notes/${noteId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete note')
    }
  }

  /**
   * Sync folder deletion with server
   */
  private static async syncDeleteFolder(folderId: number): Promise<void> {
    const response = await fetch(`/api/folders/${folderId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete folder')
    }
  }

  /**
   * Update note in storage
   */
  private static async updateNoteInStorage(note: Note): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.NOTES_STORE], 'readwrite')
      const store = transaction.objectStore(this.NOTES_STORE)
      const request = store.put({
        ...note,
        isOffline: false,
        lastSynced: new Date(),
        pendingSync: false
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update folder in storage
   */
  private static async updateFolderInStorage(folder: Folder): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.FOLDERS_STORE], 'readwrite')
      const store = transaction.objectStore(this.FOLDERS_STORE)
      const request = store.put({
        ...folder,
        isOffline: false,
        lastSynced: new Date(),
        pendingSync: false
      })

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Remove item from sync queue
   */
  private static async removeFromSyncQueue(itemId: number): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.SYNC_QUEUE_STORE], 'readwrite')
      const store = transaction.objectStore(this.SYNC_QUEUE_STORE)
      const request = store.delete(itemId)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  /**
   * Update sync status
   */
  private static async updateSyncStatus(): Promise<void> {
    const syncQueue = await this.getSyncQueue()
    this.syncStatus.pendingItems = syncQueue.length
    this.syncStatus.isOnline = navigator.onLine

    this.listeners.forEach(listener => listener(this.syncStatus))
  }

  /**
   * Subscribe to sync status changes
   */
  static subscribeToSyncStatus(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  /**
   * Get current sync status
   */
  static getSyncStatus(): SyncStatus {
    return { ...this.syncStatus }
  }

  /**
   * Set up online/offline listeners
   */
  static setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.syncStatus.isOnline = true
      this.updateSyncStatus()
      this.syncWithServer()
    })

    window.addEventListener('offline', () => {
      this.syncStatus.isOnline = false
      this.updateSyncStatus()
    })
  }

  /**
   * Clear all offline data
   */
  static async clearAllData(): Promise<void> {
    if (!this.db) await this.initialize()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([
        this.NOTES_STORE,
        this.FOLDERS_STORE,
        this.SYNC_QUEUE_STORE
      ], 'readwrite')

      const notesStore = transaction.objectStore(this.NOTES_STORE)
      const foldersStore = transaction.objectStore(this.FOLDERS_STORE)
      const syncStore = transaction.objectStore(this.SYNC_QUEUE_STORE)

      Promise.all([
        new Promise((res, rej) => {
          const req = notesStore.clear()
          req.onsuccess = () => res(undefined)
          req.onerror = () => rej(req.error)
        }),
        new Promise((res, rej) => {
          const req = foldersStore.clear()
          req.onsuccess = () => res(undefined)
          req.onerror = () => rej(req.error)
        }),
        new Promise((res, rej) => {
          const req = syncStore.clear()
          req.onsuccess = () => res(undefined)
          req.onerror = () => rej(req.error)
        })
      ]).then(() => {
        this.updateSyncStatus()
        resolve()
      }).catch(reject)
    })
  }
}
