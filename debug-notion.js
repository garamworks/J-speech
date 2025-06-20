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

const DATABASE_ID = extractDatabaseIdFromUrl(process.env.NOTION_PAGE_URL);

async function debugNotionDatabase() {
    try {
        console.log("Database ID:", DATABASE_ID);
        
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