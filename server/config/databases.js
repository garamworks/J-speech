/**
 * Database configuration
 * Externalizes hardcoded database IDs from notion.js
 * Can be overridden via environment variables
 */

module.exports = {
  // Main dialogue database
  MAIN_DIALOGUE: process.env.DATABASE_ID || "228fe404-b3dc-80f0-a0c0-d83aaa28aa9b",

  // Character database
  CHARACTER: process.env.CHARACTER_DATABASE_ID || "229fe404-b3dc-80ec-830c-e619a046cf3a",

  // Expression cards database
  EXPRESSION_CARDS: process.env.EXPRESSION_CARDS_DATABASE_ID || "228fe404-b3dc-8037-86b5-fea02dcf9913",

  // N1 vocabulary database
  N1_VOCABULARY: process.env.N1_VOCABULARY_DATABASE_ID || "2bafe404-b3dc-811a-913f-df1dc06ea699",

  // Episodes/Sequence database
  EPISODES: process.env.EPISODES_DATABASE_ID || "228fe404-b3dc-8045-930e-f78bb8348f21",

  // Book database (main menu)
  BOOK: process.env.BOOK_DATABASE_ID || "22cfe404-b3dc-8035-baae-ea57e7401e3a"
};
