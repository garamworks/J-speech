/**
 * Android Background Audio Player for Japanese Learning App
 * 안드로이드 백그라운드 재생을 위한 JavaScript 코드
 * 
 * 이 코드는 안드로이드 스튜디오에서 WebView를 통해 패키징된 앱에서
 * 백그라운드 오디오 재생을 지원하기 위한 것입니다.
 */

class AndroidBackgroundAudioPlayer {
    constructor() {
        this.currentAudio = null;
        this.playlist = [];
        this.currentIndex = 0;
        this.isPlaying = false;
        this.playbackMode = 'basic'; // 'basic' or 'expression'
        this.preloadedAudios = new Map();
        this.wakeLock = null;
        
        this.initializeBackgroundSupport();
    }

    /**
     * 백그라운드 재생 초기화
     */
    initializeBackgroundSupport() {
        // Page Visibility API로 백그라운드 상태 감지
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('앱이 백그라운드로 전환됨');
                this.handleBackgroundTransition();
            } else {
                console.log('앱이 포그라운드로 전환됨');
                this.handleForegroundTransition();
            }
        });

        // 화면 잠금 방지 (선택사항)
        this.requestWakeLock();
        
        // 오디오 포커스 관리
        this.setupAudioFocus();
    }

    /**
     * 화면 잠금 방지 요청
     */
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock 활성화됨');
            }
        } catch (err) {
            console.log('Wake lock 요청 실패:', err);
        }
    }

    /**
     * 백그라운드 전환 처리
     */
    handleBackgroundTransition() {
        // 백그라운드에서도 오디오 재생 유지
        if (this.currentAudio && !this.currentAudio.paused) {
            console.log('백그라운드 오디오 재생 유지');
            // 안드로이드 알림 표시를 위한 메타데이터 설정
            this.setMediaMetadata();
        }
    }

    /**
     * 포그라운드 전환 처리
     */
    handleForegroundTransition() {
        // 포그라운드 복귀 시 UI 업데이트
        if (this.currentAudio && !this.currentAudio.paused) {
            console.log('포그라운드 복귀 - UI 업데이트');
            this.updateUI();
        }
    }

    /**
     * 미디어 메타데이터 설정 (안드로이드 알림용)
     */
    setMediaMetadata() {
        if ('mediaSession' in navigator) {
            const currentCard = this.getCurrentCardData();
            
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentCard.japanese || '일본어 학습',
                artist: 'PALM 시리즈',
                album: `시퀀스 #${this.getCurrentSequence()}`,
                artwork: [
                    {
                        src: currentCard.characterImage || '/default-icon.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });

            // 미디어 세션 액션 핸들러 설정
            navigator.mediaSession.setActionHandler('play', () => {
                this.play();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                this.pause();
            });

            navigator.mediaSession.setActionHandler('previoustrack', () => {
                this.previousCard();
            });

            navigator.mediaSession.setActionHandler('nexttrack', () => {
                this.nextCard();
            });
        }
    }

    /**
     * 오디오 포커스 설정
     */
    setupAudioFocus() {
        // 다른 오디오 앱의 간섭 방지
        if (this.currentAudio) {
            this.currentAudio.addEventListener('play', () => {
                // 다른 오디오 정지
                document.querySelectorAll('audio, video').forEach(media => {
                    if (media !== this.currentAudio) {
                        media.pause();
                    }
                });
            });
        }
    }

    /**
     * 플레이리스트 설정
     */
    setPlaylist(flashcards, sequence) {
        this.playlist = flashcards.map(card => ({
            japanese: card.japanese,
            korean: card.korean,
            audioUrl: card.audioUrl,
            koreanAudioUrl: card.koreanAudioUrl,
            characterImage: card.characterImage,
            speaker: card.speaker,
            expressionCards: card.expressionCardIds || []
        }));
        
        this.currentSequence = sequence;
        this.currentIndex = 0;
        
        // 오디오 프리로드 시작
        this.preloadAudios();
        
        console.log(`플레이리스트 설정 완료: ${this.playlist.length}개 카드`);
    }

    /**
     * 오디오 프리로드
     */
    preloadAudios() {
        const preloadCount = Math.min(5, this.playlist.length); // 최대 5개까지 프리로드
        
        for (let i = 0; i < preloadCount; i++) {
            const card = this.playlist[i];
            if (card.audioUrl) {
                const audio = new Audio(card.audioUrl);
                audio.preload = 'auto';
                audio.load();
                this.preloadedAudios.set(`${i}_jp`, audio);
                
                // 한국어 오디오도 프리로드
                if (card.koreanAudioUrl) {
                    const koreanAudio = new Audio(card.koreanAudioUrl);
                    koreanAudio.preload = 'auto';
                    koreanAudio.load();
                    this.preloadedAudios.set(`${i}_kr`, koreanAudio);
                }
            }
        }
    }

    /**
     * 재생 시작
     */
    async play() {
        if (this.playlist.length === 0) {
            console.log('플레이리스트가 비어있습니다');
            return;
        }

        const currentCard = this.playlist[this.currentIndex];
        if (!currentCard.audioUrl) {
            console.log('현재 카드에 오디오가 없습니다');
            this.nextCard();
            return;
        }

        try {
            // 프리로드된 오디오 사용 또는 새로 생성
            const audioKey = `${this.currentIndex}_jp`;
            this.currentAudio = this.preloadedAudios.get(audioKey) || new Audio(currentCard.audioUrl);
            
            // 오디오 이벤트 리스너 설정
            this.currentAudio.onended = () => {
                console.log('오디오 재생 완료');
                this.handleAudioEnd();
            };

            this.currentAudio.onerror = (error) => {
                console.error('오디오 재생 에러:', error);
                this.nextCard();
            };

            // 재생 시작
            await this.currentAudio.play();
            this.isPlaying = true;
            
            // 미디어 메타데이터 설정
            this.setMediaMetadata();
            
            // UI 업데이트
            this.updateUI();
            
            console.log(`재생 시작: ${currentCard.japanese}`);
            
        } catch (error) {
            console.error('재생 실패:', error);
            this.nextCard();
        }
    }

    /**
     * 재생 일시정지
     */
    pause() {
        if (this.currentAudio && !this.currentAudio.paused) {
            this.currentAudio.pause();
            this.isPlaying = false;
            console.log('재생 일시정지');
        }
    }

    /**
     * 재생 중지
     */
    stop() {
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio.currentTime = 0;
            this.isPlaying = false;
            console.log('재생 중지');
        }
    }

    /**
     * 다음 카드로 이동
     */
    nextCard() {
        this.stop();
        
        if (this.currentIndex < this.playlist.length - 1) {
            this.currentIndex++;
            this.play();
        } else {
            console.log('플레이리스트 끝에 도달');
            this.isPlaying = false;
        }
    }

    /**
     * 이전 카드로 이동
     */
    previousCard() {
        this.stop();
        
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.play();
        } else {
            console.log('플레이리스트 시작에 도달');
            this.currentIndex = 0;
            this.play();
        }
    }

    /**
     * 특정 카드로 이동
     */
    goToCard(index) {
        if (index >= 0 && index < this.playlist.length) {
            this.stop();
            this.currentIndex = index;
            this.play();
        }
    }

    /**
     * 오디오 재생 완료 처리
     */
    handleAudioEnd() {
        if (this.playbackMode === 'expression') {
            // 표현 모드: 일본어 → 한국어 → 다음 카드
            this.playExpressionMode();
        } else {
            // 기본 모드: 바로 다음 카드
            setTimeout(() => {
                this.nextCard();
            }, 1000); // 1초 대기 후 다음 카드
        }
    }

    /**
     * 표현 모드 재생
     */
    async playExpressionMode() {
        const currentCard = this.playlist[this.currentIndex];
        
        if (currentCard.koreanAudioUrl) {
            try {
                // 3초 대기 후 한국어 재생
                setTimeout(async () => {
                    const koreanAudioKey = `${this.currentIndex}_kr`;
                    const koreanAudio = this.preloadedAudios.get(koreanAudioKey) || new Audio(currentCard.koreanAudioUrl);
                    
                    koreanAudio.onended = () => {
                        // 한국어 재생 완료 후 다음 카드
                        setTimeout(() => {
                            this.nextCard();
                        }, 1000);
                    };
                    
                    await koreanAudio.play();
                    console.log(`한국어 재생: ${currentCard.korean}`);
                }, 3000);
                
            } catch (error) {
                console.error('한국어 재생 에러:', error);
                this.nextCard();
            }
        } else {
            // 한국어 오디오가 없으면 바로 다음 카드
            this.nextCard();
        }
    }

    /**
     * 재생 모드 변경
     */
    setPlaybackMode(mode) {
        this.playbackMode = mode;
        console.log(`재생 모드 변경: ${mode}`);
    }

    /**
     * 현재 카드 데이터 반환
     */
    getCurrentCardData() {
        return this.playlist[this.currentIndex] || {};
    }

    /**
     * 현재 시퀀스 반환
     */
    getCurrentSequence() {
        return this.currentSequence || '001';
    }

    /**
     * 재생 상태 반환
     */
    getPlaybackState() {
        return {
            isPlaying: this.isPlaying,
            currentIndex: this.currentIndex,
            totalCards: this.playlist.length,
            currentCard: this.getCurrentCardData(),
            playbackMode: this.playbackMode
        };
    }

    /**
     * UI 업데이트 (안드로이드 앱에서 구현)
     */
    updateUI() {
        const state = this.getPlaybackState();
        
        // 안드로이드 앱으로 상태 전송
        if (typeof Android !== 'undefined' && Android.updatePlaybackState) {
            Android.updatePlaybackState(JSON.stringify(state));
        }
        
        // 웹 UI 업데이트
        if (typeof updateWebUI === 'function') {
            updateWebUI(state);
        }
    }

    /**
     * 리소스 정리
     */
    cleanup() {
        this.stop();
        this.preloadedAudios.clear();
        
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
        }
    }
}

