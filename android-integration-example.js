/**
 * 안드로이드 앱 통합 예시 코드
 * Android App Integration Example
 * 
 * 이 코드는 현재 웹앱과 안드로이드 백그라운드 오디오 플레이어를 연결하는 예시입니다.
 */

// 1. 기존 웹앱의 데이터를 안드로이드 플레이어로 전송하는 함수
function initializeAndroidPlayer(episodeSequence) {
    // 현재 웹앱에서 플래시카드 데이터 가져오기
    const flashcards = currentEpisodeCards.map(card => ({
        japanese: card.japanese,
        korean: card.korean,
        audioUrl: card.audioUrl,
        koreanAudioUrl: card.koreanAudioUrl,
        characterImage: card.characterImage,
        speaker: card.speaker,
        expressionCards: card.expressionCardIds || []
    }));
    
    // 안드로이드 플레이어에 플레이리스트 설정
    AndroidAudioPlayer.setPlaylist(flashcards, episodeSequence);
    
    console.log(`안드로이드 플레이어 초기화 완료: ${flashcards.length}개 카드`);
}

// 2. 웹앱 UI와 안드로이드 플레이어 동기화
function syncWithAndroidPlayer() {
    const state = AndroidAudioPlayer.getPlaybackState();
    
    // 현재 카드 인덱스 동기화
    if (state.currentIndex !== currentCardIndex) {
        currentCardIndex = state.currentIndex;
        loadCard(currentCardIndex);
        updateNavigationButtons();
    }
    
    // 재생 상태 UI 업데이트
    updatePlaybackUI(state.isPlaying);
}

// 3. 안드로이드 네이티브 함수 (WebView에서 호출)
function setupAndroidBridge() {
    // 안드로이드에서 호출할 수 있는 JavaScript 함수들
    window.AndroidBridge = {
        // 시퀀스 로드
        loadSequence: (sequenceNumber) => {
            const sequenceName = `#${sequenceNumber.toString().padStart(3, '0')}`;
            loadEpisode(sequenceName);
            initializeAndroidPlayer(sequenceName);
        },
        
        // 현재 재생 상태 가져오기
        getPlaybackState: () => {
            return AndroidAudioPlayer.getPlaybackState();
        },
        
        // 특정 카드로 이동
        goToCard: (index) => {
            AndroidAudioPlayer.goToCard(index);
            syncWithAndroidPlayer();
        },
        
        // 재생 모드 변경
        setPlaybackMode: (mode) => {
            AndroidAudioPlayer.setPlaybackMode(mode);
        },
        
        // 모든 시퀀스 목록 가져오기
        getAvailableSequences: () => {
            return Object.keys(episodeData).sort();
        },
        
        // 현재 시퀀스의 카드 수 가져오기
        getCurrentSequenceCardCount: () => {
            return currentEpisodeCards.length;
        }
    };
}

// 4. 안드로이드 앱 시작시 호출할 초기화 함수
function initializeForAndroid() {
    // 안드로이드 브릿지 설정
    setupAndroidBridge();
    
    // 기본 시퀀스 로드 (예: #001)
    if (Object.keys(episodeData).length > 0) {
        const firstSequence = Object.keys(episodeData).sort()[0];
        loadEpisode(firstSequence);
        initializeAndroidPlayer(firstSequence);
    }
    
    // 주기적으로 상태 동기화 (선택사항)
    setInterval(syncWithAndroidPlayer, 1000);
    
    console.log('안드로이드 앱 초기화 완료');
}

// 5. 웹앱 UI 업데이트 함수
function updateWebUI(playbackState) {
    // 재생 버튼 상태 업데이트
    const playButton = document.getElementById('play-button');
    const pauseButton = document.getElementById('pause-button');
    
    if (playbackState.isPlaying) {
        if (playButton) playButton.style.display = 'none';
        if (pauseButton) pauseButton.style.display = 'block';
    } else {
        if (playButton) playButton.style.display = 'block';
        if (pauseButton) pauseButton.style.display = 'none';
    }
    
    // 진행률 표시
    const progressText = document.getElementById('progress-text');
    if (progressText) {
        progressText.textContent = `${playbackState.currentIndex + 1} / ${playbackState.totalCards}`;
    }
    
    // 현재 카드 정보 표시
    const currentCardInfo = document.getElementById('current-card-info');
    if (currentCardInfo && playbackState.currentCard) {
        currentCardInfo.innerHTML = `
            <div class="japanese">${playbackState.currentCard.japanese}</div>
            <div class="korean">${playbackState.currentCard.korean}</div>
        `;
    }
}

