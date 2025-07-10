const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// Use the actual database ID from notion.js
const DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b";

async function debugNoSequenceEntries() {
    try {
        console.log('=== Debugging No Sequence Entries ===');
        console.log('Database ID:', DATABASE_ID);

        // Get all entries without sequence
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            filter: {
                property: '시퀀스',
                select: {
                    is_empty: true
                }
            }
        });

        console.log(`\nFound ${response.results.length} entries without sequence assignment`);
        
        // Show first few entries for analysis
        console.log('\n=== SAMPLE ENTRIES ===');
        response.results.slice(0, 10).forEach((page, index) => {
            const japanese = page.properties['일본어']?.rich_text?.[0]?.plain_text || '';
            const korean = page.properties['한국어']?.rich_text?.[0]?.plain_text || '';
            const order = page.properties['순서']?.number || 0;
            const status = page.properties['Status']?.status?.name || 'Unknown';
            
            console.log(`${index + 1}. 순서: ${order}, 상태: ${status}`);
            console.log(`   일본어: ${japanese}`);
            console.log(`   한국어: ${korean}`);
            console.log('');
        });

        // Group by order ranges to suggest sequence assignments
        const orderRanges = {
            '1-25': [],
            '26-50': [],
            '51-75': [],
            '76-100': [],
            '101+': []
        };

        response.results.forEach(page => {
            const order = page.properties['순서']?.number || 0;
            if (order >= 1 && order <= 25) {
                orderRanges['1-25'].push(page);
            } else if (order >= 26 && order <= 50) {
                orderRanges['26-50'].push(page);
            } else if (order >= 51 && order <= 75) {
                orderRanges['51-75'].push(page);
            } else if (order >= 76 && order <= 100) {
                orderRanges['76-100'].push(page);
            } else {
                orderRanges['101+'].push(page);
            }
        });

        console.log('\n=== ORDER DISTRIBUTION ===');
        Object.entries(orderRanges).forEach(([range, pages]) => {
            if (pages.length > 0) {
                console.log(`${range}: ${pages.length} entries`);
            }
        });

        // Suggest sequence assignments
        console.log('\n=== SUGGESTED SEQUENCE ASSIGNMENTS ===');
        if (orderRanges['1-25'].length > 0) {
            console.log(`Assign ${orderRanges['1-25'].length} entries (순서 1-25) to sequence #005`);
        }
        if (orderRanges['26-50'].length > 0) {
            console.log(`Assign ${orderRanges['26-50'].length} entries (순서 26-50) to sequence #006`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

debugNoSequenceEntries();