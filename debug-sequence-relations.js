const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// Database IDs
const DIALOGUE_DB_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b"; // Main dialogue database
const SEQUENCE_DB_ID = "228fe404-b3dc-8045-930e-f78bb8348f21"; // Sequence database

async function debugSequenceRelations() {
    try {
        console.log("=== Detailed Sequence Relations Analysis ===");
        
        // Get all sequences first
        console.log("\n1. Getting all sequences:");
        const allSequences = await notion.databases.query({
            database_id: SEQUENCE_DB_ID,
            page_size: 100
        });
        
        const sequencesMap = {};
        for (const seq of allSequences.results) {
            const sequenceNumber = seq.properties['시퀀스']?.title?.[0]?.plain_text;
            if (sequenceNumber) {
                sequencesMap[seq.id] = sequenceNumber;
                console.log(`- Sequence: ${sequenceNumber}, ID: ${seq.id}`);
            }
        }
        
        // Now get all dialogues and check their sequence relations
        console.log("\n2. Getting all dialogues and checking relations:");
        const allDialogues = await notion.databases.query({
            database_id: DIALOGUE_DB_ID,
            filter: {
                property: 'Status',
                status: {
                    equals: 'Done'
                }
            },
            page_size: 100
        });
        
        console.log(`Found ${allDialogues.results.length} completed dialogues`);
        
        // Analyze each dialogue
        const sequenceDialogues = {};
        for (const dialogue of allDialogues.results) {
            const sequenceRelations = dialogue.properties['PALM Sequence DB']?.relation || [];
            const localSequence = dialogue.properties['시퀀스']?.select?.name;
            const order = dialogue.properties['순서']?.number || 0;
            const japanese = dialogue.properties['일본어']?.rich_text?.[0]?.plain_text || 'N/A';
            
            console.log(`\n--- Dialogue: ${japanese.substring(0, 30)}... ---`);
            console.log(`  Local sequence property: ${localSequence}`);
            console.log(`  Order: ${order}`);
            console.log(`  Sequence relations count: ${sequenceRelations.length}`);
            
            if (sequenceRelations.length > 0) {
                for (const rel of sequenceRelations) {
                    const sequenceNumber = sequencesMap[rel.id];
                    console.log(`  - Connected to sequence: ${sequenceNumber} (ID: ${rel.id})`);
                    
                    // Use the connected sequence
                    if (sequenceNumber) {
                        if (!sequenceDialogues[sequenceNumber]) {
                            sequenceDialogues[sequenceNumber] = [];
                        }
                        sequenceDialogues[sequenceNumber].push({
                            japanese,
                            korean: dialogue.properties['한국어']?.rich_text?.[0]?.plain_text || 'N/A',
                            order,
                            dialogueId: dialogue.id
                        });
                    }
                }
            } else {
                console.log(`  - No sequence relations found`);
                // Use local sequence property as fallback
                if (localSequence) {
                    if (!sequenceDialogues[localSequence]) {
                        sequenceDialogues[localSequence] = [];
                    }
                    sequenceDialogues[localSequence].push({
                        japanese,
                        korean: dialogue.properties['한국어']?.rich_text?.[0]?.plain_text || 'N/A',
                        order,
                        dialogueId: dialogue.id
                    });
                }
            }
        }
        
        console.log("\n3. Final grouped dialogues by sequence:");
        Object.entries(sequenceDialogues).forEach(([seq, dialogues]) => {
            console.log(`\n--- Sequence ${seq} (${dialogues.length} dialogues) ---`);
            dialogues.sort((a, b) => a.order - b.order);
            dialogues.slice(0, 5).forEach((d, i) => {
                console.log(`  ${i+1}. [${d.order}] ${d.japanese.substring(0, 40)}...`);
            });
        });
        
    } catch (error) {
        console.error("Error debugging sequence relations:", error);
    }
}

// Run the debug
debugSequenceRelations();