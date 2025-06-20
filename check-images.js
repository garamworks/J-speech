const { Client } = require("@notionhq/client");

const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

async function checkImageDatabase() {
    try {
        const imageDbId = "218fe404b3dc8059bdf1d40cf85d7e47";
        console.log("Checking image database:", imageDbId);
        
        const database = await notion.databases.retrieve({
            database_id: imageDbId,
        });
        
        console.log("Properties:");
        Object.keys(database.properties).forEach(key => {
            console.log(`- ${key}: ${database.properties[key].type}`);
        });
        
        const response = await notion.databases.query({
            database_id: imageDbId,
            page_size: 5,
        });
        
        console.log(`\nFound ${response.results.length} records:`);
        response.results.forEach((page, index) => {
            console.log(`\nRecord ${index + 1}:`);
            Object.keys(page.properties).forEach(key => {
                const prop = page.properties[key];
                if (prop.type === 'title' && prop.title.length > 0) {
                    console.log(`  ${key}: "${prop.title[0].plain_text}"`);
                } else if (prop.type === 'rich_text' && prop.rich_text.length > 0) {
                    console.log(`  ${key}: "${prop.rich_text[0].plain_text}"`);
                } else if (prop.type === 'files' && prop.files.length > 0) {
                    console.log(`  ${key}: ${prop.files[0].type === 'external' ? prop.files[0].external.url : prop.files[0].file.url}`);
                }
            });
        });
        
    } catch (error) {
        console.error("Error:", error.message);
    }
}

checkImageDatabase();