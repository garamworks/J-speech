const { notion } = require('./notion.js');

function extractDatabaseIdFromUrl(pageUrl) {
    // Extract database ID from Notion URL
    const match = pageUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (match && match[1]) {
        return match[1];
    }
    
    // Try without dashes
    const match2 = pageUrl.match(/([a-f0-9]{32})/i);
    if (match2 && match2[1]) {
        return match2[1];
    }
    
    throw new Error('Could not extract database ID from URL');
}

async function debugAudioMismatch() {
    try {
        console.log('=== Debug Audio Mismatch ===');
        
        // Get all flashcard data from Notion
        const flashcardUrl = 'https://www.notion.so/palm-231fe404b3dc809c9a82ce7b2f4b4c4a';
        const flashcardDbId = extractDatabaseIdFromUrl(flashcardUrl);
        
        console.log('Flashcard database ID:', flashcardDbId);
        
        // Fetch flashcard data
        const response = await notion.databases.query({
            database_id: flashcardDbId,
            sorts: [
                {
                    property: 'sequence',
                    direction: 'ascending',
                },
                {
                    property: 'romanji',
                    direction: 'ascending',
                }
            ]
        });
        
        console.log('Total cards found:', response.results.length);
        
        // Group by sequence
        const sequenceData = {};
        response.results.forEach((page, index) => {
            const properties = page.properties;
            
            const sequence = properties.sequence?.title?.[0]?.plain_text || '#001';
            const romanji = properties.romanji?.number || (index + 1);
            const japanese = properties.japanese?.rich_text?.[0]?.plain_text || 'No Japanese text';
            
            // Get audio file URL
            let audioUrl = null;
            if (properties.mp3file?.files?.[0]?.file?.url) {
                audioUrl = properties.mp3file.files[0].file.url;
            }
            
            if (!sequenceData[sequence]) {
                sequenceData[sequence] = [];
            }
            
            sequenceData[sequence].push({
                index: romanji,
                japanese,
                audioUrl,
                notionId: page.id
            });
        });
        
        // Check first 4 cards of each sequence
        Object.keys(sequenceData).sort().forEach(sequence => {
            console.log(`\n=== Sequence: ${sequence} ===`);
            const cards = sequenceData[sequence].sort((a, b) => a.index - b.index);
            
            cards.slice(0, 4).forEach((card, cardIndex) => {
                console.log(`Card ${cardIndex + 1} (index ${card.index}):`);
                console.log(`  Japanese: ${card.japanese}`);
                console.log(`  Audio URL: ${card.audioUrl ? 'Present' : 'Missing'}`);
                if (card.audioUrl) {
                    console.log(`  Audio file: ${card.audioUrl.split('/').pop()}`);
                }
                console.log(`  Notion ID: ${card.notionId}`);
            });
        });
        
        // Check for potential audio URL patterns
        console.log('\n=== Audio URL Analysis ===');
        const allCards = Object.values(sequenceData).flat();
        const audioCards = allCards.filter(card => card.audioUrl);
        
        console.log('Total cards with audio:', audioCards.length);
        console.log('Total cards:', allCards.length);
        
        // Check if audio URLs contain any identifiable patterns
        const audioPatterns = {};
        audioCards.forEach(card => {
            if (card.audioUrl) {
                const filename = card.audioUrl.split('/').pop();
                const pattern = filename.replace(/\.mp3$/, '');
                
                if (!audioPatterns[pattern]) {
                    audioPatterns[pattern] = [];
                }
                audioPatterns[pattern].push({
                    japanese: card.japanese,
                    sequence: Object.keys(sequenceData).find(seq => 
                        sequenceData[seq].some(c => c.notionId === card.notionId)
                    )
                });
            }
        });
        
        console.log('\nAudio filename patterns:');
        Object.keys(audioPatterns).slice(0, 10).forEach(pattern => {
            console.log(`  ${pattern}: ${audioPatterns[pattern][0].japanese}`);
        });
        
    } catch (error) {
        console.error('Error debugging audio mismatch:', error);
    }
}

// Run the debug
debugAudioMismatch().then(() => {
    console.log('\n=== Debug completed ===');
    process.exit(0);
}).catch(error => {
    console.error('Debug failed:', error);
    process.exit(1);
});