const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// Database IDs
const DIALOGUE_DB_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b"; // Main dialogue database
const SEQUENCE_DB_ID = "228fe404-b3dc-8045-930e-f78bb8348f21"; // Sequence database

async function debugConnectedDatabases() {
    try {
        console.log("=== Analyzing Connected Database Structure ===");
        
        // First, check the sequence database
        console.log("\n1. Checking Sequence Database:");
        const sequenceResponse = await notion.databases.query({
            database_id: SEQUENCE_DB_ID,
            page_size: 10
        });
        
        console.log(`Found ${sequenceResponse.results.length} sequences`);
        
        const sequences = {};
        for (const seq of sequenceResponse.results) {
            console.log(`\n=== Processing Sequence Entry ===`);
            console.log(`Sequence ID: ${seq.id}`);
            console.log(`All properties:`, Object.keys(seq.properties));
            
            // Try different property names
            const sequenceNumber = seq.properties['시퀀스']?.title?.[0]?.plain_text || 
                                  seq.properties['Name']?.title?.[0]?.plain_text ||
                                  seq.properties['시퀀스 제목']?.rich_text?.[0]?.plain_text;
            
            console.log(`Found sequence number: ${sequenceNumber}`);
            
            if (sequenceNumber) {
                sequences[seq.id] = sequenceNumber;
                console.log(`✓ Mapped: ${sequenceNumber} -> ${seq.id}`);
            }
        }
        
        console.log("\n=== Sequence Database Structure ===");
        console.log("Available properties:", Object.keys(sequenceResponse.results[0]?.properties || {}));
        
        // Now check the dialogue database and see how it connects
        console.log("\n2. Checking Dialogue Database:");
        const dialogueResponse = await notion.databases.query({
            database_id: DIALOGUE_DB_ID,
            filter: {
                property: 'Status',
                status: {
                    equals: 'Done'
                }
            },
            page_size: 10
        });
        
        console.log(`Found ${dialogueResponse.results.length} completed dialogues`);
        
        console.log("\n=== Dialogue Database Structure ===");
        if (dialogueResponse.results.length > 0) {
            console.log("Available properties:", Object.keys(dialogueResponse.results[0]?.properties || {}));
        }
        
        // Group by sequence connection
        const sequenceGroups = {};
        for (const dialogue of dialogueResponse.results) {
            const sequenceRelationId = dialogue.properties['PALM Sequence DB']?.relation?.[0]?.id;
            const sequenceNumber = sequences[sequenceRelationId] || 'Unknown';
            
            console.log(`Dialogue: ${dialogue.properties['일본어']?.rich_text?.[0]?.plain_text || 'N/A'}`);
            console.log(`  - Sequence Relation ID: ${sequenceRelationId || 'None'}`);
            console.log(`  - Mapped to sequence: ${sequenceNumber}`);
            
            if (!sequenceGroups[sequenceNumber]) {
                sequenceGroups[sequenceNumber] = [];
            }
            
            sequenceGroups[sequenceNumber].push({
                japanese: dialogue.properties['일본어']?.rich_text?.[0]?.plain_text || 'N/A',
                korean: dialogue.properties['한국어']?.rich_text?.[0]?.plain_text || 'N/A',
                order: dialogue.properties['순서']?.number || 0,
                sequence: dialogue.properties['시퀀스']?.select?.name || 'N/A'
            });
        }
        
        console.log("\n3. Dialogue Groups by Sequence:");
        Object.entries(sequenceGroups).forEach(([seq, dialogues]) => {
            console.log(`\n--- Sequence ${seq} (${dialogues.length} dialogues) ---`);
            dialogues.sort((a, b) => a.order - b.order);
            dialogues.slice(0, 3).forEach((d, i) => {
                console.log(`  ${i+1}. [${d.order}] ${d.japanese} -> ${d.korean}`);
            });
        });
        
        // Check for discrepancies
        console.log("\n4. Checking for Data Consistency:");
        for (const dialogue of dialogueResponse.results) {
            const sequenceRelationId = dialogue.properties['PALM Sequence DB']?.relation?.[0]?.id;
            const sequenceFromRelation = sequences[sequenceRelationId];
            const sequenceFromProperty = dialogue.properties['시퀀스']?.select?.name;
            
            if (sequenceFromRelation && sequenceFromProperty && sequenceFromRelation !== sequenceFromProperty) {
                console.log(`⚠️  Mismatch found:`);
                console.log(`   Relation points to: ${sequenceFromRelation}`);
                console.log(`   Property shows: ${sequenceFromProperty}`);
                console.log(`   Dialogue: ${dialogue.properties['일본어']?.rich_text?.[0]?.plain_text || 'N/A'}`);
            }
        }
        
    } catch (error) {
        console.error("Error debugging connected databases:", error);
    }
}

// Run the debug
debugConnectedDatabases();