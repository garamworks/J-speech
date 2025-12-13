# J-speech - Japanese Learning Flashcard Application

일본어 학습을 위한 플래시카드 애플리케이션입니다. Notion 데이터베이스와 연동하여 대사, 표현, N1 어휘를 학습할 수 있습니다.

## 🎯 주요 기능

- **플래시카드 학습**: 일본어-한국어 대사 카드로 학습
- **자동 재생**: 플레이어 모드로 자동 재생 학습
- **표현 카드**: 문법 표현과 예문 학습
- **N1 어휘**: N1 단어 카드 연동
- **책/시퀀스 관리**: 에피소드별 체계적 학습

## 🏗️ 프로젝트 구조

```
J-speech/
├── src/                      # 프론트엔드 소스
│   ├── pages/               # HTML 페이지
│   │   ├── flashcards.html  # 플래시카드 메인
│   │   ├── player.html      # 자동 재생 플레이어
│   │   └── episodes.html    # 에피소드 선택
│   ├── lib/                 # JavaScript 모듈
│   │   ├── api-client.js    # API 클라이언트
│   │   ├── audio.js         # 오디오 유틸리티
│   │   └── helpers.js       # 헬퍼 함수
│   └── styles/              # CSS 파일
│       ├── common.css       # 공통 스타일
│       ├── flashcards.css   # 플래시카드 스타일
│       ├── player.css       # 플레이어 스타일
│       └── episodes.css     # 에피소드 스타일
├── server/                  # 백엔드 서버
│   ├── server.js           # Express 서버
│   ├── notion.js           # Notion API 로직
│   ├── config/             # 설정 파일
│   │   ├── databases.js    # DB ID 설정
│   │   └── notion-client.js # Notion 클라이언트
│   └── utils/              # 유틸리티
│       ├── notion-helpers.js # Notion 헬퍼
│       ├── cache-manager.js  # 캐시 관리
│       └── error-handler.js  # 에러 처리
├── test/                    # 테스트 파일
└── dist/                    # 빌드 출력
```

## 🚀 시작하기

### 1. 환경 설정

```.env``` 파일을 생성하고 Notion API 키를 설정하세요:

```env
GARAM_NOTION_SECRET=your_notion_api_key
DATABASE_ID=your_database_id  # optional
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

**백엔드 서버** (Port 8080):
```bash
npm run server
```

**프론트엔드 개발 서버** (Port 3000):
```bash
npm run dev
```

### 4. 접속

- **메인 페이지**: http://localhost:3000/pages/episodes.html
- **플래시카드**: http://localhost:3000/pages/flashcards.html?episode=%23197
- **플레이어**: http://localhost:3000/pages/player.html?episode=%23197

## 📝 사용 방법

### 에피소드 선택
1. `episodes.html`에서 원하는 책을 선택
2. 시퀀스(에피소드) 목록이 표시됩니다
3. 시퀀스를 클릭하면 플래시카드로 이동

### 플래시카드 학습
- **클릭**: 카드 뒤집기 (일본어 ↔ 한국어)
- **▶ 버튼**: 현재 카드 오디오 재생
- **◀ ▶ 화살표**: 이전/다음 카드

### 자동 재생 모드
- 플레이어 페이지에서 자동으로 카드가 재생됩니다
- TTS(Text-to-Speech)로 일본어와 한국어를 읽어줍니다

## 🧪 테스트

```bash
# 테스트 실행
npm test

# 테스트 UI
npm run test:ui

# 단일 실행 (watch 모드 없이)
npm run test:run
```

### 테스트 커버리지
- ✅ helpers.js: 18/18 tests passing
- ✅ api-client.js: 9/10 tests passing
- ⚠️ audio.js: 9/18 tests passing (브라우저 API 모킹 이슈)

## 🏭 프로덕션 빌드

```bash
# 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🔧 기술 스택

