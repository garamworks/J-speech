/**
 * Unit tests for API client
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api } from './api-client.js';

describe('api-client.js', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getFlashcards', () => {
    it('should fetch flashcards without episode parameter', async () => {
      const mockData = { '#197': [{ japanese: 'テスト', korean: '테스트' }] };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await api.getFlashcards();

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/flashcards',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockData);
    });

    it('should fetch flashcards with episode parameter', async () => {
      const mockData = { '#197': [{ japanese: 'テスト', korean: '테스트' }] };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await api.getFlashcards('#197');

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/flashcards?episode=%23197',
        expect.any(Object)
      );
      expect(result).toEqual(mockData);
    });

    it('should handle API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' })
      });

      await expect(api.getFlashcards()).rejects.toThrow('Internal Server Error');
    });
  });

  describe('getBooks', () => {
    it('should fetch books list', async () => {
      const mockBooks = [
        { id: '1', bookTitle: 'PALM 26', subtitle: '오후의 빛 I' }
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockBooks
      });

      const result = await api.getBooks();

      expect(fetchMock).toHaveBeenCalledWith('/api/books', expect.any(Object));
      expect(result).toEqual(mockBooks);
    });
  });

  describe('getSequencesForBook', () => {
    it('should fetch sequences for a book', async () => {
      const mockSequences = [
        { id: '1', sequence: '#197', title: 'Episode 197' }
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSequences
      });

      const result = await api.getSequencesForBook('book-id-123');

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/book/book-id-123/sequences',
        expect.any(Object)
      );
      expect(result).toEqual(mockSequences);
    });
  });

  describe('getExpressionCard', () => {
    it('should fetch expression card by ID', async () => {
      const mockCard = {
        title: '表現',
        meaning: '의미',
        application1: '例文1'
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard
      });

      const result = await api.getExpressionCard('expr-123');

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/expression/expr-123',
        expect.any(Object)
      );
      expect(result).toEqual(mockCard);
    });
  });

  describe('getN1VocabularyMultiple', () => {
    it('should fetch multiple N1 vocabulary items', async () => {
      const mockVocab = [
        { word: '単語1', meaning: '의미1' },
        { word: '単語2', meaning: '의미2' }
      ];
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVocab
      });

      const result = await api.getN1VocabularyMultiple(['id1', 'id2']);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/n1-vocabulary-multiple/id1,id2',
        expect.any(Object)
      );
      expect(result).toEqual(mockVocab);
    });

    it('should return empty array for empty IDs', async () => {
      const result = await api.getN1VocabularyMultiple([]);
      expect(result).toEqual([]);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should throw APIError with status code', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not Found' })
      });

      try {
        await api.getFlashcards();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('APIError');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Not Found');
      }
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network failure'));

      try {
        await api.getBooks();
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.name).toBe('APIError');
        expect(error.message).toBe('Network error');
        expect(error.status).toBe(0);
      }
    });
  });
});
