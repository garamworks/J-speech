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
// Expression cards database ID (일본어 표현카드)
const EXPRESSION_CARDS_DATABASE_ID = "228fe404-b3dc-8014-a3f2-d401a86e4c41";
// N1 vocabulary database ID (일본어 단어공부 N1)
const N1_VOCABULARY_DATABASE_ID = "216fe404-b3dc-80e4-9e28-d68b149ce1bd";
// Episodes database ID (에피소드 목록)
const EPISODES_DATABASE_ID = "228fe404-b3dc-8045-930e-f78bb8348f21";

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
            const gender = page.properties.Gender?.select?.name;
            
            if (name && imageFile) {
                const imageUrl = imageFile.type === 'external' ? 
                    imageFile.external.url : imageFile.file.url;
                characterMap[name] = {
                    imageUrl: imageUrl,
                    emoji: getCharacterEmoji(name),
                    gender: gender
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

            // Get expression card relations (multiple possible)
            const expressionCardRelations = properties['일본어 표현카드']?.relation?.map(rel => rel.id) || [];

            // Get N1 vocabulary relations (multiple possible)
            const n1VocabularyRelations = properties['일본어 단어공부 N1']?.relation?.map(rel => rel.id) || [];

            // Map character names to emojis
            const characterEmojis = {
                'ひなた': '🌻',
                'れい': '🦁', 
                'あかり': '🌸',
                'きりやま': '👤',
                'default': '🎭'
            };

            // Get audio file URL from files property - try multiple possible field names
            let audioUrl = null;
            let audioFiles = [];
            
            // Try different possible field names for audio files
            const possibleAudioFields = ['mp3file', '음성파일', '음성', 'audio', 'Audio', 'MP3', 'sound', 'voice'];
            
            for (const fieldName of possibleAudioFields) {
                audioFiles = properties[fieldName]?.files || [];
                if (audioFiles.length > 0) {
                    audioUrl = audioFiles[0].file?.url || audioFiles[0].external?.url;
                    console.log(`Audio file found in field '${fieldName}' for:`, japanese);
                    console.log('Audio URL:', audioUrl);
                    break;
                }
            }
            
            // If no audio found, log available property names for debugging
            if (!audioUrl && japanese.includes('何があったんです')) {
                console.log('Available properties for card:', Object.keys(properties));
            }

            return {
                japanese: japanese || "대사 없음",
                korean: korean || "번역 없음", 
                character: characterInfo?.emoji || characterEmojis.default,
                characterImage: characterInfo?.imageUrl || null,
                gender: characterInfo?.gender || null,
                audioUrl: audioUrl,
                romanji: sentenceId || `${sequenceNumber}` || `${index + 1}`,
                speaker: characterName || n2Word || "학습자료",
                episode: episode,
                volume: volume,
                sequence: sequence,
                expressionCardIds: expressionCardRelations,
                n1VocabularyIds: n1VocabularyRelations
            };
        });
    } catch (error) {
        console.error("Error fetching flashcards from Notion:", error);
        throw error;
    }
}

// Get expression card info by ID
async function getExpressionCardInfo(expressionCardId) {
    try {
        const response = await notion.pages.retrieve({
            page_id: expressionCardId
        });
        
        // Helper function to get all rich text content
        const getRichTextContent = (richTextProperty) => {
            if (!richTextProperty?.rich_text || richTextProperty.rich_text.length === 0) {
                return '';
            }
            return richTextProperty.rich_text.map(text => text.plain_text).join('');
        };

        const title = response.properties['표현(일본어)']?.title?.[0]?.plain_text || '';
        const meaning = getRichTextContent(response.properties['뜻(한국어)']);
        const id = response.properties['ID']?.unique_id?.number || '';

        // Get application expressions with correct field names
        const application1 = getRichTextContent(response.properties['응용1J']);
        const application1Korean = getRichTextContent(response.properties['응용1K']);
        const application2 = getRichTextContent(response.properties['응용2J']);
        const application2Korean = getRichTextContent(response.properties['응용2K']);
        const application3 = getRichTextContent(response.properties['응용3J']);
        const application3Korean = getRichTextContent(response.properties['응용3K']);
        const application4 = getRichTextContent(response.properties['응용4J']);
        const application4Korean = getRichTextContent(response.properties['응용4K']);
        const application5 = getRichTextContent(response.properties['응용5J']);
        const application5Korean = getRichTextContent(response.properties['응용5K']);
        
        const result = {
            title: title,
            meaning: meaning,
            id: id,
            application1: application1,
            application1Korean: application1Korean,
            application2: application2,
            application2Korean: application2Korean,
            application3: application3,
            application3Korean: application3Korean,
            application4: application4,
            application4Korean: application4Korean,
            application5: application5,
            application5Korean: application5Korean
        };
        
        // console.log('=== Expression Card Result ===');
        // console.log('Expression Card ID:', expressionCardId);
        // console.log('Title:', title);
        
        return result;
    } catch (error) {
        console.error('Error fetching expression card info:', error);
        return null;
    }
}

