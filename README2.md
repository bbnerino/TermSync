# TermSync - AI 기술 문서 용어 통일

AI 기반으로 기술 문서의 용어를 자동으로 분석하고 통일하는 웹 애플리케이션입니다.

## 🎉 구현 완료 상태

### ✅ Phase 1: 프로젝트 초기 설정 (완료)
- Next.js 14 + TypeScript 설정
- Tailwind CSS 커스텀 디자인 시스템
- Material Symbols 아이콘 통합
- 글로벌 스타일 및 애니메이션

### ✅ Phase 2: 핵심 라이브러리 (완료)
- **JSON Database** (`lib/db/json-db.ts`)
  - 워크스페이스, 문서, 용어 CRUD
  - 검색 및 필터링
  - 배치 작업 지원

- **STORM Parse SDK** (`lib/storm.ts`)
  - PDF/DOCX 파일 파싱
  - Job 폴링 및 결과 반환
  - 다중 파일 병렬 처리

- **OpenAI SDK** (`lib/openai.ts`)
  - 용어 분석 및 그룹화
  - UI 가이드 자동 생성
  - 용어 추천
  - 문서 검색 챗봇
  - 통계 분석

- **Zustand 스토어**
  - `unifyStore` - 용어 통일 모드
  - `generateStore` - 자동 생성 모드
  - `chatStore` - 챗봇
  - `workspaceStore` - 워크스페이스 관리

- **API Routes**
  - `/api/workspaces` - 워크스페이스 관리
  - `/api/unify/parse` - 파일 파싱
  - `/api/unify/analyze` - 용어 분석
  - `/api/unify/apply` - 용어 적용
  - `/api/generate/guide` - 가이드 생성
  - `/api/chat` - 챗봇

### ✅ Phase 3: 페이지 구현 (진행 중)

#### 완성된 페이지:
1. **랜딩 페이지** (`/`)
   - Hero 섹션
   - 주요 기능 소개
   - CTA 버튼
   - Footer

2. **워크스페이스 선택** (`/workspace`)
   - 워크스페이스 목록 (카드 그리드)
   - 검색 기능
   - 새 워크스페이스 생성 모달
   - 빈 상태 UI

3. **모드 선택** (`/workspace/[id]`)
   - 용어 통일 모드 카드
   - 자동 생성 모드 카드
   - 각 모드 설명 및 기능 소개

4. **용어 통일 모드** (완료 ✅)
   - **파일 업로드** (`/workspace/[id]/unify`)
     - 드래그 & 드롭 지원
     - PDF, DOCX 파일 지원 (최대 5개)
     - 파일 미리보기

   - **분석 진행** (`/workspace/[id]/unify/analyze`)
     - 실시간 진행 상황 (파싱 → 추출 → 그룹화 → AI 분석)
     - 프로그레스 바
     - 단계별 타임라인
     - 문서 정보 카드

   - **용어 검토** (`/workspace/[id]/unify/review`)
     - 용어 그룹 리스트
     - 체크박스 선택
     - 검색 및 정렬 (신뢰도/빈도)
     - 통계 대시보드
     - 신뢰도 배지 (높음/중간/낮음)

   - **최종 확인** (`/workspace/[id]/unify/confirm`)
     - 적용 요약
     - 선택된 용어 목록
     - 최종 적용 버튼

#### 완성! 🎉
모든 주요 기능이 구현되었습니다!

## 🚀 시작하기

### 1. 의존성 설치
\`\`\`bash
npm install
\`\`\`

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 API 키를 입력하세요:

\`\`\`env
# STORM Parse API
STORM_API_KEY=your_storm_api_key_here

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here
\`\`\`

### 3. 개발 서버 실행
\`\`\`bash
npm run dev
\`\`\`

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어주세요.

## 📁 프로젝트 구조

\`\`\`
termsync/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   │   ├── workspaces/       # 워크스페이스 API
│   │   ├── unify/            # 용어 통일 API
│   │   ├── generate/         # 자동 생성 API
│   │   └── chat/             # 챗봇 API
│   ├── workspace/            # 워크스페이스 페이지
│   │   └── [id]/             # 동적 라우트
│   │       ├── unify/        # 용어 통일 모드
│   │       ├── generate/     # 자동 생성 모드
│   │       └── chat/         # 챗봇
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 랜딩 페이지
│   └── globals.css           # 글로벌 스타일
├── lib/                      # 라이브러리
│   ├── db/                   # Database
│   │   └── json-db.ts        # JSON DB 구현
│   ├── storm.ts              # STORM Parse SDK
│   └── openai.ts             # OpenAI SDK
├── store/                    # Zustand 스토어
│   ├── unifyStore.ts         # 용어 통일
│   ├── generateStore.ts      # 자동 생성
│   ├── chatStore.ts          # 챗봇
│   └── workspaceStore.ts     # 워크스페이스
├── types/                    # TypeScript 타입
│   ├── workspace.ts
│   ├── unify.ts
│   ├── generate.ts
│   ├── chat.ts
│   └── db.ts
├── data/                     # JSON 데이터 파일
│   ├── workspaces.json
│   ├── documents.json
│   └── terms.json
├── styles/                   # 스타일
│   └── globals.css
└── public/                   # 정적 파일
\`\`\`

## 🎨 디자인 시스템

### 색상
- **Primary**: `#2bee79` (Neon Green)
- **Background Dark**: `#102217`
- **Surface Dark**: `#162e21`
- **Border Green**: `#234832`
- **Text Dim**: `#92c9a8`

