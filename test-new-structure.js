const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// The new database ID from the URL
const DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b";

async function testNewStructure() {
    try {
        console.log("=== Testing new connected database structure ===");
        
        // Get entries with Status = Done
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: 'Status',
                status: {
                    equals: 'Done'
                }
            },
            page_size: 10
        });
        
        console.log(`Found ${response.results.length} completed entries`);
        
        // Show sample entries
        for (let i = 0; i < Math.min(3, response.results.length); i++) {
            const page = response.results[i];
            console.log(`\n--- Entry ${i + 1} ---`);
            console.log("Japanese:", page.properties['일본어']?.rich_text?.[0]?.plain_text || 'N/A');
            console.log("Korean:", page.properties['한국어']?.rich_text?.[0]?.plain_text || 'N/A');
            console.log("Sequence:", page.properties['시퀀스']?.select?.name || 'N/A');
            console.log("Order:", page.properties['순서']?.number || 'N/A');
            console.log("Volume:", page.properties['권']?.select?.name || 'N/A');
            console.log("Has Character:", page.properties['사람']?.relation?.length > 0);
            console.log("Has Sequence DB:", page.properties['PALM Sequence DB']?.relation?.length > 0);
            console.log("Has Expression Cards:", page.properties['일본어 표현카드']?.relation?.length > 0);
            console.log("Has N1 Vocabulary:", page.properties['일본어 단어공부 N1']?.relation?.length > 0);
            console.log("Has MP3 file:", page.properties['mp3file']?.files?.length > 0);
        }
        
        // Test if we can group by sequence
        const sequenceGroups = {};
        response.results.forEach(page => {
            const sequence = page.properties['시퀀스']?.select?.name || 'Unknown';
            if (!sequenceGroups[sequence]) {
                sequenceGroups[sequence] = 0;
            }
            sequenceGroups[sequence]++;
        });
        
        console.log("\n=== Sequence Groups ===");
        Object.entries(sequenceGroups).forEach(([seq, count]) => {
            console.log(`${seq}: ${count} entries`);
        });
        
    } catch (error) {
        console.error("Error testing new structure:", error);
    }
}

// Run the test
testNewStructure();