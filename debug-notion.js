const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

function extractDatabaseIdFromUrl(pageUrl) {
    const match = pageUrl.match(/([a-f0-9]{32})/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract database ID from URL");
}

// Original URL you provided: https://www.notion.so/doungle/218fe404b3dc8019ba05cd4635a94446?v=218fe404b3dc804ea201000c41003a6d&source=copy_link
// Current environment URL: process.env.NOTION_PAGE_URL
const ORIGINAL_DATABASE_ID = "218fe404b3dc8019ba05cd4635a94446";
const CURRENT_DATABASE_ID = extractDatabaseIdFromUrl(process.env.NOTION_PAGE_URL);

console.log("Original ID from your link:", ORIGINAL_DATABASE_ID);
console.log("Current environment ID:", CURRENT_DATABASE_ID);

async function debugNotionDatabase() {
    try {
        console.log("\n=== Testing Original Database ID ===");
        await testDatabase(ORIGINAL_DATABASE_ID);
        
        console.log("\n=== Testing Current Environment Database ID ===");
        await testDatabase(CURRENT_DATABASE_ID);
    } catch (error) {
        console.error("Error:", error);
    }
}

async function testDatabase(databaseId) {
    try {
        console.log("Testing Database ID:", databaseId);
        
        // First, get the database schema
        const database = await notion.databases.retrieve({
            database_id: DATABASE_ID,
        });
        
        console.log("Database properties:");
        Object.keys(database.properties).forEach(key => {
            const prop = database.properties[key];
            console.log(`- ${key}: ${prop.type}`);
        });
        
        // Get a few sample records
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
            page_size: 3,
        });
        
        console.log("\nSample records:");
        response.results.forEach((page, index) => {
            console.log(`\nRecord ${index + 1}:`);
            Object.keys(page.properties).forEach(key => {
                const prop = page.properties[key];
                console.log(`  ${key}:`, JSON.stringify(prop, null, 2));
            });
        });
        
    } catch (error) {
        console.error("Error:", error);
    }
}

debugNotionDatabase();