// Get N1 vocabulary info by ID
async function getN1VocabularyInfo(n1VocabularyId) {
    try {
        const response = await notion.pages.retrieve({
            page_id: n1VocabularyId
        });
        
        // Helper function to get all rich text content
        const getRichTextContent = (richTextProperty) => {
            if (!richTextProperty?.rich_text || richTextProperty.rich_text.length === 0) {
                return '';
            }
            return richTextProperty.rich_text.map(text => text.plain_text).join('');
        };

        const word = response.properties['단어']?.title?.[0]?.plain_text || '';
        const meaning = getRichTextContent(response.properties['뜻']);
        const reading = getRichTextContent(response.properties['독음']);
        const example = getRichTextContent(response.properties['예문']);
        const exampleTranslation = getRichTextContent(response.properties['예문 해석']);
        const id = response.properties['ID']?.unique_id?.number || '';
        
        // Get image from the img field
        const imageFile = response.properties['img']?.files?.[0];
        const imageUrl = imageFile ? (imageFile.type === 'external' ? imageFile.external.url : imageFile.file.url) : '';
        
        return {
            word: word,
            meaning: meaning,
            reading: reading,
            example: example,
            exampleTranslation: exampleTranslation,
            id: id,
            img: imageUrl
        };
    } catch (error) {
        console.error('Error fetching N1 vocabulary info:', error);
        return null;
    }
}

// Get episodes data for the main menu
async function getEpisodesFromNotion() {
    try {
        // First, get the database schema to understand the property names
        const database = await notion.databases.retrieve({
            database_id: EPISODES_DATABASE_ID
        });
        
        console.log('Episodes database properties:', Object.keys(database.properties));
        
        const response = await notion.databases.query({
            database_id: EPISODES_DATABASE_ID,
            // Remove sort for now to avoid validation errors
        });

        const episodes = response.results.map(page => {
            const properties = page.properties;
            
            // Log available properties to debug
            console.log('Available properties for episode:', Object.keys(properties));
            
            // Extract episode data using the actual field names found in the database
            const sequence = properties.시퀀스?.rich_text?.[0]?.plain_text || '';
            const sequenceTitle = properties['시퀀스 제목']?.rich_text?.[0]?.plain_text || '';
            const title = properties.Name?.title?.[0]?.plain_text || 
                         properties.제목?.title?.[0]?.plain_text || 
                         'Untitled Episode';
            const description = sequenceTitle || '';
            const thumbnail = properties.표지?.files?.[0];
            const thumbnailUrl = thumbnail ? (thumbnail.type === 'external' ? thumbnail.external.url : thumbnail.file.url) : null;
            const status = 'published'; // Default to published since there's no status field
            
            // Extract episode number from title if sequence is empty
            let episodeNumber = sequence;
            if (!episodeNumber && title) {
                const match = title.match(/(\d+)(?:-(\d+))?/);
                if (match) {
                    episodeNumber = match[2] ? `#${match[2].padStart(3, '0')}` : `#${match[1].padStart(3, '0')}`;
                }
            }
                          
            const createdAt = properties.created_at?.created_time || 
                             properties.Created?.created_time || 
                             page.created_time;
            
            return {
                id: page.id,
                sequence: episodeNumber,
                title: title,
                description: description,
                thumbnailUrl: thumbnailUrl,
                status: status,
                createdAt: createdAt
            };
        });

        // Filter only published episodes
        const publishedEpisodes = episodes.filter(episode => 
            episode.status === 'published' || 
            episode.status === 'active' || 
            episode.status === 'public' ||
            episode.status === '활성' ||
            episode.status === '공개' ||
            !episode.status  // Include episodes without status
        );
        
        console.log(`Found ${publishedEpisodes.length} published episodes out of ${episodes.length} total`);
        return publishedEpisodes;
    } catch (error) {
        console.error("Error fetching episodes from Notion:", error);
        return [];
    }
}

module.exports = { 
    getFlashcardsFromNotion, 
    getNotionDatabases, 
    getExpressionCardInfo, 
    getN1VocabularyInfo, 
    getEpisodesFromNotion 
};