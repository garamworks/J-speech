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

// Updated database structure - using connected databases
const DATABASE_ID = "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b"; // Main dialogue database
const CHARACTER_DATABASE_ID = "229fe404-b3dc-80ec-830c-e619a046cf3a"; // Character database
const EXPRESSION_CARDS_DATABASE_ID = "228fe404-b3dc-8037-86b5-fea02dcf9913"; // Expression cards database (connected)
const N1_VOCABULARY_DATABASE_ID = "2bafe404-b3dc-811a-913f-df1dc06ea699"; // N1 vocabulary database (connected) - Updated 2025-12-07
const EPISODES_DATABASE_ID = "228fe404-b3dc-8045-930e-f78bb8348f21"; // Episodes/Sequence database (connected)
const BOOK_DATABASE_ID = "22cfe404-b3dc-8035-baae-ea57e7401e3a"; // Book database (main menu)

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

// Cache for flashcards data
let flashcardsCache = null;
let flashcardsCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for sequences per book
let sequencesCache = {}; // bookId -> sequences array
let sequencesCacheTime = {}; // bookId -> timestamp

function isCacheValid() {
    return flashcardsCache !== null &&
           flashcardsCacheTime !== null &&
           (Date.now() - flashcardsCacheTime) < CACHE_DURATION;
}

function isSequenceCacheValid(bookId) {
    return sequencesCache[bookId] !== undefined &&
           sequencesCacheTime[bookId] !== undefined &&
           (Date.now() - sequencesCacheTime[bookId]) < CACHE_DURATION;
}