// 6. 안드로이드 앱에서 사용할 수 있는 편의 함수들
window.AndroidUtils = {
    // 전체 시퀀스 자동 재생
    playAllSequences: () => {
        const sequences = Object.keys(episodeData).sort();
        let currentSeqIndex = 0;
        
        function playNextSequence() {
            if (currentSeqIndex < sequences.length) {
                const sequence = sequences[currentSeqIndex];
                AndroidBridge.loadSequence(sequence.replace('#', ''));
                
                // 현재 시퀀스 재생 완료 후 다음 시퀀스로
                const checkCompletion = setInterval(() => {
                    const state = AndroidAudioPlayer.getPlaybackState();
                    if (!state.isPlaying && state.currentIndex === state.totalCards - 1) {
                        clearInterval(checkCompletion);
                        currentSeqIndex++;
                        setTimeout(playNextSequence, 2000); // 2초 대기 후 다음 시퀀스
                    }
                }, 1000);
            }
        }
        
        playNextSequence();
    },
    
    // 랜덤 카드 재생
    playRandomCard: () => {
        const sequences = Object.keys(episodeData);
        const randomSeq = sequences[Math.floor(Math.random() * sequences.length)];
        const cards = episodeData[randomSeq];
        const randomIndex = Math.floor(Math.random() * cards.length);
        
        AndroidBridge.loadSequence(randomSeq.replace('#', ''));
        AndroidBridge.goToCard(randomIndex);
    },
    
    // 즐겨찾기 카드만 재생 (예시)
    playFavoriteCards: (favoriteIndexes) => {
        // favoriteIndexes는 [시퀀스, 카드인덱스] 형태의 배열
        const playlist = favoriteIndexes.map(([seq, index]) => {
            const sequenceName = `#${seq.toString().padStart(3, '0')}`;
            return episodeData[sequenceName][index];
        });
        
        AndroidAudioPlayer.setPlaylist(playlist, 'favorites');
        AndroidAudioPlayer.play();
    }
};

// 7. 안드로이드 앱 시작시 자동 실행
document.addEventListener('DOMContentLoaded', () => {
    // 안드로이드 환경 감지
    const isAndroid = typeof Android !== 'undefined' || navigator.userAgent.includes('Android');
    
    if (isAndroid) {
        console.log('안드로이드 환경 감지됨');
        
        // 기존 웹앱 초기화 완료 대기
        const waitForInit = setInterval(() => {
            if (Object.keys(episodeData).length > 0) {
                clearInterval(waitForInit);
                initializeForAndroid();
            }
        }, 100);
    }
});

// 8. 안드로이드 앱에서 사용할 수 있는 간단한 컨트롤러 생성
function createAndroidController() {
    const controller = {
        // 재생/일시정지 토글
        togglePlayPause: () => {
            const state = AndroidAudioPlayer.getPlaybackState();
            if (state.isPlaying) {
                AndroidAudioPlayer.pause();
            } else {
                AndroidAudioPlayer.play();
            }
        },
        
        // 다음 카드
        next: () => AndroidAudioPlayer.nextCard(),
        
        // 이전 카드
        previous: () => AndroidAudioPlayer.previousCard(),
        
        // 현재 상태
        getState: () => AndroidAudioPlayer.getPlaybackState(),
        
        // 특정 시퀀스로 이동
        goToSequence: (sequenceNumber) => {
            AndroidBridge.loadSequence(sequenceNumber);
        },
        
        // 현재 웹앱 데이터를 Android.playPlaylist 형태로 변환
        playCurrentEpisodeAsPlaylist: () => {
            if (!currentEpisodeCards || currentEpisodeCards.length === 0) {
                console.log('현재 에피소드 카드가 없습니다');
                return;
            }
            
            const playlist = currentEpisodeCards.map(card => ({
                japanese: card.japanese,
                korean: card.korean,
                audioUrl: card.audioUrl,
                koreanAudioUrl: card.koreanAudioUrl,
                characterImage: card.characterImage,
                speaker: card.speaker
            }));
            
            Android.playPlaylist(JSON.stringify(playlist));
        }
    };
    
    // 안드로이드 네이티브 코드에서 접근 가능하도록 전역 등록
    window.PlayerController = controller;
    
    return controller;
}