// 전역 인스턴스 생성
const backgroundAudioPlayer = new AndroidBackgroundAudioPlayer();

// 안드로이드 앱에서 사용할 수 있는 전역 함수들
window.AndroidAudioPlayer = {
    // 플레이리스트 설정
    setPlaylist: (flashcards, sequence) => {
        backgroundAudioPlayer.setPlaylist(flashcards, sequence);
    },
    
    // 재생 제어
    play: () => backgroundAudioPlayer.play(),
    pause: () => backgroundAudioPlayer.pause(),
    stop: () => backgroundAudioPlayer.stop(),
    
    // 탐색
    nextCard: () => backgroundAudioPlayer.nextCard(),
    previousCard: () => backgroundAudioPlayer.previousCard(),
    goToCard: (index) => backgroundAudioPlayer.goToCard(index),
    
    // 설정
    setPlaybackMode: (mode) => backgroundAudioPlayer.setPlaybackMode(mode),
    
    // 상태 조회
    getPlaybackState: () => backgroundAudioPlayer.getPlaybackState(),
    
    // 정리
    cleanup: () => backgroundAudioPlayer.cleanup()
};

// 안드로이드 네이티브에서 직접 호출할 수 있는 전역 Android 객체
window.Android = {
    /**
     * JSON 형태의 플레이리스트를 받아서 재생하는 함수
     * @param {string} playlistJson - JSON 문자열 형태의 플레이리스트
     * 예시: Android.playPlaylist(JSON.stringify([
     *   { audioUrl: "https://.../1.mp3" },
     *   { audioUrl: "https://.../2.mp3" }
     * ]))
     */
    playPlaylist: (playlistJson) => {
        try {
            const playlistData = JSON.parse(playlistJson);
            
            // JSON 데이터를 플래시카드 형태로 변환
            const flashcards = playlistData.map((item, index) => ({
                japanese: item.japanese || `오디오 ${index + 1}`,
                korean: item.korean || `Audio ${index + 1}`,
                audioUrl: item.audioUrl,
                koreanAudioUrl: item.koreanAudioUrl || null,
                characterImage: item.characterImage || null,
                speaker: item.speaker || 'Unknown',
                expressionCards: item.expressionCards || []
            }));
            
            // 플레이리스트 설정
            backgroundAudioPlayer.setPlaylist(flashcards, 'android-playlist');
            
            // 즉시 재생 시작
            backgroundAudioPlayer.play();
            
            console.log(`Android.playPlaylist: ${flashcards.length}개 오디오 재생 시작`);
            
            return {
                success: true,
                message: `${flashcards.length}개 오디오 재생 시작`,
                totalCards: flashcards.length
            };
            
        } catch (error) {
            console.error('Android.playPlaylist 에러:', error);
            return {
                success: false,
                message: `플레이리스트 재생 실패: ${error.message}`,
                totalCards: 0
            };
        }
    },
    
    /**
     * 현재 재생 상태를 JSON 문자열로 반환
     */
    getPlaybackStateJson: () => {
        const state = backgroundAudioPlayer.getPlaybackState();
        return JSON.stringify(state);
    },
    
    /**
     * 재생 제어 함수들
     */
    play: () => {
        backgroundAudioPlayer.play();
        return JSON.stringify({ success: true, action: 'play' });
    },
    
    pause: () => {
        backgroundAudioPlayer.pause();
        return JSON.stringify({ success: true, action: 'pause' });
    },
    
    stop: () => {
        backgroundAudioPlayer.stop();
        return JSON.stringify({ success: true, action: 'stop' });
    },
    
    next: () => {
        backgroundAudioPlayer.nextCard();
        return JSON.stringify({ success: true, action: 'next' });
    },
    
    previous: () => {
        backgroundAudioPlayer.previousCard();
        return JSON.stringify({ success: true, action: 'previous' });
    },
    
    /**
     * 특정 인덱스의 오디오로 이동
     * @param {number} index - 이동할 오디오 인덱스
     */
    goToIndex: (index) => {
        backgroundAudioPlayer.goToCard(index);
        return JSON.stringify({ success: true, action: 'goToIndex', index: index });
    },
    
    /**
     * 재생 모드 설정
     * @param {string} mode - 'basic' 또는 'expression'
     */
    setMode: (mode) => {
        backgroundAudioPlayer.setPlaybackMode(mode);
        return JSON.stringify({ success: true, action: 'setMode', mode: mode });
    },
    
    /**
     * 플레이리스트 정리
     */
    cleanup: () => {
        backgroundAudioPlayer.cleanup();
        return JSON.stringify({ success: true, action: 'cleanup' });
    }
};

// 사용 예시:
/*
// 1. 플레이리스트 설정
const flashcards = [
    {
        japanese: "こんにちは",
        korean: "안녕하세요",
        audioUrl: "https://example.com/audio1.mp3",
        koreanAudioUrl: "https://example.com/audio1_kr.mp3",
        characterImage: "https://example.com/character1.png"
    },
    // ... 더 많은 카드
];

AndroidAudioPlayer.setPlaylist(flashcards, "001");

// 2. 재생 시작
AndroidAudioPlayer.play();

// 3. 재생 모드 변경
AndroidAudioPlayer.setPlaybackMode("expression");

// 4. 상태 확인
const state = AndroidAudioPlayer.getPlaybackState();
console.log(state);
*/

console.log('Android Background Audio Player 초기화 완료');