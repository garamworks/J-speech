const express = require('express');
const path = require('path');
const { getFlashcardsFromNotion } = require('./notion.js');

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

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});