import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Types
export interface Note {
  id: number
  title: string
  content?: string
  folder_id?: number
  folder_name?: string
  tags: string[]
  is_favorite: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
  word_count: number
  char_count: number
}

export interface Folder {
  id: number
  name: string
  description?: string
  parent_id?: number
  path: string
  created_at: string
  updated_at: string
  notes_count: number
  children_count: number
}

export interface NoteCreate {
  title: string
  content?: string
  folder_id?: number
  tags?: string[]
  is_favorite?: boolean
}

export interface NoteUpdate {
  title?: string
  content?: string
  folder_id?: number
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

export interface FolderCreate {
  name: string
  description?: string
  parent_id?: number
}

export interface FolderUpdate {
  name?: string
  description?: string
  parent_id?: number
}

export interface TranscriptionResponse {
  text: string
  confidence?: number
  language?: string
  duration?: number
}

// Notes API
export const notesApi = {
  getNotes: (params?: {
    skip?: number
    limit?: number
    folder_id?: number
    search?: string
    tags?: string
    is_favorite?: boolean
    is_archived?: boolean
  }) => axiosInstance.get<Note[]>('/notes', { params }),

  getNote: (id: number) => axiosInstance.get<Note>(`/notes/${id}`),

  createNote: (data: NoteCreate) => axiosInstance.post<Note>('/notes', data),

  updateNote: (id: number, data: NoteUpdate) => axiosInstance.put<Note>(`/notes/${id}`, data),

  deleteNote: (id: number) => axiosInstance.delete(`/notes/${id}`),

  moveNote: (id: number, folder_id?: number) => axiosInstance.post(`/notes/${id}/move`, { folder_id }),

  copyNote: (id: number, folder_id?: number) => axiosInstance.post(`/notes/${id}/copy`, { folder_id }),

  searchNotes: (query: string) => axiosInstance.get<Note[]>(`/notes/search/?q=${encodeURIComponent(query)}`),
}

// Folders API
export const foldersApi = {
  getFolders: (params?: {
    parent_id?: number
    include_children?: boolean
  }) => axiosInstance.get<Folder[]>('/folders', { params }),

  getFolder: (id: number) => axiosInstance.get<Folder>(`/folders/${id}`),

  createFolder: (data: FolderCreate) => axiosInstance.post<Folder>('/folders', data),

  updateFolder: (id: number, data: FolderUpdate) => axiosInstance.put<Folder>(`/folders/${id}`, data),

  deleteFolder: (id: number, force?: boolean) => axiosInstance.delete(`/folders/${id}?force=${force || false}`),

  getFolderTree: (id: number) => axiosInstance.get<Folder[]>(`/folders/${id}/tree`),

  getFolderNotes: (id: number, include_subfolders?: boolean) => 
    axiosInstance.get<Note[]>(`/folders/${id}/notes?include_subfolders=${include_subfolders || false}`),
}

// Transcription API
export const transcriptionApi = {
  transcribeAudio: (file: File, language?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (language) formData.append('language', language)
    return axiosInstance.post<TranscriptionResponse>('/transcription/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  transcribeAndCreateNote: (file: File, title: string, folder_id?: number, language?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('title', title)
    if (folder_id) formData.append('folder_id', folder_id.toString())
    if (language) formData.append('language', language)
    return axiosInstance.post<{ transcription: TranscriptionResponse; note_id: number; note_title: string }>(
      '/transcription/transcribe-and-create-note',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  transcribeAndUpdateNote: (note_id: number, file: File, append?: boolean, language?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('append', (append || true).toString())
    if (language) formData.append('language', language)
    return axiosInstance.post<{ transcription: TranscriptionResponse; note_id: number; note_title: string }>(
      `/transcription/transcribe-and-update-note/${note_id}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  getSupportedLanguages: () => axiosInstance.get<{ languages: Array<{ code: string; name: string }> }>('/transcription/supported-languages'),
}

// Main API object
export const api = {
  notes: notesApi,
  folders: foldersApi,
  transcription: transcriptionApi,
  
  // Convenience methods
  getNotes: notesApi.getNotes,
  getNote: notesApi.getNote,
  createNote: notesApi.createNote,
  updateNote: notesApi.updateNote,
  deleteNote: notesApi.deleteNote,
  searchNotes: notesApi.searchNotes,
  
  getFolders: foldersApi.getFolders,
  getFolder: foldersApi.getFolder,
  createFolder: foldersApi.createFolder,
  updateFolder: foldersApi.updateFolder,
  deleteFolder: foldersApi.deleteFolder,
}

export default api
