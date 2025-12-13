/**
 * Centralized API client for all backend calls
 * Consolidates 28+ scattered fetch calls across HTML files
 */

const API_BASE = '/api';

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic fetch wrapper with error handling
 * @param {string} endpoint - API endpoint path
 * @param {Object} options - Fetch options
 * @returns {Promise<any>} Response data
 */
async function fetchJSON(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.error || errorData.message || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or parsing error
    console.error('API request failed:', error);
    throw new APIError(
      'Network error or invalid response',
      0,
      { originalError: error.message }
    );
  }
}

/**
 * API client object with all endpoints
 */
export const api = {
  /**
   * Get flashcards data
   * @param {string|null} episode - Optional episode/sequence filter
   * @returns {Promise<Object>} Flashcards grouped by sequence
   */
  async getFlashcards(episode = null) {
    const endpoint = episode
      ? `/flashcards?episode=${encodeURIComponent(episode)}`
      : '/flashcards';
    return fetchJSON(endpoint);
  },

  /**
   * Get all books
   * @returns {Promise<Array>} List of books
   */
  async getBooks() {
    return fetchJSON('/books');
  },

  /**
   * Get sequences for a specific book
   * @param {string} bookId - Book ID
   * @param {number|null} limit - Optional limit
   * @returns {Promise<Array>} List of sequences
   */
  async getSequencesForBook(bookId, limit = null) {
    const endpoint = limit
      ? `/book/${bookId}/sequences?limit=${limit}`
      : `/book/${bookId}/sequences`;
    return fetchJSON(endpoint);
  },

  /**
   * Get expression card details
   * @param {string} id - Expression card ID
   * @returns {Promise<Object>} Expression card data
   */
  async getExpressionCard(id) {
    return fetchJSON(`/expression/${id}`);
  },

  /**
   * Get single N1 vocabulary entry
   * @param {string} id - Vocabulary ID
   * @returns {Promise<Object>} Vocabulary data
   */
  async getN1Vocabulary(id) {
    return fetchJSON(`/n1-vocabulary/${id}`);
  },

  /**
   * Get multiple N1 vocabulary entries
   * @param {string[]} ids - Array of vocabulary IDs
   * @returns {Promise<Array>} Array of vocabulary data
   */
  async getN1VocabularyMultiple(ids) {
    if (!ids || ids.length === 0) {
      return [];
    }
    return fetchJSON(`/n1-vocabulary-multiple/${ids.join(',')}`);
  },

  /**
   * Get database info
   * @returns {Promise<Object>} Database information
   */
  async getDatabaseInfo() {
    return fetchJSON('/database-info');
  }
};

/**
 * Export APIError for error handling
 */
export { APIError };

/**
 * Export fetchJSON for custom requests
 */
export { fetchJSON };
