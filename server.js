const express = require('express');
const path = require('path');
const { getFlashcardsFromNotion, getNotionDatabases, getExpressionCardInfo, getN1VocabularyInfo } = require('./notion.js');

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

// API endpoint to get expression card info
app.get('/api/expression-card/:id', async (req, res) => {
    try {
        const expressionCardId = req.params.id;
        const cardInfo = await getExpressionCardInfo(expressionCardId);
        
        if (cardInfo) {
            res.json(cardInfo);
        } else {
            res.status(404).json({ error: 'Expression card not found' });
        }
    } catch (error) {
        console.error('Error fetching expression card info:', error);
        console.error('Expression card ID:', req.params.id);
        res.status(500).json({ error: 'Failed to fetch expression card info', message: error.message });
    }
});

// API endpoint to get N1 vocabulary info
app.get('/api/n1-vocabulary/:id', async (req, res) => {
    try {
        const n1VocabularyId = req.params.id;
        const vocabularyInfo = await getN1VocabularyInfo(n1VocabularyId);
        
        if (vocabularyInfo) {
            res.json(vocabularyInfo);
        } else {
            res.status(404).json({ error: 'N1 vocabulary not found' });
        }
    } catch (error) {
        console.error('Error fetching N1 vocabulary info:', error);
        res.status(500).json({ error: 'Failed to fetch N1 vocabulary info' });
    }
});

// API endpoint to get multiple N1 vocabulary info
app.get('/api/n1-vocabulary-multiple/:ids', async (req, res) => {
    try {
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
    } catch (error) {
        console.error('Error fetching multiple N1 vocabulary info:', error);
        res.status(500).json({ error: 'Failed to fetch N1 vocabulary info' });
    }
});

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});