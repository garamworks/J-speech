const { Client } = require("@notionhq/client");

// Initialize Notion client
const notion = new Client({
    auth: process.env.GARAM_NOTION_SECRET,
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
const NEW_DATABASE_URL = "https://www.notion.so/doungle/228fe404b3dc80f0a0c0d83aaa28aa9b?v=229fe404b3dc80399a0f000c451a5e3a&source=copy_link";
const DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b";
// Character database ID
const CHARACTER_DATABASE_ID = "229fe404-b3dc-80ec-830c-e619a046cf3a";

// Get database info by ID
async function getNotionDatabases() {
    const databases = [];

    try {
        // Get the main database info
        const databaseInfo = await notion.databases.retrieve({
            database_id: DATABASE_ID,
        });
        databases.push(databaseInfo);
        
        // Also try to get character database info
        try {
            const characterDatabaseInfo = await notion.databases.retrieve({
                database_id: CHARACTER_DATABASE_ID,
            });
            databases.push(characterDatabaseInfo);
        } catch (error) {
            console.log('Character database not accessible:', error.message);
        }
        
        return databases;
    } catch (error) {
        console.error('Error retrieving databases:', error);
        return [];
    }
}

// Get character data from the character database
async function getCharacterData() {
    try {
        const response = await notion.databases.query({
            database_id: CHARACTER_DATABASE_ID,
        });

        const characterMap = {};
        response.results.forEach(page => {
            const name = page.properties.Name?.title?.[0]?.plain_text;
            const imageFile = page.properties.face?.files?.[0];
            
            if (name && imageFile) {
                const imageUrl = imageFile.type === 'external' ? 
                    imageFile.external.url : imageFile.file.url;
                characterMap[name] = {
                    imageUrl: imageUrl,
                    emoji: getCharacterEmoji(name)
                };
            }
        });

        return characterMap;
    } catch (error) {
        console.error("Error fetching character data:", error);
        return {};
    }
}

// Get emoji for character
function getCharacterEmoji(characterName) {
    const emojiMap = {
        '남자1': '👨',
        '번즈': '🔥',
        '일라이저': '👩',
        '허브': '🌿',
        'default': '🎭'
    };
    return emojiMap[characterName] || emojiMap.default;
}

// Get flashcard data from Notion database
async function getFlashcardsFromNotion() {
    try {
        // Get all dialogue data with pagination
        let allResults = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: startCursor,
                page_size: 100
            });
            
            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        // Get character data
        const characterData = await getCharacterData();
        
        // Get all character relations
        const characterRelations = {};
        for (const page of allResults) {
            const characterRelation = page.properties['사람']?.relation?.[0]?.id;
            if (characterRelation && !characterRelations[characterRelation]) {
                try {
                    const characterPage = await notion.pages.retrieve({ page_id: characterRelation });
                    const characterName = characterPage.properties.Name?.title?.[0]?.plain_text;
                    characterRelations[characterRelation] = characterName;
                } catch (error) {
                    console.log('Could not fetch character relation:', characterRelation);
                }
            }
        }

        if (allResults.length === 0) {
            throw new Error("No data found in the Notion database");
        }

        // Sort by sentence ID to ensure proper episode and sentence order
        const sortedResults = allResults.sort((a, b) => {
            const sentenceIdA = a.properties['문장 ID']?.title?.[0]?.plain_text || "99-999";
            const sentenceIdB = b.properties['문장 ID']?.title?.[0]?.plain_text || "99-999";
            
            // Parse episode and sentence numbers for proper sorting
            const parseId = (id) => {
                const match = id.match(/^(\d+)-(\d+)$/);
                if (match) {
                    return { episode: parseInt(match[1]), sentence: parseInt(match[2]) };
                }
                return { episode: 99, sentence: 999 };
            };
            
            const parsedA = parseId(sentenceIdA);
            const parsedB = parseId(sentenceIdB);
            
            // Sort by episode first, then by sentence number
            if (parsedA.episode !== parsedB.episode) {
                return parsedA.episode - parsedB.episode;
            }
            return parsedA.sentence - parsedB.sentence;
        });

        // Helper functions
        const getTextContent = (prop) => {
            if (prop?.rich_text && prop.rich_text.length > 0) {
                return prop.rich_text[0].plain_text || "";
            }
            if (prop?.title && prop.title.length > 0) {
                return prop.title[0].plain_text || "";
            }
            return "";
        };

        return sortedResults.filter((page) => {
            // Filter out empty entries
            const properties = page.properties;
            const japanese = getTextContent(properties['일본어']);
            const korean = getTextContent(properties['한국어']);
            return japanese.trim() !== '' && korean.trim() !== '';
        }).map((page) => {
            const properties = page.properties;

            // Map the actual column names from the new database
            const japanese = getTextContent(properties['일본어']);  // Japanese sentence
            const korean = getTextContent(properties['한국어']);  // Korean translation
            const sentenceId = getTextContent(properties['']);  // Title field (empty name)
            const n2Word = getTextContent(properties['N2 단어']);  // N2 vocabulary word
            const sequenceNumber = properties['순서']?.number || 0;  // Sequence number
            const volume = properties['권']?.select?.name || '';  // Volume
            const sequence = properties['시퀀스']?.select?.name || '';  // Sequence
            const episode = "1화";  // Default episode
            
            // Get character info from relation
            const characterRelation = properties['사람']?.relation?.[0]?.id;
            const characterName = characterRelations[characterRelation];
            const characterInfo = characterName ? characterData[characterName] : null;

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
                character: characterInfo?.emoji || characterEmojis.default,
                characterImage: characterInfo?.imageUrl || null,
                gender: null,
                romanji: sentenceId || `${sequenceNumber}` || `${index + 1}`,
                speaker: characterName || n2Word || "학습자료",
                episode: episode,
                volume: volume,
                sequence: sequence
            };
        });
    } catch (error) {
        console.error("Error fetching flashcards from Notion:", error);
        throw error;
    }
}

module.exports = { getFlashcardsFromNotion, getNotionDatabases };