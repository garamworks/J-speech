# Japanese Learning Flashcards

## Overview

This is a web-based Japanese learning flashcard application that integrates with Notion as a content management system. The application fetches flashcard data from Notion databases and presents them in an interactive web interface for language learning.

## System Architecture

### Frontend Architecture
- **Static Web Application**: Single HTML file with embedded CSS and JavaScript
- **Responsive Design**: Mobile-first approach with gradient backgrounds and card-based UI
- **Client-Side Rendering**: Fetches data from backend API and renders flashcards dynamically

### Backend Architecture
- **Node.js/Express Server**: Lightweight web server serving static files and API endpoints
- **RESTful API**: Single endpoint `/api/flashcards` for retrieving flashcard data
- **Notion Integration**: Uses official Notion JavaScript SDK for database operations

## Key Components

### 1. Web Server (`server.js`)
- Express.js application serving on configurable port (default 5000)
- Static file serving for frontend assets
- API endpoint for flashcard data retrieval
- Error handling and logging

### 2. Notion Integration (`notion.js`)
- Notion client initialization with authentication
- Database ID extraction from Notion URLs
- Flashcard data fetching from multiple Notion databases
- Support for both vocabulary and character image databases

### 3. Frontend Interface (`index.html`)
- Episode-based navigation system
- Flashcard display with flip animations
- Progress tracking and statistics
- Responsive design for mobile and desktop

### 4. Debug and Testing Tools
- `check-images.js`: Validates image database structure
- `debug-notion.js`: Tests database connectivity
- `test-databases.js`: Validates multiple database configurations

## Data Flow

1. **User Request**: Browser requests flashcards via `/api/flashcards`
2. **Server Processing**: Express server calls Notion integration functions
3. **Notion Query**: Application queries Notion databases using SDK
4. **Data Transformation**: Raw Notion data is processed into flashcard format
5. **Response**: Structured flashcard data returned to frontend
6. **Rendering**: Frontend displays flashcards with interactive features

## External Dependencies

### Core Dependencies
- **@notionhq/client**: Official Notion API client for database operations
- **express**: Web framework for Node.js backend

### Notion Integration
- **Authentication**: Uses Notion integration token (`GARAM_NOTION_SECRET`)
- **Database Access**: Connects to specific Notion databases by ID
- **Content Types**: Supports title, rich text, and file properties

## Deployment Strategy

### Environment Configuration
- **Port**: Configurable via `PORT` environment variable
- **Notion Secret**: Requires `GARAM_NOTION_SECRET` for API access
- **Database URLs**: Configurable Notion page URLs for different databases

### Production Considerations
- Server listens on all interfaces (`0.0.0.0`)
- Error handling for Notion API failures
- Static file serving for frontend assets
- CORS handling for API requests

## Changelog
- July 07, 2025. Initial setup
- July 07, 2025. Added TTS gender-based voice selection and speed adjustment (1.2x)
- July 07, 2025. Added mobile debug console and enhanced mobile TTS compatibility
- July 07, 2025. Implemented N1 vocabulary word modals with clickable words and image display
- July 07, 2025. Added PALM volume navigation header with arrow buttons and improved layout structure
- July 09, 2025. Implemented MP3 audio playbook from Notion database with TTS fallback
- July 09, 2025. Fixed multiple expression cards display issue with proper styling and click handlers
- July 09, 2025. Added MP3 audio preloading to eliminate speaker button delay

## User Preferences

Preferred communication style: Simple, everyday language.
Audio Settings: 
- Only play MP3 files from Notion database
- No browser TTS fallback when audio files are unavailable
- Visual feedback for audio playback status