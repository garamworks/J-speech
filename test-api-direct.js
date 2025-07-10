const { getFlashcardsFromNotion } = require('./notion.js');

async function testAPI() {
    try {
        console.log("Testing API directly...");
        const flashcards = await getFlashcardsFromNotion();
        console.log("API returned:", typeof flashcards);
        console.log("Keys:", Object.keys(flashcards));
        
        // Test specific sequence
        if (flashcards['#002']) {
            console.log(`#002 has ${flashcards['#002'].length} cards`);
            console.log("First card:", flashcards['#002'][0]);
        } else {
            console.log("#002 not found in flashcards");
        }
        
        return flashcards;
    } catch (error) {
        console.error("Error in direct test:", error);
        throw error;
    }
}

testAPI();