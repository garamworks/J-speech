/**
 * Audio utilities for playing audio files and TTS
 * Consolidates duplicate functions from episodes.html and player.html
 */

let currentAudio = null;
const preloadedAudio = {};

/**
 * Play an audio file from URL
 * @param {string} url - Audio file URL
 * @returns {Promise<void>}
 */
export async function playAudioFile(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve();
      return;
    }

    let audio = preloadedAudio[url];
    if (!audio) {
      audio = new Audio(url);
      preloadedAudio[url] = audio;
    }

    audio.currentTime = 0;
    currentAudio = audio;

    audio.onended = () => {
      currentAudio = null;
      resolve();
    };

    audio.onerror = (error) => {
      console.error('Audio playback failed:', error);
      currentAudio = null;
      resolve();
    };

    audio.play().catch(error => {
      console.error('Audio play() failed:', error);
      resolve();
    });
  });
}

/**
 * Play text using Text-to-Speech
 * @param {string} text - Text to speak
 * @param {string} lang - Language code ('ko' or 'ja')
 * @returns {Promise<void>}
 */
export async function playTTSAudio(text, lang = 'ko') {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !text) {
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ko' ? 'ko-KR' : 'ja-JP';
    utterance.rate = lang === 'ko' ? 1.0 : 1.2;

    utterance.onend = () => resolve();
    utterance.onerror = (error) => {
      console.error('TTS error:', error);
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop all audio playback
 */
export function stopAllAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/**
 * Preload audio files for faster playback
 * @param {string[]} urls - Array of audio URLs to preload
 */
export function preloadAudio(urls) {
  urls.forEach(url => {
    if (url && !preloadedAudio[url]) {
      const audio = new Audio(url);
      audio.preload = 'auto';
      preloadedAudio[url] = audio;
    }
  });
}

/**
 * Get currently playing audio element
 * @returns {HTMLAudioElement|null}
 */
export function getCurrentAudio() {
  return currentAudio;
}

/**
 * Check if audio is currently playing
 * @returns {boolean}
 */
export function isAudioPlaying() {
  return currentAudio !== null && !currentAudio.paused;
}
