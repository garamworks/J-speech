const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the page ID from the Notion page URL
function extractPageIdFromUrl(pageUrl) {
    const match = pageUrl.match(/([a-f0-9]{32})(?:[?#]|$)/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract page ID");
}

const NOTION_PAGE_ID = extractPageIdFromUrl(process.env.NOTION_PAGE_URL);

// Get all child databases from the page
async function getNotionDatabases() {
    const childDatabases = [];

    try {
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await notion.blocks.children.list({
                block_id: NOTION_PAGE_ID,
                start_cursor: startCursor,
            });

            for (const block of response.results) {
                if (block.type === "child_database") {
                    const databaseId = block.id;

                    try {
                        const databaseInfo = await notion.databases.retrieve({
                            database_id: databaseId,
                        });
                        childDatabases.push(databaseInfo);
                    } catch (error) {
                        console.error(`Error retrieving database ${databaseId}:`, error);
                    }
                }
            }

            hasMore = response.has_more;
            startCursor = response.next_cursor || undefined;
        }

        return childDatabases;
    } catch (error) {
        console.error("Error listing child databases:", error);
        throw error;
    }
}

// Get flashcard data from Notion database
async function getFlashcardsFromNotion() {
    try {
        const databases = await getNotionDatabases();
        
        // Find the first database (assuming it's the flashcard database)
        if (databases.length === 0) {
            throw new Error("No databases found in the Notion page");
        }

        const database = databases[0];
        const response = await notion.databases.query({
            database_id: database.id,
        });

        return response.results.map((page) => {
            const properties = page.properties;
            
            // Extract text content from rich text properties
            const getTextContent = (prop) => {
                if (prop?.rich_text && prop.rich_text.length > 0) {
                    return prop.rich_text[0].plain_text || "";
                }
                if (prop?.title && prop.title.length > 0) {
                    return prop.title[0].plain_text || "";
                }
                return "";
            };

            // Extract select content
            const getSelectContent = (prop) => {
                return prop?.select?.name || "";
            };

            return {
                japanese: getTextContent(properties.Japanese || properties.일본어 || properties.jp),
                korean: getTextContent(properties.Korean || properties.한국어 || properties.kr),
                character: getSelectContent(properties.Character || properties.캐릭터 || properties.Speaker) || "👤",
                romanji: getTextContent(properties.Romanji || properties.로마지 || properties.romaji) || ""
            };
        });
    } catch (error) {
        console.error("Error fetching flashcards from Notion:", error);
        throw error;
    }
}

module.exports = { getFlashcardsFromNotion };