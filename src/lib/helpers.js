/**
 * General utility helpers
 * Consolidates duplicate functions from multiple HTML files
 */

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get URL search parameters
 * @returns {URLSearchParams}
 */
export function getUrlParams() {
  return new URLSearchParams(window.location.search);
}

/**
 * Update URL parameter without page reload
 * @param {string} key - Parameter name
 * @param {string} value - Parameter value
 */
export function updateUrlParam(key, value) {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url);
}

/**
 * Format sequence number with # prefix
 * @param {string} sequence - Sequence number
 * @returns {string} Formatted sequence (e.g., "#001")
 */
export function formatSequence(sequence) {
  if (!sequence) return '';
  return sequence.startsWith('#') ? sequence : `#${sequence}`;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get emoji for sentence based on content
 * @param {string} sentence - Japanese sentence
 * @param {number} index - Sentence index
 * @returns {string} Emoji character
 */
export function getEmojiForSentence(sentence, index = 0) {
  if (!sentence) return '💬';

  const emojiList = ['😊', '🎵', '✨', '🌸', '🎭', '📚', '🌟', '💫', '🎨', '🌺'];

  // Check for question marks
  if (sentence.includes('？') || sentence.includes('?')) {
    return '❓';
  }

  // Check for exclamation marks
  if (sentence.includes('！') || sentence.includes('!')) {
    return '❗';
  }

  // Check for certain keywords
  if (sentence.includes('ありがとう') || sentence.includes('感謝')) {
    return '🙏';
  }

  if (sentence.includes('こんにちは') || sentence.includes('おはよう')) {
    return '👋';
  }

  // Default: cycle through emoji list based on index
  return emojiList[index % emojiList.length];
}

/**
 * Shuffle array in place
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
export function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Check if running in Android WebView
 * @returns {boolean}
 */
export function isAndroidApp() {
  return typeof Android !== 'undefined' && typeof Android.playPlaylist === 'function';
}
