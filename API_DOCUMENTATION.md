# Note App API Documentation

## Overview

The Note App API is built with FastAPI and provides comprehensive endpoints for note management, folder organization, and audio transcription. All endpoints return JSON responses and follow RESTful conventions.

## Base URL

```
http://localhost:8000/api
```

## Authentication

Currently, the API does not require authentication. In production, implement JWT or OAuth2 authentication.

## Response Format

All API responses follow this format:

```json
{
  "data": {}, // Response data
  "message": "Success", // Optional message
  "status": 200 // HTTP status code
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes:

- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `500 Internal Server Error` - Server error

## Endpoints

### Notes

#### Create Note
```http
POST /notes
```

**Request Body:**
```json
{
  "title": "My Note",
  "content": "Note content here",
  "folder_id": 1,
  "tags": ["work", "important"],
  "is_favorite": false
}
```

**Response:**
```json
{
  "id": 1,
  "title": "My Note",
  "content": "Note content here",
  "folder_id": 1,
  "folder_name": "Work",
  "tags": ["work", "important"],
  "is_favorite": false,
  "is_archived": false,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "word_count": 3,
  "char_count": 18
}
```

#### Get Notes
```http
GET /notes?skip=0&limit=100&folder_id=1&search=query&tags=tag1,tag2&is_favorite=true&is_archived=false
```

**Query Parameters:**
- `skip` (int): Number of notes to skip (default: 0)
- `limit` (int): Maximum number of notes to return (default: 100)
- `folder_id` (int): Filter by folder ID
- `search` (string): Search in title and content
- `tags` (string): Comma-separated list of tags
- `is_favorite` (boolean): Filter by favorite status
- `is_archived` (boolean): Filter by archived status

#### Get Note by ID
```http
GET /notes/{note_id}
```

#### Update Note
```http
PUT /notes/{note_id}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["updated", "tags"],
  "is_favorite": true,
  "is_archived": false
}
```

#### Delete Note
```http
DELETE /notes/{note_id}
```

#### Move Note
```http
POST /notes/{note_id}/move
```

**Request Body:**
```json
{
  "folder_id": 2
}
```

#### Copy Note
```http
POST /notes/{note_id}/copy
```

**Request Body:**
```json
{
  "folder_id": 2
}
```

#### Search Notes
```http
GET /notes/search/?q=search_query&folder_id=1
```

### Folders

#### Create Folder
```http
POST /folders
```

**Request Body:**
```json
{
  "name": "My Folder",
  "description": "Folder description",
  "parent_id": 1
}
```

#### Get Folders
```http
GET /folders?parent_id=1&include_children=false
```

#### Get Folder by ID
```http
GET /folders/{folder_id}
```

#### Update Folder
```http
PUT /folders/{folder_id}
```

#### Delete Folder
```http
DELETE /folders/{folder_id}?force=false
```

#### Get Folder Tree
```http
GET /folders/{folder_id}/tree
```

#### Get Folder Notes
```http
GET /folders/{folder_id}/notes?include_subfolders=false
```

### Transcription

#### Transcribe Audio
```http
POST /transcription/transcribe
```

**Request:** Multipart form data
- `file`: Audio file (WAV, MP3, M4A, OGG)
- `language`: Language code (default: "en-US")

**Response:**
```json
{
  "text": "Transcribed text here",
  "confidence": 0.95,
  "language": "en-US",
  "duration": 5.2
}
```

#### Transcribe and Create Note
```http
POST /transcription/transcribe-and-create-note
```

**Request:** Multipart form data
- `file`: Audio file
- `title`: Note title
- `folder_id`: Optional folder ID
- `language`: Language code

#### Transcribe and Update Note
```http
POST /transcription/transcribe-and-update-note/{note_id}
```

**Request:** Multipart form data
- `file`: Audio file
- `append`: Whether to append to existing content (default: true)
- `language`: Language code

#### Get Supported Languages
```http
GET /transcription/supported-languages
```

**Response:**
```json
{
  "languages": [
    {"code": "en-US", "name": "English (US)"},
    {"code": "es-ES", "name": "Spanish (Spain)"},
    {"code": "fr-FR", "name": "French (France)"}
  ]
}
```

## Data Models

### Note
```json
{
  "id": 1,
  "title": "string",
  "content": "string",
  "folder_id": 1,
  "folder_name": "string",
  "tags": ["string"],
  "is_favorite": false,
  "is_archived": false,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "word_count": 0,
  "char_count": 0
}
```

### Folder
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "parent_id": 1,
  "path": "string",
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z",
  "notes_count": 0,
  "children_count": 0
}
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, implement rate limiting to prevent abuse.

## CORS

CORS is enabled for the following origins:
- `http://localhost:3000`
- `http://localhost:8080`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:8080`

## File Upload Limits

- Maximum audio file size: 10MB
- Supported audio formats: WAV, MP3, M4A, OGG
- Maximum general file size: 50MB

## Interactive API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: `http://localhost:8000/api/docs`
- **ReDoc**: `http://localhost:8000/api/redoc`

## Example Usage

### Create a Note with cURL

```bash
curl -X POST "http://localhost:8000/api/notes" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Note",
    "content": "This is my first note in the app",
    "tags": ["personal", "first"],
    "is_favorite": false
  }'
```

### Search Notes with cURL

```bash
curl -X GET "http://localhost:8000/api/notes/search/?q=important&folder_id=1"
```

### Transcribe Audio with cURL

```bash
curl -X POST "http://localhost:8000/api/transcription/transcribe" \
  -F "file=@audio.wav" \
  -F "language=en-US"
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error - Server error |

## WebSocket Support

Currently, WebSocket support is not implemented. Future versions may include real-time features.

## Health Check

```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "message": "Note App API is running"
}
```
