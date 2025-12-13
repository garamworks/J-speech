require('dotenv').config();
const express = require('express');
const path = require('path');
const { getFlashcardsFromNotion, getNotionDatabases, getExpressionCardInfo, getN1VocabularyInfo, getEpisodesFromNotion, getSequencesForBook } = require('./notion.js');
const { asyncHandler, errorMiddleware, notFoundHandler } = require('./utils/error-handler');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// API endpoint to get flashcards from Notion
app.get('/api/flashcards', asyncHandler(async (req, res) => {
    // Get episode parameter from query string
    const episodeSequence = req.query.episode;
    console.log('API request for flashcards, episode:', episodeSequence || 'all');

    const flashcards = await getFlashcardsFromNotion(episodeSequence);
    res.json(flashcards);
}));

// API endpoint to get database info
app.get('/api/database-info', asyncHandler(async (req, res) => {
    const databases = await getNotionDatabases();
    // Find the main database being used for flashcards
    const mainDb = databases.find(db => {
        const title = db.title && Array.isArray(db.title) && db.title.length > 0
            ? db.title[0]?.plain_text || ''
            : '';
        return title.includes('팜시리즈') || title.includes('대사') || title.includes('DB') ||
               title.includes('일본어') || title.includes('표현') || title.includes('대화');
    });

    if (mainDb) {
        const title = mainDb.title && Array.isArray(mainDb.title) && mainDb.title.length > 0
            ? mainDb.title[0]?.plain_text || 'Untitled Database'
            : 'Untitled Database';
        res.json({ title: title, id: mainDb.id });
    } else {
        res.json({ title: null, id: null });
    }
}));

// API endpoint to get expression card info
app.get('/api/expression/:id', asyncHandler(async (req, res) => {
    const expressionCardId = req.params.id;
    const cardInfo = await getExpressionCardInfo(expressionCardId);

    if (cardInfo) {
        res.json(cardInfo);
    } else {
        res.status(404).json({ error: 'Expression card not found' });
    }
}));

// API endpoint to get N1 vocabulary info
app.get('/api/n1-vocabulary/:id', asyncHandler(async (req, res) => {
    const n1VocabularyId = req.params.id;
    const vocabularyInfo = await getN1VocabularyInfo(n1VocabularyId);

    if (vocabularyInfo) {
        res.json(vocabularyInfo);
    } else {
        res.status(404).json({ error: 'N1 vocabulary not found' });
    }
}));

// API endpoint to get multiple N1 vocabulary info
app.get('/api/n1-vocabulary-multiple/:ids', asyncHandler(async (req, res) => {
    const n1VocabularyIds = req.params.ids.split(',');
    const vocabularyInfos = [];

    for (const id of n1VocabularyIds) {
        if (id.trim()) {
            try {
                const vocabularyInfo = await getN1VocabularyInfo(id.trim());
                if (vocabularyInfo) {
                    vocabularyInfos.push(vocabularyInfo);
                }
            } catch (error) {
                console.log(`Could not fetch N1 vocabulary ${id}:`, error.message);
            }
        }
    }

    res.json(vocabularyInfos);
}));

// API endpoint to get books for the main menu
app.get('/api/books', asyncHandler(async (req, res) => {
    const books = await getEpisodesFromNotion(); // This now returns books
    res.json(books);
}));

// API endpoint to get sequences for a specific book
app.get('/api/book/:bookId/sequences', asyncHandler(async (req, res) => {
    const bookId = req.params.bookId;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;
    const sequences = await getSequencesForBook(bookId, limit);
    res.json(sequences);
}));

// Legacy endpoint for backwards compatibility
app.get('/api/episodes', asyncHandler(async (req, res) => {
    const episodes = await getEpisodesFromNotion();
    res.json(episodes);
}));

// Serve static files
if (isProduction) {
    // In production, serve from dist directory
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    console.log(`Serving static files from: ${distPath}`);
} else {
    // In development, serve from root (for backwards compatibility)
    app.use(express.static('.'));

    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'episodes.html'));
    });

    app.get('/flashcards', (req, res) => {
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.get('/player', (req, res) => {
        res.sendFile(path.join(__dirname, 'player.html'));
    });

    app.get('/player.html', (req, res) => {
        res.sendFile(path.join(__dirname, 'player.html'));
    });
}

// Error handling middleware (must be last)
app.use(errorMiddleware);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});