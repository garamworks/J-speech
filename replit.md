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
- July 10, 2025. Reduced header spacing and added homepage navigation from episode view
- July 10, 2025. Reduced episode card padding and margins for better visual density
- July 10, 2025. Updated database structure to connected database system centered on sequences
- July 10, 2025. Enhanced UI elements: larger # symbols, reduced icon padding, circular episode icons
- July 10, 2025. Improved mobile flashcard sizing and expression card text readability
- July 10, 2025. Fixed error handling for unavailable sequences (004-006) with proper user feedback
- July 12, 2025. Added speaker buttons to episode thumbnails on homepage for sequence audio playback
- July 12, 2025. Implemented full sequence audio playback: Japanese MP3 → 3sec pause → Korean TTS
- July 12, 2025. Enhanced expression card layout to display horizontally with automatic line wrapping
- July 12, 2025. Fixed homepage sequence playback functionality with proper API response handling
- July 12, 2025. Added Korean MP3 audio support using mp3file_K field from Notion database
- July 12, 2025. Implemented auto-advancement from sequence 1 to sequence 2 when sequence playback completes
- July 12, 2025. Added dual speaker buttons to episode thumbnails: left side (gray background, white icon) and right side (white background, gray icon)
- July 12, 2025. Implemented advanced expression learning mode for left speaker button: plays dialogue + expressions + 5 example sentences with audio
- July 12, 2025. Optimized expression learning: removed expression title reading, reduced example delay to 2 seconds
- July 12, 2025. Improved loading performance: expressions load in background during playback instead of blocking start
- July 12, 2025. Added auto-advancement from sequence #001 to #002 for enhanced expression learning mode
- July 12, 2025. Created dedicated player page with play/pause controls and prev/next navigation
- July 12, 2025. Fixed player navigation: next/prev buttons now stop current audio and auto-start new card playback
- July 12, 2025. Added auto-advancement to next sequence when current sequence playback completes
- July 12, 2025. Enhanced player autoplay: works from homepage speaker buttons and sequence transitions
- July 12, 2025. Optimized loading performance: immediate first card playback with background loading of remaining cards
- July 12, 2025. Removed card top padding (0px) for cleaner, more compact flashcard display
- July 12, 2025. Enhanced player UI: removed back button, improved mobile button styling, moved mode selector to bottom
- July 12, 2025. Fixed player screen height to 80vh for better fit, reduced main content margins to 20px
- July 12, 2025. Reverted player control buttons back to simple Unicode symbols for clean white icon appearance
- July 12, 2025. Increased player screen height to 88vh (110% of original) for better fit
- July 12, 2025. Changed player control buttons to HTML entities for consistent mobile/PC icon display
- July 12, 2025. Separated thumbnail click area from speaker buttons on homepage to prevent accidental navigation
- July 13, 2025. Fixed player control buttons to bottom position with stable layout using flexbox bottom-controls wrapper
- July 13, 2025. Changed card display width from max-width constraint to full width for consistent layout
- July 13, 2025. Added sequence navigation arrows in player header for previous/next sequence navigation
- July 13, 2025. Enhanced expression learning mode to announce "표현" and read meaning field before examples
- July 13, 2025. Added expression card modal display during expression learning mode playback
- July 13, 2025. Converted all player control buttons to Font Awesome icons with white color styling
- July 13, 2025. Updated expression learning modal design to match main flashcard modal styling
- July 13, 2025. Updated sequence navigation arrows to Font Awesome icons without circular background
- July 13, 2025. Updated player navigation title font to match homepage thumbnail style (Fjalla One, normal weight)
- July 13, 2025. Changed player mode selector text from Korean to English (Basic, Expression)
- July 13, 2025. Updated mode selector buttons font to match navigation title (Fjalla One, normal weight)
- July 13, 2025. Adjusted player layout to use full viewport height for natural vertical fill
- July 13, 2025. Added margin spacing between progress counter and player control buttons
- July 13, 2025. Enhanced mode switching: Basic/Expression modes now auto-start playback when selected
- July 13, 2025. Fixed sequence navigation: Previous/Next sequence buttons now auto-start playback
- July 13, 2025. Increased mode selector button font size to 18px for better readability
- July 13, 2025. Updated progress counter font to Fjalla One for consistency with navigation styling
- July 13, 2025. Optimized mobile layout: reduced card size and margins to fit Basic/Expression buttons on screen
- July 13, 2025. Fixed mobile viewport height issue: used 100dvh to ensure proper fit within browser window
- July 13, 2025. Enhanced character image display: added circular border-radius and object-fit cover for consistent appearance
- July 13, 2025. Improved player character image: increased size from 70px to 90px and removed border for cleaner appearance
- July 13, 2025. Added mode selection icons: B (Basic) and E (Expression) circular icons on left/right sides of player card for quick mode switching
- July 13, 2025. Relocated mode icons to control area: moved B/E icons to left/right of prev/play/next buttons with Fjalla One font
- July 13, 2025. Removed Basic/Expression mode selector buttons and increased card height from 50vh to 60vh for better content display
- July 13, 2025. Updated B/E mode icons with purple gradient for active state, removed white borders, and adjusted inactive opacity
- July 13, 2025. Changed card content alignment from center to top, added padding to card top (20px) and character image margin (10px)
- July 13, 2025. Increased character image top margin from 10px to 20px for better spacing
- July 13, 2025. Replaced homepage speaker buttons with B/E mode buttons (Basic/Expression) using Fjalla One font
- July 13, 2025. Updated B button styling to match E button: white background with gray text (#555) for consistency
- July 13, 2025. Replaced main flashcard navigation with player-style header: PALM #001 format with left/right arrows for sequence navigation
- July 13, 2025. Added homepage navigation to sequence title: clicking PALM #001 returns to episode selection page
- July 13, 2025. Updated navigation icons to caret arrows in circular buttons and applied Fjalla One font to card counter
- July 13, 2025. Fixed expression card API endpoint calls from /api/expression-card/ to /api/expression/ to resolve JSON parsing errors
- July 13, 2025. Fixed db-connection-status visibility and increased word/expression icon area from 70% to 80% for better usability

## User Preferences

Preferred communication style: Simple, everyday language.
Audio Settings: 
- Only play MP3 files from Notion database for individual flashcards
- No browser TTS fallback when audio files are unavailable for flashcards
- Visual feedback for audio playback status
- Homepage sequence playback: Japanese MP3 → 3 second pause → Korean MP3 (with TTS fallback)
- Korean audio from mp3file_K field in Notion database
- Expression cards display horizontally with automatic line wrapping