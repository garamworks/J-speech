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

// Extract database ID from the new URL
const NEW_DATABASE_URL = "https://www.notion.so/doungle/218fe404b3dc80eb9941ed534568ead1?v=218fe404b3dc80238171000c9309f545&source=copy_link";
const DATABASE_ID = extractDatabaseIdFromUrl(NEW_DATABASE_URL);
// Character images database ID - will need to be updated based on the new workspace
const IMAGES_DATABASE_ID = "218fe404b3dc8059bdf1d40cf85d7e47";

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

// Get character images from the images database
async function getCharacterImages() {
    try {
        const response = await notion.databases.query({
            database_id: IMAGES_DATABASE_ID,
        });

        const imageMap = {};
        response.results.forEach(page => {
            const name = page.properties.Name?.title?.[0]?.plain_text;
            const imageFile = page.properties['Files & media']?.files?.[0];
            const gender = page.properties['성별']?.select?.name;
            
            if (name && imageFile) {
                const imageUrl = imageFile.type === 'external' ? 
                    imageFile.external.url : imageFile.file.url;
                imageMap[name] = {
                    imageUrl: imageUrl,
                    gender: gender
                };
            }
        });

        return imageMap;
    } catch (error) {
        console.error("Error fetching character images:", error);
        return {};
    }
}

// Get flashcard data from Notion database
async function getFlashcardsFromNotion() {
    try {
        // Get both dialogue data and character images
        const [dialogueResponse, characterImages] = await Promise.all([
            notion.databases.query({ database_id: DATABASE_ID }),
            getCharacterImages()
        ]);

        if (dialogueResponse.results.length === 0) {
            throw new Error("No data found in the Notion database");
        }

        // Sort by time field before mapping
        const sortedResults = dialogueResponse.results.sort((a, b) => {
            const timeA = a.properties.Time?.rich_text?.[0]?.plain_text || "00:00:00";
            const timeB = b.properties.Time?.rich_text?.[0]?.plain_text || "00:00:00";
            return timeA.localeCompare(timeB);
        });

        return sortedResults.map((page) => {
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

            // Map the actual column names from the new database
            const japanese = getTextContent(properties['일본어 문장']);  // Japanese sentence
            const korean = getTextContent(properties['한국어']);  // Korean translation
            const sentenceId = getTextContent(properties['문장 ID']);  // Sentence ID
            const n2Word = getTextContent(properties['N2 단어']);  // N2 vocabulary word
            const episode = "1화";  // Default episode

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
                character: characterEmojis.default,
                characterImage: null, // No character images in this database structure
                gender: null,
                romanji: sentenceId || "",
                speaker: n2Word || "학습자료",
                episode: episode
            };
        });
    } catch (error) {
        console.error("Error fetching flashcards from Notion:", error);
        throw error;
    }
}

module.exports = { getFlashcardsFromNotion };