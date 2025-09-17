# Note App - Modern Note Taking Application

A comprehensive note-taking web application built with Python FastAPI backend and React TypeScript frontend, featuring audio transcription, folder management, and mobile-responsive design.

## 🚀 Features

### Core Functionality
- **Create, Edit, Delete Notes** - Full CRUD operations for notes
- **Rich Text Support** - Markdown-style formatting and content editing
- **Folder Management** - Hierarchical folder organization with copy/move operations
- **Audio Transcription** - Voice-to-text functionality using speech recognition
- **Search & Filter** - Advanced search with real-time filtering
- **Tags System** - Organize notes with custom tags
- **Favorites & Archive** - Mark important notes and archive old ones

### User Experience
- **Modern UI** - Clean, intuitive interface with smooth animations
- **Mobile Responsive** - Optimized for both desktop and mobile devices
- **Real-time Updates** - Live search and instant feedback
- **Keyboard Shortcuts** - Ctrl+S to save, Esc to close, etc.
- **Dark/Light Theme** - Customizable appearance settings

### Technical Features
- **RESTful API** - Well-structured backend with FastAPI
- **Database ORM** - SQLAlchemy with SQLite/PostgreSQL support
- **Audio Processing** - Support for multiple audio formats
- **CORS Support** - Cross-origin resource sharing enabled
- **Error Handling** - Comprehensive error handling and user feedback

## 🏗️ Architecture

### Backend (Python/FastAPI)
```
backend/
├── app/
│   ├── api/           # API endpoints
│   ├── core/          # Configuration and database
│   ├── models/        # Database models
│   ├── services/      # Business logic
│   └── utils/         # Utility functions
├── tests/             # Test files
└── requirements.txt   # Python dependencies
```

### Frontend (React/TypeScript)
```
frontend/
├── src/
│   ├── components/    # React components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── styles/        # CSS and styling
│   └── utils/         # Utility functions
├── public/            # Static assets
└── package.json       # Node dependencies
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set environment variables:**
   ```bash
   # Create .env file
   echo "DATABASE_URL=sqlite:///./note_app.db" > .env
   echo "SECRET_KEY=your-secret-key-change-in-production" >> .env
   echo "DEBUG=True" >> .env
   ```

5. **Run the backend:**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set environment variables:**
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:8000/api" > .env
   ```

4. **Run the frontend:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 📱 Usage

### Creating Notes
1. Click "New Note" button or press `Ctrl+N`
2. Enter title and content
3. Add tags, select folder, or mark as favorite
4. Save with `Ctrl+S` or click Save button

### Voice Notes
1. Click "Voice Note" button
2. Allow microphone access
3. Click "Start Recording" and speak
4. Click "Stop Recording" when done
5. Click "Transcribe" to convert to text

### Folder Management
1. Click "New Folder" to create folders
2. Organize notes by moving them to folders
3. Use hierarchical structure for better organization
4. Copy or move notes between folders

### Search & Filter
1. Use the search bar to find notes by title or content
2. Filter by favorites, archived, or specific folders
3. Use tags to categorize and find related notes

## 🔧 Configuration

### Backend Configuration
Edit `backend/app/core/config.py` to customize:
- Database URL
- CORS origins
- File upload limits
- Audio processing settings

### Frontend Configuration
Edit `frontend/vite.config.ts` to customize:
- API endpoints
- Build settings
- Development server

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `npm run build`
2. Set production environment variables
3. Run backend with production WSGI server
4. Serve frontend with web server (nginx, Apache)

## 🔒 Security Features

- **Input Validation** - All inputs are validated and sanitized
- **CORS Protection** - Configured for specific origins
- **File Upload Limits** - Restricted file sizes and types
- **SQL Injection Protection** - Using ORM with parameterized queries
- **XSS Protection** - Content sanitization and CSP headers

## 🚀 Performance Optimizations

- **Database Indexing** - Optimized queries with proper indexes
- **Caching** - React Query for client-side caching
- **Lazy Loading** - Components loaded on demand
- **Image Optimization** - Compressed and optimized assets
- **Bundle Splitting** - Code splitting for faster loading

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API documentation at `/api/docs`

## 🔄 Version History

### v1.0.0
- Initial release
- Core note-taking functionality
- Audio transcription
- Folder management
- Mobile responsive design
- Modern UI with animations

## 🎯 Roadmap

- [ ] Real-time collaboration
- [ ] Cloud synchronization
- [ ] Mobile app (React Native)
- [ ] Plugin system
- [ ] Advanced search with AI
- [ ] Export to multiple formats
- [ ] Offline support with PWA

---

**Built with ❤️ using FastAPI, React, TypeScript, and Tailwind CSS**
# note-app
