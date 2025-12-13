/**
 * Unit tests for audio utilities
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playAudioFile, playTTSAudio, stopAllAudio, isAudioPlaying } from './audio.js';

describe('audio.js', () => {
  let audioMock;
  let speechSynthesisMock;

  beforeEach(() => {
    // Mock Audio constructor
    audioMock = {
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      currentTime: 0,
      paused: false,
      onended: null,
      onerror: null
    };

    // Use a proper constructor function
    global.Audio = function(url) {
      return audioMock;
    };

    // Mock SpeechSynthesis
    speechSynthesisMock = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn()
    };

    global.window = global.window || {};
    global.window.speechSynthesis = speechSynthesisMock;

    // Mock SpeechSynthesisUtterance
    global.SpeechSynthesisUtterance = function(text) {
      this.text = text;
      this.lang = '';
      this.rate = 1.0;
      this.onend = null;
      this.onerror = null;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('playAudioFile', () => {
    it('should create and play audio with given URL', async () => {
      const url = 'https://example.com/audio.mp3';
      const playPromise = playAudioFile(url);

      expect(audioMock.play).toHaveBeenCalled();

      // Trigger onended to resolve the promise
      audioMock.onended();
      await playPromise;
    });

    it('should reuse preloaded audio for same URL', async () => {
      const url = 'https://example.com/audio.mp3';

      // First call
      const promise1 = playAudioFile(url);
      audioMock.onended();
      await promise1;

      // Reset play mock call count
      audioMock.play.mockClear();

      // Second call with same URL
      const promise2 = playAudioFile(url);
      audioMock.onended();
      await promise2;

      // Play should still be called
      expect(audioMock.play).toHaveBeenCalled();
    });

    it('should reset currentTime to 0', async () => {
      const url = 'https://example.com/audio.mp3';
      audioMock.currentTime = 5.5;

      const promise = playAudioFile(url);

      expect(audioMock.currentTime).toBe(0);

      audioMock.onended();
      await promise;
    });

    it('should handle play errors gracefully', async () => {
      const url = 'https://example.com/audio.mp3';
      const error = new Error('Playback failed');
      audioMock.play.mockRejectedValueOnce(error);

      // Should not throw, just resolve
      await expect(playAudioFile(url)).resolves.toBeUndefined();
    });

    it('should resolve immediately if URL is empty', async () => {
      await expect(playAudioFile('')).resolves.toBeUndefined();
      expect(global.Audio).not.toHaveBeenCalled();
    });

    it('should resolve immediately if URL is null', async () => {
      await expect(playAudioFile(null)).resolves.toBeUndefined();
      expect(global.Audio).not.toHaveBeenCalled();
    });
  });

  describe('playTTSAudio', () => {
    it('should create utterance and speak text', async () => {
      const text = 'こんにちは';
      const promise = playTTSAudio(text, 'ja');

      expect(speechSynthesisMock.speak).toHaveBeenCalled();

      // Get the utterance instance
      const utterance = speechSynthesisMock.speak.mock.calls[0][0];

      // Verify the utterance text
      expect(utterance.text).toBe(text);

      // Trigger onend to resolve
      utterance.onend();
      await promise;
    });

    it('should set Japanese language and rate for ja', async () => {
      const text = 'テスト';
      const promise = playTTSAudio(text, 'ja');

      const utterance = speechSynthesisMock.speak.mock.calls[0][0];

      expect(utterance.lang).toBe('ja-JP');
      expect(utterance.rate).toBe(1.2);

      utterance.onend();
      await promise;
    });

    it('should set Korean language and rate for ko', async () => {
      const text = '테스트';
      const promise = playTTSAudio(text, 'ko');

      const utterance = speechSynthesisMock.speak.mock.calls[0][0];

      expect(utterance.lang).toBe('ko-KR');
      expect(utterance.rate).toBe(1.0);

      utterance.onend();
      await promise;
    });

    it('should default to Korean if no lang specified', async () => {
      const text = '안녕';
      const promise = playTTSAudio(text);

      const utterance = speechSynthesisMock.speak.mock.calls[0][0];

      expect(utterance.lang).toBe('ko-KR');

      utterance.onend();
      await promise;
    });

    it('should resolve on error', async () => {
      const text = 'テスト';
      const promise = playTTSAudio(text, 'ja');

      const utterance = speechSynthesisMock.speak.mock.calls[0][0];

      // Trigger onerror instead of onend
      utterance.onerror();

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve immediately if speechSynthesis not available', async () => {
      global.window.speechSynthesis = null;

      await expect(playTTSAudio('test')).resolves.toBeUndefined();
    });

    it('should resolve immediately if text is empty', async () => {
      await expect(playTTSAudio('')).resolves.toBeUndefined();
      expect(speechSynthesisMock.speak).not.toHaveBeenCalled();
    });
  });

  describe('stopAllAudio', () => {
    it('should pause current audio and cancel speech synthesis', async () => {
      // Start audio
      const audioPromise = playAudioFile('test.mp3');

      // Stop all audio
      stopAllAudio();

      expect(audioMock.pause).toHaveBeenCalled();
      expect(audioMock.currentTime).toBe(0);
      expect(speechSynthesisMock.cancel).toHaveBeenCalled();

      // Cleanup - don't call onended as audio was stopped
      await audioPromise;
    });

    it('should not throw if no audio is playing', () => {
      expect(() => stopAllAudio()).not.toThrow();
    });
  });

  describe('isAudioPlaying', () => {
    it('should return true when audio is playing', async () => {
      const promise = playAudioFile('test.mp3');

      expect(isAudioPlaying()).toBe(true);

      audioMock.onended();
      await promise;
    });

    it('should return false when no audio is playing', () => {
      expect(isAudioPlaying()).toBe(false);
    });

    it('should return false after audio ends', async () => {
      const promise = playAudioFile('test.mp3');

      expect(isAudioPlaying()).toBe(true);

      audioMock.onended();
      await promise;

      expect(isAudioPlaying()).toBe(false);
    });
  });
});
