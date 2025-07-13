# 안드로이드 앱 백그라운드 오디오 설정 가이드

## 개요
이 가이드는 Replit 웹앱을 안드로이드 스튜디오를 통해 패키징하여 APK로 만들 때, 백그라운드 오디오 재생을 구현하는 방법을 설명합니다.

## 필요한 파일들
1. `android-background-audio.js` - 백그라운드 오디오 플레이어 클래스
2. `android-integration-example.js` - 웹앱과 안드로이드 플레이어 연동 코드
3. 안드로이드 매니페스트 권한 설정
4. 안드로이드 네이티브 코드 (WebView 설정)

## 1. 안드로이드 매니페스트 설정

### AndroidManifest.xml에 추가할 권한:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- 백그라운드 오디오 재생을 위한 권한 -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
```

### Application 태그 안에 추가:
```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config">
    
    <!-- 백그라운드 오디오 재생을 위한 서비스 -->
    <service android:name=".AudioPlaybackService"
        android:foregroundServiceType="mediaPlayback"
        android:exported="false" />
</application>
```

## 2. 안드로이드 네이티브 코드 예시

### MainActivity.java
```java
public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private AudioPlaybackService audioService;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        setupWebView();
        setupAudioService();
    }
    
    private void setupWebView() {
        webView = findViewById(R.id.webview);
        WebSettings webSettings = webView.getSettings();
        
        // JavaScript 활성화
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        
        // 백그라운드 오디오 재생 허용
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // JavaScript 인터페이스 추가
        webView.addJavascriptInterface(new AndroidBridge(), "Android");
        
        // WebView 클라이언트 설정
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                
                // JavaScript 파일 로드
                loadJavaScriptFiles();
            }
        });
        
        // 웹앱 URL 로드
        webView.loadUrl("https://your-replit-app-url.com");
    }
    
    private void loadJavaScriptFiles() {
        // 백그라운드 오디오 플레이어 스크립트 로드
        String script1 = loadAssetFile("android-background-audio.js");
        String script2 = loadAssetFile("android-integration-example.js");
        
        webView.evaluateJavascript(script1, null);
        webView.evaluateJavascript(script2, null);
    }
    
    private String loadAssetFile(String fileName) {
        try {
            InputStream is = getAssets().open(fileName);
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            return new String(buffer);
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }
    }
    
    // JavaScript에서 호출할 수 있는 안드로이드 함수들
    public class AndroidBridge {
        @JavascriptInterface
        public void updatePlaybackState(String stateJson) {
            // 재생 상태 업데이트
            runOnUiThread(() -> {
                updateNotification(stateJson);
            });
        }
        
        @JavascriptInterface
        public void showToast(String message) {
            runOnUiThread(() -> {
                Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
            });
        }
    }
    
    private void updateNotification(String stateJson) {
        // 미디어 알림 업데이트 로직
        if (audioService != null) {
            audioService.updateNotification(stateJson);
        }
    }
}
```

### AudioPlaybackService.java
```java
public class AudioPlaybackService extends Service {
    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "audio_playback_channel";
    
    private NotificationManager notificationManager;
    private MediaSession mediaSession;
    
    @Override
    public void onCreate() {
        super.onCreate();
        
        notificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        createNotificationChannel();
        setupMediaSession();
    }
    
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "일본어 학습 오디오",
                NotificationManager.IMPORTANCE_LOW
            );
            notificationManager.createNotificationChannel(channel);
        }
    }
    
    private void setupMediaSession() {
        mediaSession = new MediaSession(this, "JapaneseAudioPlayer");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public boolean onMediaButtonEvent(Intent mediaButtonEvent) {
                // 미디어 버튼 이벤트 처리
                return super.onMediaButtonEvent(mediaButtonEvent);
            }
        });
        mediaSession.setActive(true);
    }
    
    public void updateNotification(String stateJson) {
        try {
            JSONObject state = new JSONObject(stateJson);
            JSONObject currentCard = state.getJSONObject("currentCard");
            
            String title = currentCard.getString("japanese");
            String artist = "PALM 시리즈";
            boolean isPlaying = state.getBoolean("isPlaying");
            
            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_music_note)
                .setContentTitle(title)
                .setContentText(artist)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true);
            
            // 재생/일시정지 버튼
            if (isPlaying) {
                builder.addAction(R.drawable.ic_pause, "일시정지", 
                    getPendingIntent("pause"));
            } else {
                builder.addAction(R.drawable.ic_play, "재생", 
                    getPendingIntent("play"));
            }
            
            // 이전/다음 버튼
            builder.addAction(R.drawable.ic_skip_previous, "이전", 
                getPendingIntent("previous"));
            builder.addAction(R.drawable.ic_skip_next, "다음", 
                getPendingIntent("next"));
            
            startForeground(NOTIFICATION_ID, builder.build());
            
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
    
    private PendingIntent getPendingIntent(String action) {
        Intent intent = new Intent(this, AudioControlReceiver.class);
        intent.setAction(action);
        return PendingIntent.getBroadcast(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT);
    }
    
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
```

## 3. JavaScript 사용법

### 기본 설정
```javascript
// 1. 플레이리스트 설정
const flashcards = [
    {
        japanese: "こんにちは",
        korean: "안녕하세요",
        audioUrl: "https://example.com/audio1.mp3",
        koreanAudioUrl: "https://example.com/audio1_kr.mp3",
        characterImage: "https://example.com/character1.png"
    }
];

