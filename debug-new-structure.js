const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

// The new database ID from the URL
const NEW_DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b";

async function debugNewStructure() {
    try {
        console.log("=== Checking new database structure ===");
        
        // Get database info
        const databaseInfo = await notion.databases.retrieve({
            database_id: NEW_DATABASE_ID,
        });
        
        console.log("Database title:", databaseInfo.title);
        console.log("Database properties:", Object.keys(databaseInfo.properties));
        
        // Get a few sample entries
        const response = await notion.databases.query({
            database_id: NEW_DATABASE_ID,
            page_size: 5
        });
        
        console.log(`\nFound ${response.results.length} sample entries:`);
        
        response.results.forEach((page, index) => {
            console.log(`\n--- Entry ${index + 1} ---`);
            console.log("Page ID:", page.id);
            
            // Show all properties
            Object.entries(page.properties).forEach(([key, value]) => {
                console.log(`${key}:`, JSON.stringify(value, null, 2));
            });
        });
        
        // Check if this is a connected database by looking for relation properties
        const relationProperties = Object.entries(databaseInfo.properties).filter(([key, prop]) => 
            prop.type === 'relation'
        );
        
        if (relationProperties.length > 0) {
            console.log("\n=== Found relation properties (connected database) ===");
            relationProperties.forEach(([key, prop]) => {
                console.log(`${key}: connects to database ${prop.relation.database_id}`);
            });
        }
        
    } catch (error) {
        console.error("Error debugging new structure:", error);
    }
}

// Run the debug
debugNewStructure();