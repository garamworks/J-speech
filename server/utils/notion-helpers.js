/**
 * Shared Notion data extraction utilities
 * Consolidates duplicate getRichTextContent() and other helpers from notion.js
 */

/**
 * Extract text content from rich text property
 * @param {Object} richTextProperty - Notion rich text property
 * @returns {string} Extracted plain text
 */
function getRichTextContent(richTextProperty) {
  if (!richTextProperty?.rich_text || richTextProperty.rich_text.length === 0) {
    return '';
  }
  return richTextProperty.rich_text.map(text => text.plain_text).join('');
}

/**
 * Extract text content from title property
 * @param {Object} titleProperty - Notion title property
 * @returns {string} Extracted title text
 */
function getTitleContent(titleProperty) {
  return titleProperty?.title?.[0]?.plain_text || '';
}

/**
 * Extract select value from select property
 * @param {Object} selectProperty - Notion select property
 * @returns {string} Selected value name
 */
function getSelectValue(selectProperty) {
  return selectProperty?.select?.name || '';
}

/**
 * Extract number value from number property
 * @param {Object} numberProperty - Notion number property
 * @returns {number} Number value or 0
 */
function getNumberValue(numberProperty) {
  return numberProperty?.number || 0;
}

/**
 * Extract file URL from files property
 * Handles both external and internal file types
 * @param {Object} fileProperty - Notion files property
 * @returns {string|null} File URL or null
 */
function getFileUrl(fileProperty) {
  const file = fileProperty?.files?.[0];
  if (!file) return null;

  return file.type === 'external' ? file.external.url : file.file.url;
}

/**
 * Extract relation IDs from relation property
 * @param {Object} relationProperty - Notion relation property
 * @returns {string[]} Array of related page IDs
 */
function getRelationIds(relationProperty) {
  return relationProperty?.relation?.map(r => r.id) || [];
}

/**
 * Extract date value from date property
 * @param {Object} dateProperty - Notion date property
 * @returns {string|null} Date string or null
 */
function getDateValue(dateProperty) {
  return dateProperty?.date?.start || null;
}

/**
 * Extract checkbox value from checkbox property
 * @param {Object} checkboxProperty - Notion checkbox property
 * @returns {boolean} Checkbox state
 */
function getCheckboxValue(checkboxProperty) {
  return checkboxProperty?.checkbox || false;
}

/**
 * Extract email from email property
 * @param {Object} emailProperty - Notion email property
 * @returns {string} Email address
 */
function getEmailValue(emailProperty) {
  return emailProperty?.email || '';
}

/**
 * Extract phone number from phone property
 * @param {Object} phoneProperty - Notion phone number property
 * @returns {string} Phone number
 */
function getPhoneValue(phoneProperty) {
  return phoneProperty?.phone_number || '';
}

/**
 * Extract URL from URL property
 * @param {Object} urlProperty - Notion URL property
 * @returns {string} URL
 */
function getUrlValue(urlProperty) {
  return urlProperty?.url || '';
}

module.exports = {
  getRichTextContent,
  getTitleContent,
  getSelectValue,
  getNumberValue,
  getFileUrl,
  getRelationIds,
  getDateValue,
  getCheckboxValue,
  getEmailValue,
  getPhoneValue,
  getUrlValue
};
