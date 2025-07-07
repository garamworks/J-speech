const { Client } = require('@notionhq/client');

const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
});

async function debugExpressionCard(expressionCardId) {
    try {
        console.log('=== Debugging Expression Card ===');
        console.log('Expression Card ID:', expressionCardId);
        
        const response = await notion.pages.retrieve({
            page_id: expressionCardId
        });
        
        console.log('\n=== All Properties ===');
        Object.keys(response.properties).forEach(key => {
            console.log(`${key}:`, JSON.stringify(response.properties[key], null, 2));
        });
        
        console.log('\n=== Application Fields ===');
        for (let i = 1; i <= 5; i++) {
            const japaneseField = `응용${i}J`;
            const koreanField = `응용${i}K`;
            
            console.log(`\n--- Application ${i} ---`);
            console.log(`${japaneseField}:`, response.properties[japaneseField]);
            console.log(`${koreanField}:`, response.properties[koreanField]);
            
            if (response.properties[japaneseField]?.rich_text) {
                console.log(`${japaneseField} content:`, response.properties[japaneseField].rich_text.map(text => text.plain_text).join(''));
            }
            if (response.properties[koreanField]?.rich_text) {
                console.log(`${koreanField} content:`, response.properties[koreanField].rich_text.map(text => text.plain_text).join(''));
            }
        }
        
    } catch (error) {
        console.error('Error debugging expression card:', error);
    }
}

// Test with a known expression card ID
const testId = process.argv[2];
if (testId) {
    debugExpressionCard(testId);
} else {
    console.log('Usage: node debug-expression.js <expression-card-id>');
}