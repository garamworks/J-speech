const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

async function testDatabase(databaseId, label) {
    try {
        console.log(`\n=== ${label} ===`);
        console.log(`Database ID: ${databaseId}`);
        
        const database = await notion.databases.retrieve({
            database_id: databaseId,
        });
        
        console.log("Properties:");
        Object.keys(database.properties).forEach(key => {
            console.log(`- ${key}: ${database.properties[key].type}`);
        });
        
        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: 2,
        });
        
        console.log(`\nSample records (${response.results.length} shown):`);
        response.results.forEach((page, index) => {
            console.log(`\nRecord ${index + 1}:`);
            Object.keys(page.properties).forEach(key => {
                const prop = page.properties[key];
                if (prop.type === 'title' && prop.title.length > 0) {
                    console.log(`  ${key}: "${prop.title[0].plain_text}"`);
                } else if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
                    console.log(`  ${key}: "${prop.rich_text[0].plain_text}"`);
                }
            });
        });
        
    } catch (error) {
        console.log(`Error with ${label}: ${error.message}`);
    }
}

async function main() {
    const originalId = "218fe404b3dc8019ba05cd4635a94446";  // From your original link
    const currentId = process.env.NOTION_PAGE_URL.match(/([a-f0-9]{32})/i)[1];  // From environment
    
    await testDatabase(originalId, "Original Database (from your link)");
    await testDatabase(currentId, "Current Environment Database");
}

main();