// 컨트롤러 생성
createAndroidController();

// 9. 현재 웹앱 데이터를 안드로이드 형태로 변환하는 유틸리티 함수들
window.AndroidPlaylistUtils = {
    /**
     * 현재 시퀀스를 Android.playPlaylist 형태로 재생
     */
    playCurrentSequence: () => {
        if (!currentEpisodeCards || currentEpisodeCards.length === 0) {
            console.log('현재 시퀀스에 카드가 없습니다');
            return false;
        }
        
        const playlist = currentEpisodeCards.map(card => ({
            japanese: card.japanese,
            korean: card.korean,
            audioUrl: card.audioUrl,
            koreanAudioUrl: card.koreanAudioUrl,
            characterImage: card.characterImage,
            speaker: card.speaker
        }));
        
        const result = Android.playPlaylist(JSON.stringify(playlist));
        console.log('현재 시퀀스 재생 시작:', result);
        return result;
    },
    
    /**
     * 특정 시퀀스를 Android.playPlaylist 형태로 재생
     */
    playSequence: (sequenceNumber) => {
        const sequenceName = `#${sequenceNumber.toString().padStart(3, '0')}`;
        
        if (!episodeData[sequenceName]) {
            console.log(`시퀀스 ${sequenceName}를 찾을 수 없습니다`);
            return false;
        }
        
        const cards = episodeData[sequenceName];
        const playlist = cards.map(card => ({
            japanese: card.japanese,
            korean: card.korean,
            audioUrl: card.audioUrl,
            koreanAudioUrl: card.koreanAudioUrl,
            characterImage: card.characterImage,
            speaker: card.speaker
        }));
        
        const result = Android.playPlaylist(JSON.stringify(playlist));
        console.log(`시퀀스 ${sequenceName} 재생 시작:`, result);
        return result;
    },
    
    /**
     * 모든 시퀀스를 하나의 플레이리스트로 재생
     */
    playAllSequences: () => {
        const allCards = [];
        const sequences = Object.keys(episodeData).sort();
        
        sequences.forEach(sequenceName => {
            const cards = episodeData[sequenceName];
            cards.forEach(card => {
                allCards.push({
                    japanese: card.japanese,
                    korean: card.korean,
                    audioUrl: card.audioUrl,
                    koreanAudioUrl: card.koreanAudioUrl,
                    characterImage: card.characterImage,
                    speaker: card.speaker
                });
            });
        });
        
        const result = Android.playPlaylist(JSON.stringify(allCards));
        console.log(`전체 시퀀스 재생 시작 (${allCards.length}개 카드):`, result);
        return result;
    },
    
    /**
     * 특정 카드들만 선택해서 재생
     */
    playSelectedCards: (cardIndices) => {
        if (!currentEpisodeCards || currentEpisodeCards.length === 0) {
            console.log('현재 시퀀스에 카드가 없습니다');
            return false;
        }
        
        const selectedCards = cardIndices
            .filter(index => index >= 0 && index < currentEpisodeCards.length)
            .map(index => {
                const card = currentEpisodeCards[index];
                return {
                    japanese: card.japanese,
                    korean: card.korean,
                    audioUrl: card.audioUrl,
                    koreanAudioUrl: card.koreanAudioUrl,
                    characterImage: card.characterImage,
                    speaker: card.speaker
                };
            });
        
        const result = Android.playPlaylist(JSON.stringify(selectedCards));
        console.log(`선택된 카드 재생 시작 (${selectedCards.length}개):`, result);
        return result;
    }
};

console.log('안드로이드 통합 코드 로드 완료');