const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.NOTION_INTEGRATION_SECRET,
});

// Extract the database ID from the Notion URL
function extractDatabaseIdFromUrl(pageUrl) {
    // Handle both page URLs and database URLs
    const match = pageUrl.match(/([a-f0-9]{32})/i);
    if (match && match[1]) {
        return match[1];
    }
    throw Error("Failed to extract database ID from URL");
}

// Use the correct database ID for the dialogue data
const DATABASE_ID = "218fe404b3dc8019ba05cd4635a94446";

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
        // Query the database directly using the extracted ID
        const response = await notion.databases.query({
            database_id: DATABASE_ID,
        });

        if (response.results.length === 0) {
            throw new Error("No data found in the Notion database");
        }

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

            // Map the actual column names from the dialogue database
            const japanese = getTextContent(properties.문장);  // Japanese dialogue
            const korean = getTextContent(properties.한국어);  // Korean translation
            const speaker = getTextContent(properties.사람);  // Character name
            const time = getTextContent(properties.Time);  // Timestamp
            const episode = properties.ep?.select?.name || "1화";  // Episode number

            // Map character names to emojis
            const characterEmojis = {
                'ひなた': '🌻',
                'れい': '🦁', 
                'あかり': '🌸',
                'きりやま': '👤',
                'default': '🎭'
            };

            return {
                japanese: japanese || "대사 없음",
                korean: korean || "번역 없음", 
                character: characterEmojis[speaker] || characterEmojis.default,
                romanji: time || "",
                speaker: speaker || "unknown",
                episode: episode
            };
        });
    } catch (error) {
        console.error("Error fetching flashcards from Notion:", error);
        throw error;
    }
}

module.exports = { getFlashcardsFromNotion };