// Get flashcard data from Notion database (updated for connected database structure)
async function getFlashcardsFromNotion(episodeSequence = null) {
    try {
        // Check cache first - use cache for both full and filtered requests
        if (isCacheValid()) {
            console.log('Using cached flashcards data');
            if (episodeSequence) {
                // Return filtered data from cache
                if (flashcardsCache[episodeSequence]) {
                    return { [episodeSequence]: flashcardsCache[episodeSequence] };
                } else {
                    console.log(`No flashcards found for sequence: ${episodeSequence} in cache`);
                    return {};
                }
            }
            return flashcardsCache;
        }

        const startTime = Date.now();
        console.log('Fetching fresh data from Notion...');

        // Get all dialogue data with pagination, filtering only completed entries
        let allResults = [];
        let hasMore = true;
        let startCursor = undefined;

        while (hasMore) {
            const response = await notion.databases.query({
                database_id: DATABASE_ID,
                start_cursor: startCursor,
                page_size: 100
                // Removed status filter to include all entries (Done and Not started)
            });

            allResults = allResults.concat(response.results);
            hasMore = response.has_more;
            startCursor = response.next_cursor;
        }

        console.log(`Fetched ${allResults.length} cards from Notion in ${Date.now() - startTime}ms`);

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

        // Get sequence relations from PALM Sequence DB
        const sequenceRelations = {};
        const sequenceTitles = {}; // Store book titles for each sequence
        const sequenceBookIds = {}; // Store book IDs for each sequence
        const SEQUENCE_DB_ID = "228fe404-b3dc-8045-930e-f78bb8348f21";

        // First, get all sequences from the sequence database
        const sequenceResponse = await notion.databases.query({
            database_id: SEQUENCE_DB_ID
        });

        // Map sequence IDs to their identifiers and titles
        // Extract sequence numbers from titles or 시퀀스 field
        for (const seq of sequenceResponse.results) {
            const sequenceTitle = seq.properties['Name']?.title?.[0]?.plain_text;
            const sequenceField = seq.properties['시퀀스']?.rich_text?.[0]?.plain_text || '';

            // Get book relation ID from sequence - the field name is '권'
            const bookRelationId = seq.properties['권']?.relation?.[0]?.id;

            if (bookRelationId) {
                sequenceBookIds[seq.id] = bookRelationId;
                console.log(`Sequence ${sequenceTitle} -> Book ID: ${bookRelationId}`);
            } else {
                console.log(`Warning: No book relation found for sequence ${sequenceTitle}`);
                console.log('Available properties:', Object.keys(seq.properties));
            }

            if (sequenceTitle) {
                let identifier;
                let bookTitle;
                // For PALM sequences, convert "PALM 26-002" to "#002" format
                const palmMatch = sequenceTitle.match(/PALM 26-(\d+)/);
                if (palmMatch) {
                    identifier = '#' + palmMatch[1].padStart(3, '0');
                    bookTitle = 'PALM';
                    console.log(`Mapped PALM sequence: ${seq.id} -> ${identifier} (${sequenceTitle})`);
                } else {
                    // For other sequences, try to use 시퀀스 field first
                    if (sequenceField) {
                        // Extract numbers from the 시퀀스 field
                        const sequenceMatch = sequenceField.match(/\d+/);
                        if (sequenceMatch) {
                            identifier = '#' + sequenceMatch[0];
                        } else {
                            // If no number found in 시퀀스, use it as-is
                            identifier = sequenceField.startsWith('#') ? sequenceField : '#' + sequenceField;
                        }
                    } else {
                        // Try to extract from title (e.g., "3월의 라이온 - 195화" -> "195")
                        const titleMatch = sequenceTitle.match(/(\d+)화/);
                        if (titleMatch) {
                            identifier = '#' + titleMatch[1];
                        } else {
                            // Fallback to page ID
                            identifier = seq.id;
                        }
                    }
                    // Extract book title from sequence title (e.g., "3월의 라이온 - 195화" -> "3월의 라이온")
                    const bookTitleMatch = sequenceTitle.match(/^(.+?)\s*-\s*\d+화/);
                    bookTitle = bookTitleMatch ? bookTitleMatch[1] : sequenceTitle;
                    console.log(`Mapped other sequence: ${seq.id} -> ${identifier} (${sequenceTitle}, 시퀀스: "${sequenceField}")`);
                }
                sequenceRelations[seq.id] = identifier;
                sequenceTitles[seq.id] = bookTitle;
            }
        }

        console.log('Sequence relations loaded:', Object.keys(sequenceRelations).length, 'sequences');

        if (allResults.length === 0) {
            throw new Error("No data found in the Notion database");
        }

        // Sort by sequence and order
        const sortedResults = allResults.sort((a, b) => {
            const sequenceA = a.properties['시퀀스']?.select?.name || '';
            const sequenceB = b.properties['시퀀스']?.select?.name || '';
            const orderA = a.properties['순서']?.number || 999;
            const orderB = b.properties['순서']?.number || 999;
            
            // First sort by sequence
            if (sequenceA !== sequenceB) {
                return sequenceA.localeCompare(sequenceB);
            }
            
            // Then sort by order
            return orderA - orderB;
        });

        // Transform data into flashcard format
        const flashcards = sortedResults.map(page => {
            const japanese = page.properties['일본어']?.rich_text?.[0]?.plain_text || '';
            const korean = page.properties['한국어']?.rich_text?.[0]?.plain_text || '';
            
            // Get character relation
            const characterRelation = page.properties['사람']?.relation?.[0]?.id;
            const characterName = characterRelations[characterRelation] || 'Unknown';
            
            // Get sequence from Sequence DB relation (try both field names for compatibility)
            const sequenceRelationId = page.properties['Sequence DB']?.relation?.[0]?.id ||
                                      page.properties['PALM Sequence DB']?.relation?.[0]?.id;
            let sequence = sequenceRelations[sequenceRelationId] || '';
            let bookTitle = sequenceTitles[sequenceRelationId] || 'Unknown';
            let bookId = sequenceBookIds[sequenceRelationId] || null;
            const order = page.properties['순서']?.number || 0;

            // Debug logging for sequence mapping
            if (sequenceRelationId && !sequence) {
                console.log(`Warning: Dialogue "${japanese.substring(0, 30)}" has sequence relation ${sequenceRelationId} but no mapping found`);
            }
            
            // If no sequence relation exists, use the local sequence property as fallback
            if (!sequence || sequence.trim() === '') {
                sequence = page.properties['시퀀스']?.select?.name || '';
            }
            
            // Final fallback: assign based on order if still no sequence
            if (!sequence || sequence.trim() === '') {
                if (order >= 1 && order <= 56) {
                    if (order >= 1 && order <= 35) {
                        sequence = '#001';
                    } else if (order >= 36 && order <= 56) {
                        sequence = '#002';
                    }
                } else if (order >= 57 && order <= 112) {
                    sequence = '#003';
                } else if (order >= 113 && order <= 137) {
                    sequence = '#004';
                } else if (order >= 138 && order <= 182) {
                    sequence = '#005';
                } else if (order >= 183 && order <= 240) {
                    sequence = '#006';
                } else {
                    sequence = '#001'; // Default fallback
                }
            }
            
            // Get volume
            const volume = page.properties['권']?.select?.name || '';
            
            // Get expression cards and vocabulary relations
            const expressionCards = page.properties['일본어 표현카드']?.relation || [];
            // Try new field name first, then fall back to old field name for backwards compatibility
            const mangaVocab = page.properties['일본어 단어공부 Manga']?.relation || [];
            const n1Vocab = page.properties['일본어 단어공부 N1']?.relation || [];
            const n1Vocabulary = mangaVocab.length > 0 ? mangaVocab : n1Vocab;

            // Get MP3 file (Japanese)
            const mp3Files = page.properties['mp3file']?.files || [];
            let audioUrl = null;
            if (mp3Files.length > 0) {
                const audioFile = mp3Files[0];
                audioUrl = audioFile.type === 'external' ? audioFile.external.url : audioFile.file.url;
                console.log(`Audio file found in field 'mp3file' for: ${japanese}`);
                console.log(`Audio URL: ${audioUrl}`);
            }

            // Get Korean MP3 file
            const mp3FilesKorean = page.properties['mp3file_K']?.files || [];
            let koreanAudioUrl = null;
            if (mp3FilesKorean.length > 0) {
                const koreanAudioFile = mp3FilesKorean[0];
                koreanAudioUrl = koreanAudioFile.type === 'external' ? koreanAudioFile.external.url : koreanAudioFile.file.url;
                console.log(`Korean audio file found in field 'mp3file_K' for: ${korean}`);
                console.log(`Korean Audio URL: ${koreanAudioUrl}`);
            }

            return {
                japanese: japanese || "대사 없음",
                korean: korean || "번역 없음",
                character: characterData[characterName]?.emoji || '🎭',
                characterImage: characterData[characterName]?.imageUrl || null,
                gender: characterData[characterName]?.gender || null,
                audioUrl: audioUrl,
                koreanAudioUrl: koreanAudioUrl,
                romanji: `${sequence}_${order}`,
                speaker: characterName || "학습자료",
                episode: "1화",
                volume: volume,
                sequence: sequence,
                bookTitle: bookTitle,
                bookId: bookId,
                expressionCardIds: expressionCards.map(card => card.id),
                n1VocabularyIds: n1Vocabulary.map(vocab => vocab.id)
            };
        });

        // Filter out empty sequences and group flashcards by sequence
        const validFlashcards = flashcards.filter(card => card.sequence && card.sequence !== '');
        
        const episodeData = {};
        validFlashcards.forEach(card => {
            const sequenceKey = card.sequence;
            if (!episodeData[sequenceKey]) {
                episodeData[sequenceKey] = [];
            }
            episodeData[sequenceKey].push(card);
        });

        console.log('Grouped flashcards by sequence:', Object.keys(episodeData));
        Object.entries(episodeData).forEach(([seq, cards]) => {
            console.log(`Sequence ${seq}: ${cards.length} cards`);
        });

        // Always cache the full dataset
        flashcardsCache = episodeData;
        flashcardsCacheTime = Date.now();
        console.log('Cached flashcards data for 5 minutes');

        // If episodeSequence parameter is provided, return only that specific episode
        if (episodeSequence) {
            console.log(`Filtering for episode sequence: ${episodeSequence}`);
            if (episodeData[episodeSequence]) {
                return { [episodeSequence]: episodeData[episodeSequence] };
            } else {
                console.log(`No flashcards found for sequence: ${episodeSequence}`);
                return {};
            }
        }

        return episodeData;
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

// Get books data for the main menu (using Book DB)
async function getEpisodesFromNotion() {
    try {
        // Query the Book database
        const response = await notion.databases.query({
            database_id: BOOK_DATABASE_ID,
        });

        const books = response.results.map(page => {
            const properties = page.properties;

            // Extract book data from Book DB
            // 권 (title field) - e.g., "PALM 26"
            const bookTitle = properties.권?.title?.[0]?.plain_text || 'Untitled Book';

            // 제목 (rich_text) - e.g., "오후의 빛 I"
            const subtitle = properties.제목?.rich_text?.[0]?.plain_text || '';

            // 표지 (files) - book cover image
            const thumbnail = properties.표지?.files?.[0];
            const thumbnailUrl = thumbnail ? (thumbnail.type === 'external' ? thumbnail.external.url : thumbnail.file.url) : null;

            // Sequence DB (relation) - array of related sequence IDs
            const sequenceRelations = properties['Sequence DB']?.relation ||
                                     properties['PALM Sequence DB']?.relation || [];

            return {
                id: page.id,
                bookTitle: bookTitle,
                subtitle: subtitle,
                thumbnailUrl: thumbnailUrl,
                sequenceCount: sequenceRelations.length,
                sequenceRelations: sequenceRelations,
                createdAt: page.created_time
            };
        });

        console.log(`Found ${books.length} books`);
        return books;
    } catch (error) {
        console.error("Error fetching books from Notion:", error);
        return [];
    }
}

// Get sequences for a specific book
async function getSequencesForBook(bookId, limit = null) {
    try {
        // Check cache first
        if (isSequenceCacheValid(bookId)) {
            console.log(`Using cached sequences for book ${bookId}`);
            const cached = sequencesCache[bookId];
            // Return limited results if limit is specified
            return limit ? cached.slice(0, limit) : cached;
        }

        console.log(`Fetching sequences for book ${bookId}...`);
        const startTime = Date.now();

        // First, get the book to find its related sequences
        const bookPage = await notion.pages.retrieve({ page_id: bookId });
        const sequenceRelations = bookPage.properties['Sequence DB']?.relation ||
                                 bookPage.properties['PALM Sequence DB']?.relation || [];

        if (sequenceRelations.length === 0) {
            console.log(`No sequences found for book ${bookId}`);
            return [];
        }

        // Fetch each sequence's details
        const sequences = await Promise.all(
            sequenceRelations.map(async (relation) => {
                try {
                    const sequencePage = await notion.pages.retrieve({ page_id: relation.id });
                    const properties = sequencePage.properties;

                    const sequence = properties.시퀀스?.rich_text?.[0]?.plain_text || '';
                    const sequenceTitle = properties['시퀀스 제목']?.rich_text?.[0]?.plain_text || '';
                    const title = properties.Name?.title?.[0]?.plain_text ||
                                 properties.제목?.title?.[0]?.plain_text ||
                                 'Untitled Episode';
                    const thumbnail = properties.표지?.files?.[0];
                    const thumbnailUrl = thumbnail ? (thumbnail.type === 'external' ? thumbnail.external.url : thumbnail.file.url) : null;

                    console.log(`Sequence page - Title: "${title}", 시퀀스 field: "${sequence}"`);

                    // Determine the sequence identifier
                    // For PALM sequences, extract formatted number like "#002"
                    // For other sequences, try to use the 시퀀스 field or extract from title
                    let episodeIdentifier;
                    const palmMatch = title.match(/PALM 26-(\d+)/);
                    if (palmMatch) {
                        // PALM sequence - use formatted number
                        episodeIdentifier = '#' + palmMatch[1].padStart(3, '0');
                    } else {
                        // Other sequences - try to use 시퀀스 field first
                        if (sequence) {
                            // Extract numbers from the 시퀀스 field
                            const sequenceMatch = sequence.match(/\d+/);
                            if (sequenceMatch) {
                                episodeIdentifier = '#' + sequenceMatch[0];
                            } else {
                                // If no number found in 시퀀스, use it as-is
                                episodeIdentifier = sequence.startsWith('#') ? sequence : '#' + sequence;
                            }
                        } else {
                            // Try to extract from title (e.g., "3월의 라이온 - 195화" -> "195")
                            const titleMatch = title.match(/(\d+)화/);
                            if (titleMatch) {
                                episodeIdentifier = '#' + titleMatch[1];
                            } else {
                                // Fallback to page ID
                                episodeIdentifier = sequencePage.id;
                            }
                        }
                    }

                    console.log(`Final episode identifier: "${episodeIdentifier}"`);

                    return {
                        id: sequencePage.id,
                        sequence: episodeIdentifier,
                        title: title,
                        description: sequenceTitle || '',
                        thumbnailUrl: thumbnailUrl,
                        createdAt: sequencePage.created_time
                    };
                } catch (error) {
                    console.error(`Error fetching sequence ${relation.id}:`, error);
                    return null;
                }
            })
        );

        // Filter out null results and sort by sequence
        const validSequences = sequences.filter(s => s !== null);
        validSequences.sort((a, b) => {
            const aNum = parseInt(a.sequence.replace('#', ''));
            const bNum = parseInt(b.sequence.replace('#', ''));
            return bNum - aNum; // descending order
        });

        // Cache the results
        sequencesCache[bookId] = validSequences;
        sequencesCacheTime[bookId] = Date.now();

        console.log(`Found ${validSequences.length} sequences for book ${bookId} in ${Date.now() - startTime}ms`);
        console.log(`Cached sequences for book ${bookId}`);

        return validSequences;
    } catch (error) {
        console.error(`Error fetching sequences for book ${bookId}:`, error);
        return [];
    }
}

module.exports = {
    getFlashcardsFromNotion,
    getNotionDatabases,
    getExpressionCardInfo,
    getN1VocabularyInfo,
    getEpisodesFromNotion,
    getSequencesForBook
};