### 폰트
- **Display**: Spline Sans
- **Body**: Noto Sans KR
- **Icons**: Material Symbols Outlined

### 애니메이션
- `animate-fade-in`
- `animate-fade-in-up`
- `animate-pulse-glow`
- 호버 효과 및 트랜지션

## 🔑 주요 기능

### 1. 용어 통일 모드
1. **파일 업로드**: PDF/DOCX 문서 업로드 (최대 5개)
2. **AI 분석**: STORM Parse로 문서 파싱 → OpenAI로 용어 분석
3. **용어 검토**: AI가 제안한 용어 그룹 검토 및 선택
4. **적용**: 선택한 용어로 문서 일괄 변경
5. **결과**: 통일된 문서 다운로드 및 DB 저장

### 2. 자동 생성 모드 (완료 ✅)
1. **이미지 업로드**: UI 스크린샷 드래그 & 드롭
2. **AI 분석**: UI 요소 자동 추출
3. **가이드 생성**: AI 기반 문서 자동 작성
4. **용어 추천**: 표준 용어 추천 및 선택
5. **편집**: 실시간 편집 및 미리보기
6. **다운로드**: Markdown 형식 다운로드

### 3. 챗봇 (완료 ✅)
- **문서 검색**: RAG 기반 질의응답
- **통계 분석**: 용어 사용 패턴 분석
- **대화형 UI**: 실시간 채팅 인터페이스
- **Quick Actions**: 자주 사용하는 질문 바로가기
- **소스 표시**: 답변 출처 명시

## 🛠 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Material Symbols
- **State Management**: Zustand
- **AI/ML**: OpenAI GPT-4, STORM Parse API
- **Database**: JSON File-based (Mock)
- **Icons**: Material Symbols Outlined

## 📝 API 문서

### 워크스페이스 API
- `GET /api/workspaces` - 모든 워크스페이스 조회
- `POST /api/workspaces` - 새 워크스페이스 생성
- `GET /api/workspaces/[id]` - 특정 워크스페이스 조회
- `PATCH /api/workspaces/[id]` - 워크스페이스 수정
- `DELETE /api/workspaces/[id]` - 워크스페이스 삭제

### 용어 통일 API
- `POST /api/unify/parse` - 파일 파싱
- `POST /api/unify/analyze` - 용어 분석
- `POST /api/unify/apply` - 용어 적용

### 자동 생성 API
- `POST /api/generate/guide` - UI 가이드 생성

### 챗봇 API
- `POST /api/chat` - 챗봇 질의응답

## 📊 현재 진행 상황

- ✅ Phase 1: 프로젝트 초기 설정 (100%)
- ✅ Phase 2: 핵심 라이브러리 (100%)
- ✅ Phase 3: 페이지 구현 (100%)
  - ✅ 랜딩 페이지
  - ✅ 워크스페이스 관리
  - ✅ 용어 통일 모드
  - ✅ 자동 생성 모드
  - ✅ 챗봇

## 🎯 완성된 기능

### ✅ 모든 주요 기능 구현 완료!

1. **워크스페이스 관리** - 생성, 선택, 관리
2. **용어 통일 모드** - 파일 업로드 → 분석 → 검토 → 적용
3. **자동 생성 모드** - 이미지 업로드 → AI 생성 → 편집 → 다운로드
4. **챗봇** - 문서 검색 + 통계 분석

### 🔧 추가 개선 가능 항목 (Optional)

1. 에러 핸들링 강화
2. 로딩 상태 최적화
3. 반응형 디자인 개선
4. E2E 테스트 추가
5. ~~실제 API 연동 (STORM, OpenAI)~~ ✅ **완료!**
6. 사용자 인증 시스템

## 🧪 테스트 방법

### 환경 설정
1. `.env.local` 파일 생성:
```env
STORM_API_KEY=your-storm-api-key
OPENAI_API_KEY=your-openai-api-key
```

2. 개발 서버 시작:
```bash
npm run dev
```

### 용어 통일 모드 테스트
1. `http://localhost:3000/workspace`로 이동
2. 워크스페이스 선택 또는 생성
3. "용어 통일 모드" 클릭
4. 파일 업로드 (테스트용 `test-document.txt` 사용 가능)
5. **중요**: 파일을 선택하면 "분석 시작" 버튼이 활성화됩니다
6. 버튼 클릭 → STORM Parse API + OpenAI 분석 실행
7. 브라우저 콘솔(F12)에서 `[TermSync]` 로그 확인

### 자동 생성 모드 테스트
1. 워크스페이스에서 "자동 생성 모드" 클릭
2. UI 가이드 작성 또는 용어 추천 선택
3. 이미지 파일(PNG/JPG) 업로드
4. 생성 버튼 클릭 → STORM + OpenAI 실행

### 챗봇 테스트
1. 자동 생성 모드 화면에서 우측 사이드바 사용
2. 질문 입력 → OpenAI API로 문서 검색

### 디버깅
- 브라우저 콘솔(F12)을 열고 `[TermSync]` 로그 확인
- API 에러는 alert와 콘솔에 표시됩니다
- 네트워크 탭에서 API 호출 상태 확인

## 📄 라이센스

이 프로젝트는 개인 프로젝트입니다.