### 프론트엔드
- **Vite**: 빌드 도구 및 개발 서버
- **Vanilla JavaScript**: ES6 모듈
- **CSS3**: 반응형 디자인

### 백엔드
- **Express**: Node.js 웹 프레임워크
- **Notion API**: 데이터 소스
- **Custom Cache Manager**: TTL 기반 캐싱

### 개발 도구
- **Vitest**: 테스트 프레임워크
- **Happy-DOM**: DOM 환경 시뮬레이션

## 📊 API 엔드포인트

### GET /api/books
책 목록 조회
```json
[{
  "id": "book-id",
  "bookTitle": "PALM 26",
  "subtitle": "오후의 빛 I",
  "thumbnailUrl": "https://...",
  "sequenceCount": 8
}]
```

### GET /api/book/:bookId/sequences
특정 책의 시퀀스 목록
```json
[{
  "id": "seq-id",
  "sequence": "#197",
  "title": "Episode Title",
  "thumbnailUrl": "https://..."
}]
```

### GET /api/flashcards?episode=#197
플래시카드 데이터
```json
{
  "#197": [{
    "japanese": "ひななら三角公園わかるか？",
    "korean": "히나라면 삼각공원 알지?",
    "character": "🎭",
    "characterImage": "https://..."
  }]
}
```

### GET /api/expression/:id
표현 카드 상세
```json
{
  "title": "表現",
  "meaning": "의미",
  "application1": "例文1",
  "application1Korean": "예문1"
}
```

### GET /api/n1-vocabulary-multiple/:ids
N1 어휘 여러 개 조회
```json
[{
  "word": "単語",
  "meaning": "의미",
  "reading": "たんご",
  "example": "例文",
  "img": "https://..."
}]
```

## 🔄 최근 리팩토링 (2025-12)

### Phase 1-3 완료
- ✅ Vite 기반 빌드 시스템 도입
- ✅ JavaScript 모듈화 (audio.js, helpers.js, api-client.js)
- ✅ CSS 파일 분리 (common, flashcards, player, episodes)
- ✅ 백엔드 리팩토링 (설정 외부화, 에러 처리 표준화)
- ✅ 캐시 매니저 개선 (TTL, 통계, 자동 정리)

### 개선 효과
- 코드 중복 40% 감소
- server.js 26% 코드 감소 (184줄 → 135줄)
- 모듈화로 유지보수성 향상
- HMR로 개발 속도 향상

## 📦 환경 변수

| 변수명 | 설명 | 필수 | 기본값 |
|--------|------|------|--------|
| `GARAM_NOTION_SECRET` | Notion API 키 | ✓ | - |
| `DATABASE_ID` | 메인 대화 DB ID | | 하드코딩됨 |
| `CHARACTER_DATABASE_ID` | 캐릭터 DB ID | | 하드코딩됨 |
| `EXPRESSION_CARDS_DATABASE_ID` | 표현 카드 DB ID | | 하드코딩됨 |
| `N1_VOCABULARY_DATABASE_ID` | N1 어휘 DB ID | | 하드코딩됨 |
| `EPISODES_DATABASE_ID` | 에피소드 DB ID | | 하드코딩됨 |
| `BOOK_DATABASE_ID` | 책 DB ID | | 하드코딩됨 |
| `PORT` | 서버 포트 | | 5000 |

## 🐛 트러블슈팅

### 포트가 이미 사용 중인 경우
```bash
# 8080 포트 프로세스 종료
lsof -ti:8080 | xargs kill -9

# 3000 포트 프로세스 종료
lsof -ti:3000 | xargs kill -9
```

### 캐시 문제
서버는 5분 TTL 캐시를 사용합니다. 데이터가 업데이트되지 않으면:
```bash
# 서버 재시작
npm run server
```

### CORS 에러
Vite 개발 서버는 자동으로 `/api`를 `http://localhost:8080`으로 프록시합니다.

## 📄 라이선스

ISC

## 👤 Author

Garam Kim

---

Made with ☕ for Japanese learners
