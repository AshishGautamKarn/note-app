export interface Note {
  id: number
  title: string
  content: string
  folder_id: number | null
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
  created_at: string
  updated_at: string
}

export interface Folder {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  folder_id?: number | null
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

export interface UpdateNoteRequest {
  title?: string
  content?: string
  folder_id?: number | null
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

export interface CreateFolderRequest {
  name: string
}

export interface UpdateFolderRequest {
  name: string
}

export interface SearchNotesRequest {
  q: string
  folder_id?: number | null
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

export interface TranscriptionRequest {
  audio_file: File
  language?: string
}

export interface TranscriptionResponse {
  text: string
  language: string
  confidence: number
}

export interface SupportedLanguage {
  code: string
  name: string
  native_name: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