AndroidAudioPlayer.setPlaylist(flashcards, "001");
```

### 재생 제어
```javascript
// 재생 시작
AndroidAudioPlayer.play();

// 일시정지
AndroidAudioPlayer.pause();

// 다음 카드
AndroidAudioPlayer.nextCard();

// 이전 카드
AndroidAudioPlayer.previousCard();

// 특정 카드로 이동
AndroidAudioPlayer.goToCard(5);
```

### 재생 모드 설정
```javascript
// 기본 모드 (일본어만 재생)
AndroidAudioPlayer.setPlaybackMode("basic");

// 표현 모드 (일본어 → 3초 대기 → 한국어)
AndroidAudioPlayer.setPlaybackMode("expression");
```

### 상태 확인
```javascript
const state = AndroidAudioPlayer.getPlaybackState();
console.log(state);
/*
{
    isPlaying: true,
    currentIndex: 2,
    totalCards: 42,
    currentCard: { japanese: "...", korean: "..." },
    playbackMode: "basic"
}
*/
```

## 4. 안드로이드 프로젝트 구조

```
app/
├── src/main/
│   ├── java/com/yourpackage/
│   │   ├── MainActivity.java
│   │   ├── AudioPlaybackService.java
│   │   └── AudioControlReceiver.java
│   ├── assets/
│   │   ├── android-background-audio.js
│   │   └── android-integration-example.js
│   └── res/
│       ├── drawable/
│       │   ├── ic_play.xml
│       │   ├── ic_pause.xml
│       │   ├── ic_skip_previous.xml
│       │   └── ic_skip_next.xml
│       └── layout/
│           └── activity_main.xml
└── build.gradle
```

## 5. 테스트 방법

### 1. 기본 재생 테스트
```javascript
// 콘솔에서 실행
AndroidAudioPlayer.play();
```

### 2. 백그라운드 재생 테스트
1. 앱에서 음성 재생 시작
2. 홈 버튼 눌러서 백그라운드로 전환
3. 알림 패널에서 미디어 컨트롤 확인
4. 다른 앱 실행 중에도 오디오 재생 지속 확인

### 3. 미디어 세션 테스트
1. 블루투스 헤드폰 연결
2. 헤드폰 재생/일시정지 버튼 테스트
3. 자동차 오디오 시스템과 연동 테스트

## 6. 문제 해결

### 백그라운드 재생이 안 될 때
1. 앱 설정에서 백그라운드 실행 권한 확인
2. 배터리 최적화 예외 설정
3. 자동 실행 권한 확인

### 오디오가 끊길 때
1. 네트워크 연결 상태 확인
2. 오디오 파일 URL 유효성 확인
3. 프리로딩 설정 확인

## 7. 추가 기능

### 다운로드 기능 추가
```javascript
// 오프라인 재생을 위한 오디오 다운로드
AndroidAudioPlayer.downloadAudioFiles(flashcards);
```

### 재생 속도 조절
```javascript
// 재생 속도 설정 (0.5x ~ 2.0x)
AndroidAudioPlayer.setPlaybackSpeed(1.5);
```

### 반복 재생
```javascript
// 현재 카드 반복
AndroidAudioPlayer.setRepeatMode("one");

// 전체 플레이리스트 반복
AndroidAudioPlayer.setRepeatMode("all");
```

이 가이드를 따라 설정하면 안드로이드 앱에서 백그라운드 오디오 재생이 가능한 일본어 학습 앱을 만들 수 있습니다.