/**
 * Unit tests for helper utility functions
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sleep, getUrlParams, updateUrlParam, formatSequence, debounce, getEmojiForSentence } from './helpers.js';

describe('helpers.js', () => {
  describe('sleep', () => {
    it('should delay execution by specified milliseconds', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(90); // Allow some variance
      expect(elapsed).toBeLessThan(150);
    });

    it('should resolve after timeout', async () => {
      const result = await sleep(10);
      expect(result).toBeUndefined();
    });
  });

  describe('getUrlParams', () => {
    beforeEach(() => {
      // Mock window.location.search
      delete window.location;
      window.location = { search: '?episode=%23197&page=1' };
    });

    it('should return URLSearchParams object', () => {
      const params = getUrlParams();
      expect(params).toBeInstanceOf(URLSearchParams);
    });

    it('should parse URL parameters correctly', () => {
      const params = getUrlParams();
      expect(params.get('episode')).toBe('#197');
      expect(params.get('page')).toBe('1');
    });

    it('should return empty params when no query string', () => {
      window.location = { search: '' };
      const params = getUrlParams();
      expect(params.toString()).toBe('');
    });
  });

  describe('formatSequence', () => {
    it('should add # prefix if missing', () => {
      expect(formatSequence('197')).toBe('#197');
      expect(formatSequence('001')).toBe('#001');
    });

    it('should keep # prefix if already present', () => {
      expect(formatSequence('#197')).toBe('#197');
      expect(formatSequence('#001')).toBe('#001');
    });

    it('should handle empty string', () => {
      expect(formatSequence('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(formatSequence(null)).toBe('');
      expect(formatSequence(undefined)).toBe('');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should debounce function calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments to debounced function', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');

      vi.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });

    it('should reset timer on subsequent calls', () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      vi.advanceTimersByTime(50);
      debouncedFn();
      vi.advanceTimersByTime(50);

      expect(mockFn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);

      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEmojiForSentence', () => {
    it('should return question emoji for questions', () => {
      expect(getEmojiForSentence('これは何ですか？')).toBe('❓');
      expect(getEmojiForSentence('What is this?')).toBe('❓');
    });

    it('should return exclamation emoji for exclamations', () => {
      expect(getEmojiForSentence('すごい！')).toBe('❗');
      expect(getEmojiForSentence('Wow!')).toBe('❗');
    });

    it('should return thank you emoji for gratitude', () => {
      expect(getEmojiForSentence('ありがとう')).toBe('🙏');
      expect(getEmojiForSentence('感謝します')).toBe('🙏');
    });

    it('should return greeting emoji for greetings', () => {
      expect(getEmojiForSentence('こんにちは')).toBe('👋');
      expect(getEmojiForSentence('おはよう')).toBe('👋');
    });

    it('should cycle through emoji list for normal sentences', () => {
      const emoji1 = getEmojiForSentence('普通の文', 0);
      const emoji2 = getEmojiForSentence('普通の文', 1);
      expect(emoji1).toBe('😊');
      expect(emoji2).toBe('🎵');
    });

    it('should return default emoji for null/undefined', () => {
      expect(getEmojiForSentence(null)).toBe('💬');
      expect(getEmojiForSentence(undefined)).toBe('💬');
      expect(getEmojiForSentence('')).toBe('💬');
    });
  });
});
