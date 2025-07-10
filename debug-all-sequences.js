const { Client } = require('@notionhq/client');

// Initialize the client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// Extract database ID from URL
function extractDatabaseIdFromUrl(pageUrl) {
    const match = pageUrl.match(/([a-f0-9]{32})/);
    return match ? match[1] : null;
}

// Use the actual database ID from notion.js
const DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b";

async function debugAllSequences() {
    try {
        console.log('=== Debugging All Sequences ===');
        console.log('Database ID:', DATABASE_ID);
        
        // Get all entries without status filter
        let allResults = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: startCursor,
                page_size: 100
                // No filter - get all entries
            });
            
            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log('\n=== ALL ENTRIES ===');
        console.log('Total entries found:', allResults.length);
        
        // Group by sequence and status
        const sequenceGroups = {};
        const statusCount = {};
        
        allResults.forEach(page => {
            const sequence = page.properties['시퀀스']?.select?.name || 'No Sequence';
            const status = page.properties['Status']?.status?.name || 'No Status';
            const japanese = page.properties['일본어']?.rich_text?.[0]?.plain_text || '';
            const order = page.properties['순서']?.number || 0;
            
            if (!sequenceGroups[sequence]) {
                sequenceGroups[sequence] = {};
            }
            
            if (!sequenceGroups[sequence][status]) {
                sequenceGroups[sequence][status] = [];
            }
            
            sequenceGroups[sequence][status].push({
                japanese: japanese.substring(0, 50) + (japanese.length > 50 ? '...' : ''),
                order: order
            });
            
            statusCount[status] = (statusCount[status] || 0) + 1;
        });

        console.log('\n=== STATUS DISTRIBUTION ===');
        Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`${status}: ${count} entries`);
        });

        console.log('\n=== SEQUENCE BREAKDOWN ===');
        Object.keys(sequenceGroups).sort().forEach(sequence => {
            console.log(`\n--- ${sequence} ---`);
            Object.entries(sequenceGroups[sequence]).forEach(([status, entries]) => {
                console.log(`  ${status}: ${entries.length} entries`);
                if (entries.length > 0 && entries.length <= 5) {
                    entries.sort((a, b) => a.order - b.order).forEach(entry => {
                        console.log(`    Order ${entry.order}: ${entry.japanese}`);
                    });
                }
            });
        });

        console.log('\n=== SEQUENCES WITH DONE STATUS ===');
        Object.keys(sequenceGroups).sort().forEach(sequence => {
            if (sequenceGroups[sequence]['Done']) {
                console.log(`${sequence}: ${sequenceGroups[sequence]['Done'].length} Done entries`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Run the debug
debugAllSequences();