/**
 * Notion API client configuration
 * Centralizes Notion client initialization
 */

const { Client } = require("@notionhq/client");

// Initialize Notion client with API key from environment
const notion = new Client({
  auth: process.env.GARAM_NOTION_SECRET,
});

module.exports = notion;
