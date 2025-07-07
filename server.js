const express = require('express');
const path = require('path');
const { getFlashcardsFromNotion, getNotionDatabases } = require('./notion.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static('.'));

// API endpoint to get flashcards from Notion
app.get('/api/flashcards', async (req, res) => {
    try {
        const flashcards = await getFlashcardsFromNotion();
        res.json(flashcards);
    } catch (error) {
        console.error('Error fetching flashcards:', error);
        res.status(500).json({ 
            error: 'Failed to fetch flashcards from Notion',
            message: error.message 
        });
    }
});

// API endpoint to get database info
app.get('/api/database-info', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching database info:', error);
        res.json({ title: null, id: null });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});