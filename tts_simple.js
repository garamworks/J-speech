// Simple TTS function without gender-based adjustments
function speakJapanese() {
    console.log('=== speakJapanese function started ===');
    
    // Cancel any ongoing speech
    speechSynthesis.cancel();
    console.log('Speech synthesis cancelled');
    
    console.log('currentEpisodeCards:', currentEpisodeCards);
    console.log('currentCardIndex:', currentCardIndex);
    console.log('currentEpisodeCards length:', currentEpisodeCards ? currentEpisodeCards.length : 'undefined');
    
    if (!currentEpisodeCards || currentEpisodeCards.length === 0) {
        console.error('No episode cards available');
        return;
    }
    
    if (currentCardIndex < 0 || currentCardIndex >= currentEpisodeCards.length) {
        console.error('Invalid card index:', currentCardIndex);
        return;
    }
    
    const currentCard = currentEpisodeCards[currentCardIndex];
    console.log('Current card:', currentCard);
    
    if (!currentCard) {
        console.error('Current card is null or undefined');
        return;
    }
    
    if (!currentCard.japanese) {
        console.error('No Japanese text in current card');
        return;
    }
    
    console.log('Speaking Japanese text:', currentCard.japanese);
    const utterance = new SpeechSynthesisUtterance(currentCard.japanese);
    console.log('Utterance created');
    
    // Wait for voices to load on mobile browsers
    const voices = speechSynthesis.getVoices();
    console.log('Available voices count:', voices.length);
    
    if (voices.length === 0) {
        console.log('No voices available, waiting for voiceschanged event');
        // Retry after voices are loaded
        speechSynthesis.addEventListener('voiceschanged', () => {
            console.log('Voices changed event triggered');
            speakJapanese();
        }, { once: true });
        return;
    }
    
    // Use default Japanese voice without gender-based adjustments
    const selectedVoice = voices.find(voice => 
        voice.lang === 'ja-JP' || voice.lang === 'ja'
    );
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('Selected voice:', selectedVoice.name);
    }
    
    utterance.lang = 'ja-JP';
    // Use default pitch and rate settings (no adjustments)
    
    // Visual feedback for speaking
    speakerBtn.style.background = '#2b6cb0';
    speakerBtnBack.style.background = '#2b6cb0';
    
    utterance.onend = () => {
        speakerBtn.style.background = '#4299e1';
        speakerBtnBack.style.background = '#4299e1';
    };
    
    utterance.onerror = (event) => {
        speakerBtn.style.background = '#4299e1';
        speakerBtnBack.style.background = '#4299e1';
        console.warn('Speech synthesis error - Japanese voice may not be available');
        console.error('TTS Error:', event);
        
        // Log available voices for debugging on mobile
        console.log('Available voices:', voices.map(v => `${v.name} (${v.lang})`));
    };
    
    console.log('About to speak with utterance:', utterance);
    speechSynthesis.speak(utterance);
    console.log('speechSynthesis.speak() called');
    console.log('=== speakJapanese function ended ===');
}