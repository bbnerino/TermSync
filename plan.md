# TermSync 구현 계획서

## 📋 프로젝트 개요

### 목표
Google Stitch로 생성된 37개 화면 디자인을 기반으로 Next.js + Zustand + Tailwind를 사용한 풀스택 TermSync 애플리케이션 구현

### 기술 스택
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS
- **State Management**: Zustand
- **API**: STORM Parse API, OpenAI API (GPT-4)
- **Database**: JSON 파일 (Storm Bucket 모킹)
- **Styling**: Tailwind CSS + Material Symbols Icons

### 제공된 API 키
```
STORM API KEY: [YOUR_STORM_API_KEY]
OPENAI API KEY: [YOUR_OPENAI_API_KEY]
```

---

## 🎨 디자인 시스템 분석 (Stitch 기반)

### 컬러 팔레트
```javascript
{
  primary: '#2bee79',         // 메인 녹색
  primaryDark: '#1fa855',     // 진한 녹색
  backgroundLight: '#f6f8f7', // 라이트 모드 배경
  backgroundDark: '#102217',  // 다크 모드 배경
  surfaceDark: '#162e21',     // 다크 카드 배경
  borderGreen: '#234832',     // 테두리 녹색
  textDim: '#92c9a8'          // 흐린 텍스트
}
```

### 폰트
- **Display**: Spline Sans
- **Body**: Noto Sans KR

### 디자인 특징
- 다크 테마 중심
- 녹색 포인트 컬러
- 터미널/개발자 스타일 UI
- Material Symbols 아이콘
- 부드러운 애니메이션 (hover, scale, shadow)

---

## 📂 프로젝트 구조

```
termsync/
├── app/
│   ├── layout.tsx                   # 글로벌 레이아웃
│   ├── page.tsx                     # 랜딩 페이지 ✅
│   │
│   ├── workspace/
│   │   ├── page.tsx                 # 워크스페이스 선택 ✅
│   │   └── [id]/
│   │       ├── page.tsx             # 모드 선택 ✅
│   │       │
│   │       ├── unify/               # 📖 용어 통일 모드
│   │       │   ├── upload/
│   │       │   │   └── page.tsx     # 문서 업로드 ✅
│   │       │   ├── analyze/
│   │       │   │   └── page.tsx     # AI 분석 진행 ✅
│   │       │   ├── review/
│   │       │   │   └── page.tsx     # 그룹 검토 ⭐ ✅
│   │       │   ├── confirm/
│   │       │   │   └── page.tsx     # 최종 확인 ✅
│   │       │   └── result/
│   │       │       └── page.tsx     # 완료 ✅
│   │       │
│   │       └── generate/            # 🤖 자동 생성 모드
│   │           ├── page.tsx         # 메인 (챗봇 + 탭) ✅
│   │           ├── guide/
│   │           │   └── page.tsx     # UI 가이드 작성 ✅
│   │           └── terms/
│   │               └── page.tsx     # 용어 추천 ✅
│   │
│   └── api/                         # API Routes
│       ├── workspace/
│       │   ├── route.ts             # GET, POST 워크스페이스
│       │   └── [id]/
│       │       └── route.ts         # GET, PUT, DELETE
│       │
│       ├── unify/
│       │   ├── upload/route.ts      # 파일 업로드
│       │   ├── parse/route.ts       # STORM Parse 호출
│       │   ├── analyze/route.ts     # OpenAI 분석
│       │   └── generate/route.ts    # 문서 생성 + DB 저장
│       │
│       ├── generate/
│       │   ├── guide/route.ts       # UI 가이드 생성
│       │   └── terms/route.ts       # 용어 추천
│       │
│       └── chat/
│           └── route.ts             # 챗봇 (DB 검색 + OpenAI)
│
├── components/
│   ├── common/                      # 공통 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   └── Loading.tsx
│   │
│   ├── layout/                      # 레이아웃 컴포넌트
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── workspace/                   # 워크스페이스 컴포넌트
│   │   ├── WorkspaceCard.tsx
│   │   ├── WorkspaceList.tsx
│   │   └── WorkspaceCreateModal.tsx
│   │
│   ├── unify/                       # 용어 통일 컴포넌트
│   │   ├── FileUploader.tsx
│   │   ├── DBToggle.tsx
│   │   ├── AnalysisProgress.tsx
│   │   ├── TermGroupCard.tsx        # ⭐ 핵심!
│   │   ├── TermGroupDetail.tsx
│   │   ├── ManualGroupModal.tsx
│   │   ├── StatsPanel.tsx
│   │   ├── FinalSummary.tsx
│   │   └── ResultDownload.tsx
│   │
│   └── generate/                    # 자동 생성 컴포넌트
│       ├── Chatbot.tsx              # ⭐ 챗봇
│       ├── ChatMessage.tsx
│       ├── ChatInput.tsx
│       ├── SourceCard.tsx
│       ├── GuideEditor.tsx
│       ├── GuidePreview.tsx
│       ├── ImageUploader.tsx
│       └── TermRecommendation.tsx
│
├── store/                           # Zustand 스토어
│   ├── workspaceStore.ts
│   ├── unifyStore.ts
│   ├── generateStore.ts
│   └── chatStore.ts
│
├── lib/                             # 유틸리티 및 SDK
│   ├── api/
│   │   ├── workspace.ts
│   │   ├── unify.ts
│   │   ├── generate.ts
│   │   └── chat.ts
│   │
│   ├── db/
│   │   ├── index.ts
│   │   ├── json-db.ts
│   │   └── storm-bucket.ts
│   │
│   ├── storm.ts                     # STORM Parse SDK
│   ├── openai.ts                    # OpenAI SDK
│   └── utils.ts
│
├── types/                           # TypeScript 타입
│   ├── index.ts
│   ├── workspace.ts
│   ├── unify.ts
│   ├── generate.ts
│   ├── chat.ts
│   └── db.ts
│
├── data/                            # JSON DB 파일
│   ├── workspaces.json
│   ├── documents.json
│   └── terms.json
│
├── public/
├── styles/
│   └── globals.css
│
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 구현 단계

### Phase 1: 프로젝트 초기 설정 (1일)

#### 1.1 Next.js 프로젝트 생성
```bash
npx create-next-app@latest termsync --typescript --tailwind --app --no-src-dir
cd termsync
```

#### 1.2 의존성 설치
```bash
npm install zustand openai uuid
npm install -D @types/uuid
```

#### 1.3 환경 변수 설정
```bash
# .env.local
STORM_API_URL=https://storm-apis.sionic.im/parse-router/api/v2
STORM_API_KEY=[YOUR_STORM_API_KEY]
OPENAI_API_KEY=[YOUR_OPENAI_API_KEY]
NODE_ENV=development
```

#### 1.4 Tailwind 설정
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2bee79',
        primaryDark: '#1fa855',
        backgroundLight: '#f6f8f7',
        backgroundDark: '#102217',
        surfaceDark: '#162e21',
        borderGreen: '#234832',
        textDim: '#92c9a8'
      },
      fontFamily: {
        display: ['Spline Sans', 'Noto Sans KR', 'sans-serif']
      }
    }
  }
}
```

#### 1.5 폴더 구조 생성
```bash
mkdir -p app/workspace/{[id]/{unify/{upload,analyze,review,confirm,result},generate/{guide,terms}}}
mkdir -p app/api/{workspace/{[id]},unify/{upload,parse,analyze,generate},generate/{guide,terms},chat}
mkdir -p components/{common,layout,workspace,unify,generate}
mkdir -p store lib/{api,db} types data
```

---

### Phase 2: 타입 정의 및 유틸리티 (1일)

#### 2.1 TypeScript 타입 정의
```typescript
// types/workspace.ts
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  termCount: number;
  documentCount: number;
}

// types/unify.ts
export interface TermGroup {
  id: string;
  name: string;
  category: string;
  source: 'db' | 'ai';
  standard: string;
  confidence: number;
  reasoning: string;
  variants: string[];
  occurrences: Occurrence[];
}

export interface Occurrence {
  id: string;
  docName: string;
  docIndex: number;
  line: number;
  before: string;
  after: string;
  sentence: string;
  context: string;
  selected: boolean;
}

// types/generate.ts
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface Source {
  docId: string;
  docName: string;
  snippet: string;
  relevance: number;
}
```

#### 2.2 JSON Database 구현
```typescript
// lib/db/json-db.ts
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');

class JsonDatabase {
  // CRUD 메서드 구현
  async read<T>(filename: string): Promise<T[]> { ... }
  async write<T>(filename: string, data: T[]): Promise<void> { ... }
  
  // Workspace
  async createWorkspace(workspace: any) { ... }
  async listWorkspaces() { ... }
  async getWorkspace(id: string) { ... }
  
  // Documents
  async saveDocument(doc: any) { ... }
  async searchDocuments(workspaceId: string, query: string) { ... }
  
  // Terms
  async saveTerm(term: any) { ... }
  async listTerms(workspaceId: string) { ... }
}

export const db = new JsonDatabase();
```

#### 2.3 STORM Parse SDK
```typescript
// lib/storm.ts
const STORM_API_URL = process.env.STORM_API_URL;
const STORM_API_KEY = process.env.STORM_API_KEY;

export async function parseDocument(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', 'ko');
  formData.append('deleteOriginFile', 'true');
  
  // Step 1: 파일 업로드
  const uploadRes = await fetch(`${STORM_API_URL}/parse/by-file`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${STORM_API_KEY}` },
    body: formData
  });
  
  const { jobId } = await uploadRes.json();
  
  // Step 2: 폴링으로 결과 조회
  for (let i = 0; i < 30; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const resultRes = await fetch(`${STORM_API_URL}/parse/job/${jobId}`, {
      headers: { 'Authorization': `Bearer ${STORM_API_KEY}` }
    });
    
    const result = await resultRes.json();
    
    if (result.state === 'COMPLETED') {
      const content = result.pages.map(p => p.content).join('\n');
      return content;
    }
  }
  
  throw new Error('Parse timeout');
}
```

#### 2.4 OpenAI SDK
```typescript
// lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeTerms(
  documents: any[], 
  dbTerms: any[]
): Promise<any[]> {
  // gpt_prompt.md의 프롬프트 사용
  const prompt = `...`;
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: '...' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });
  
  return JSON.parse(completion.choices[0].message.content);
}

// 추가 함수들
export async function generateGuide(...) { ... }
export async function recommendTerms(...) { ... }
export async function chatWithDocs(...) { ... }
```

---

### Phase 3: 공통 컴포넌트 (2일)

#### 3.1 기본 컴포넌트
```typescript
// components/common/Button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

// components/common/Modal.tsx
// components/common/Input.tsx
// components/common/Card.tsx
// components/common/ProgressBar.tsx
```

#### 3.2 레이아웃 컴포넌트
```typescript
// components/layout/Header.tsx
// Stitch 디자인 참고
// - 로고 + 네비게이션
// - 프로필 아이콘
// - 다크 모드 토글

// components/layout/Footer.tsx
```

---

### Phase 4: 랜딩 페이지 (1일)

#### 4.1 랜딩 페이지 구현
```typescript
// app/page.tsx
// stitch_termsync/termsync_랜딩_페이지/code.html 참고
export default function LandingPage() {
  return (
    <>
      <Header />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </>
  );
}
```

---

### Phase 5: 워크스페이스 관리 (2일)

#### 5.1 워크스페이스 페이지
```typescript
// app/workspace/page.tsx
// stitch_termsync/워크스페이스_선택/code.html 참고

export default function WorkspacePage() {
  const workspaces = useWorkspaceStore(s => s.workspaces);
  const [showModal, setShowModal] = useState(false);
  
  return (
    <div>
      {/* 검색 바 */}
      {/* 워크스페이스 리스트 or 빈 상태 */}
      {/* 새 워크스페이스 모달 */}
    </div>
  );
}
```

#### 5.2 워크스페이스 API
```typescript
// app/api/workspace/route.ts
export async function GET() {
  const workspaces = await db.listWorkspaces();
  return NextResponse.json(workspaces);
}

export async function POST(request: Request) {
  const body = await request.json();
  const workspace = await db.createWorkspace(body);
  return NextResponse.json(workspace);
}
```

#### 5.3 Zustand Store
```typescript
// store/workspaceStore.ts
interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (data: any) => Promise<void>;
  selectWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  // ...
}));
```

---

### Phase 6: 용어 통일 모드 (5일)

#### 6.1 파일 업로드 (0.5일)
```typescript
// app/workspace/[id]/unify/upload/page.tsx
// stitch_termsync/문서_업로드/code.html 참고
// stitch_termsync/업로드_완료_및_db_설정/code.html 참고

export default function UploadPage() {
  const { uploadFiles, toggleDB } = useUnifyStore();
  
  return (
    <div>
      {/* FileUploader 컴포넌트 */}
      {/* DB 활용 토글 */}
      {/* 업로드된 파일 리스트 */}
    </div>
  );
}
```

#### 6.2 AI 분석 진행 (0.5일)
```typescript
// app/workspace/[id]/unify/analyze/page.tsx
// stitch_termsync/ai_분석_진행_(파싱)/code.html 참고

export default function AnalyzePage() {
  useEffect(() => {
    const analyze = async () => {
      // Step 1: Parse
      await parseDocuments();
      
      // Step 2: Analyze
      await analyzeTerms();
    };
    
    analyze();
  }, []);
  
  return <AnalysisProgress />;
}
```

#### 6.3 그룹 검토 ⭐ (2일)
```typescript
// app/workspace/[id]/unify/review/page.tsx
// stitch_termsync/용어_그룹_검토_및_관리/code.html 참고
// stitch_termsync/그룹_상세_보기_및_개별_수정/code.html 참고

export default function ReviewPage() {
  const { termGroups, selectedGroups, toggleGroup } = useUnifyStore();
  
  return (
    <div className="flex">
      {/* 좌측: 그룹 리스트 */}
      <div className="flex-1">
        {termGroups.map(group => (
          <TermGroupCard key={group.id} group={group} />
        ))}
        
        {/* 수동 그룹 추가 버튼 */}
      </div>
      
      {/* 우측: 통계 패널 */}
      <StatsPanel />
    </div>
  );
}

// components/unify/TermGroupCard.tsx
// 접기/펼치기, 체크박스, 개별 항목 선택
```

#### 6.4 최종 확인 (1일)
```typescript
// app/workspace/[id]/unify/confirm/page.tsx
// stitch_termsync/최종_확인_-_요약_탭/code.html 참고
// stitch_termsync/최종_확인_-_문서별_상세_탭/code.html 참고

export default function ConfirmPage() {
  const [tab, setTab] = useState<'summary' | 'docs' | 'groups'>('summary');
  
  return (
    <div>
      {/* 탭 */}
      {tab === 'summary' && <SummaryTab />}
      {tab === 'docs' && <DocsTab />}
      {tab === 'groups' && <GroupsTab />}
      
      {/* DB 저장 옵션 */}
      {/* 생성 버튼 */}
    </div>
  );
}
```

#### 6.5 문서 생성 & 완료 (1일)
```typescript
// app/workspace/[id]/unify/result/page.tsx
// stitch_termsync/통일_문서_생성_진행/code.html 참고
// stitch_termsync/문서_생성_완료/code.html 참고
// stitch_termsync/용어_통일_완료_및_다운로드/code.html 참고

export default function ResultPage() {
  const { download } = useUnifyStore();
  
  return (
    <div>
      {/* 완료 애니메이션 */}
      {/* 통계 카드 */}
      {/* 다운로드 버튼들 */}
    </div>
  );
}
```

#### 6.6 API Routes
```typescript
// app/api/unify/parse/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll('files');
  
  const parsed = await Promise.all(
    files.map(file => parseDocument(file))
  );
  
  return NextResponse.json({ documents: parsed });
}

// app/api/unify/analyze/route.ts
export async function POST(request: Request) {
  const { workspaceId, documents, dbEnabled } = await request.json();
  
  let dbTerms = [];
  if (dbEnabled) {
    dbTerms = await db.listTerms(workspaceId);
  }
  
  const termGroups = await analyzeTerms(documents, dbTerms);
  
  return NextResponse.json({ termGroups });
}

// app/api/unify/generate/route.ts
export async function POST(request: Request) {
  const { workspaceId, termGroups, saveToDb } = await request.json();
  
  // 문서 생성 로직
  // DB 저장
  
  return NextResponse.json({ success: true });
}
```

---

### Phase 7: 자동 생성 모드 (4일)

#### 7.1 메인 화면 + 챗봇 (1.5일)
```typescript
// app/workspace/[id]/generate/page.tsx
// stitch_termsync/자동_생성_모드_메인_화면/code.html 참고

export default function GeneratePage() {
  return (
    <div className="flex h-screen">
      {/* 좌측: 작업 영역 */}
      <div className="flex-1">
        <Tabs>
          <TabPanel value="guide">
            {/* UI 가이드 작성 */}
          </TabPanel>
          <TabPanel value="terms">
            {/* 용어 추천 */}
          </TabPanel>
        </Tabs>
      </div>
      
      {/* 우측: 챗봇 (항상 표시) ⭐ */}
      <div className="w-96 border-l">
        <Chatbot />
      </div>
    </div>
  );
}

// components/generate/Chatbot.tsx
// stitch_termsync/챗봇_-_키워드_검색_결과/code.html 참고
// stitch_termsync/챗봇_-_용어_검색_결과/code.html 참고
// stitch_termsync/챗봇_-_용어_사용_통계_top_5/code.html 참고
```

#### 7.2 UI 가이드 작성 (1.5일)
```typescript
// app/workspace/[id]/generate/guide/page.tsx
// stitch_termsync/ui_캡처_업로드_및_파일_선택/code.html 참고
// stitch_termsync/ai_가이드_생성_진행_(스타일_분석)/code.html 참고
// stitch_termsync/ai_가이드_생성_완료/code.html 참고
// stitch_termsync/생성된_가이드_미리보기/code.html 참고
// stitch_termsync/생성된_가이드_편집_모드/code.html 참고

export default function GuidePage() {
  const [step, setStep] = useState<'upload' | 'generating' | 'preview' | 'edit'>('upload');
  
  return (
    <div>
      {step === 'upload' && <ImageUploader />}
      {step === 'generating' && <GeneratingProgress />}
      {step === 'preview' && <GuidePreview />}
      {step === 'edit' && <GuideEditor />}
    </div>
  );
}
```

#### 7.3 용어 추천 (1일)
```typescript
// app/workspace/[id]/generate/terms/page.tsx
// stitch_termsync/ui_용어_추천_-_이미지_업로드_및_분석/code.html 참고
// stitch_termsync/ui_용어_추천_-_결과/code.html 참고

export default function TermsPage() {
  return (
    <div>
      {/* UI 이미지 업로드 */}
      {/* 용어 추천 결과 */}
    </div>
  );
}
```

#### 7.4 API Routes
```typescript
// app/api/generate/guide/route.ts
export async function POST(request: Request) {
  const { workspaceId, images, options } = await request.json();
  
  // OCR로 UI 텍스트 추출
  const uiElements = await extractUIElements(images);
  
  // DB 문서 가져오기
  const dbDocs = await db.listDocuments(workspaceId);
  
  // OpenAI로 가이드 생성
  const guide = await generateGuide(uiElements, dbDocs);
  
  return NextResponse.json({ guide });
}

// app/api/generate/terms/route.ts
export async function POST(request: Request) {
  const { workspaceId, uiTexts } = await request.json();
  
  const dbTerms = await db.listTerms(workspaceId);
  const recommendations = await recommendTerms(uiTexts, dbTerms);
  
  return NextResponse.json({ recommendations });
}

// app/api/chat/route.ts
export async function POST(request: Request) {
  const { workspaceId, question } = await request.json();
  
  // DB 검색
  const searchResults = await db.searchDocuments(workspaceId, question);
  
  // OpenAI로 답변 생성
  const { answer, sources } = await chatWithDocs(question, searchResults);
  
  return NextResponse.json({ answer, sources });
}
```

---

### Phase 8: 모달 및 세부 기능 (2일)

#### 8.1 모달 컴포넌트
```typescript
// 워크스페이스 생성 모달
// stitch_termsync/새_워크스페이스_생성_모달/code.html 참고

// 수동 그룹 추가 모달
// stitch_termsync/수동_그룹_추가_모달/code.html 참고
// stitch_termsync/수동_그룹_추가_결과_모달/code.html 참고

// 원문 보기 모달
// stitch_termsync/챗봇_-_원문_보기_모달/code.html 참고

// 다운로드 완료 알림
// stitch_termsync/가이드_다운로드_완료_및_db_저장_알림/code.html 참고
```

#### 8.2 로딩 및 진행 상태
```typescript
// 파싱 진행
// stitch_termsync/ai_분석_진행_(파싱)/code.html 참고

// 키워드 검색 진행
// stitch_termsync/챗봇_-_키워드_검색_진행/code.html 참고

// 가이드 생성 진행
// stitch_termsync/ai_가이드_생성_진행_(초안_작성_중)_/code.html 참고
```

---

### Phase 9: 스타일링 및 애니메이션 (1일)

#### 9.1 글로벌 스타일
```css
/* styles/globals.css */
@import url('https://fonts.googleapis.com/css2?family=Spline+Sans:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #102217;
}

::-webkit-scrollbar-thumb {
  background: #234832;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #2bee79;
}

/* 애니메이션 */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out;
}
```

#### 9.2 호버 효과 및 트랜지션
```typescript
// Stitch 디자인의 호버 효과 구현
// - scale-105
// - shadow-glow (primary 컬러)
// - translate-y-[-4px]
// - opacity transitions
```

---

### Phase 10: 테스트 및 최적화 (2일)

#### 10.1 데이터 플로우 테스트
- [ ] 워크스페이스 CRUD
- [ ] 파일 업로드 → 파싱
- [ ] 용어 분석 → 그룹 검토
- [ ] 문서 생성 → 다운로드
- [ ] 챗봇 질문 → 답변
- [ ] UI 가이드 생성
- [ ] 용어 추천

#### 10.2 성능 최적화
- [ ] 이미지 lazy loading
- [ ] API 응답 캐싱
- [ ] Zustand persist 설정
- [ ] React.memo 적용

#### 10.3 에러 핸들링
- [ ] API 에러 처리
- [ ] 파일 업로드 실패
- [ ] 파싱 타임아웃
- [ ] OpenAI 에러

---

## 📊 화면별 구현 매핑

### ✅ 용어 통일 모드 (17개 화면)
1. **문서 업로드** → `app/workspace/[id]/unify/upload/page.tsx`
2. **업로드 완료 및 DB 설정** → 동일 페이지
3. **AI 분석 진행 (파싱)** → `app/workspace/[id]/unify/analyze/page.tsx`
4. **AI 분석 완료** → 동일 페이지
5. **용어 그룹 검토 및 관리** → `app/workspace/[id]/unify/review/page.tsx`
6. **그룹 상세 보기 및 개별 수정** → `TermGroupDetail` 컴포넌트
7. **수동 그룹 추가 모달** → `ManualGroupModal` 컴포넌트
8. **수동 그룹 추가 결과 모달** → 동일 컴포넌트
9. **최종 확인 - 요약 탭** → `app/workspace/[id]/unify/confirm/page.tsx`
10. **최종 확인 - 문서별 상세 탭** → 동일 페이지
11. **통일 문서 생성 진행** → `app/workspace/[id]/unify/result/page.tsx`
12. **문서 생성 완료** → 동일 페이지
13. **용어 통일 완료 및 다운로드** → 동일 페이지

### ✅ 자동 생성 모드 (20개 화면)
1. **자동 생성 모드 메인 화면** → `app/workspace/[id]/generate/page.tsx`
2. **UI 캡처 업로드 및 파일 선택** → `app/workspace/[id]/generate/guide/page.tsx`
3. **UI 캡처 업로드 완료 및 가이드 옵션** → 동일 페이지
4. **AI 가이드 생성 진행 (스타일 분석)** → 동일 페이지
5. **AI 가이드 생성 진행 (초안 작성 중)** → 동일 페이지
6. **AI 가이드 생성 완료** → 동일 페이지
7. **생성된 가이드 미리보기** → `GuidePreview` 컴포넌트
8. **생성된 가이드 편집 모드** → `GuideEditor` 컴포넌트
9. **가이드 저장 및 다운로드 옵션** → 모달
10. **가이드 다운로드 완료 및 DB 저장 알림** → 모달
11. **UI 용어 추천 - 이미지 업로드 및 분석** → `app/workspace/[id]/generate/terms/page.tsx`
12. **UI 용어 추천 - 결과** → 동일 페이지
13. **챗봇 - 키워드 검색 진행** → `Chatbot` 컴포넌트
14. **챗봇 - 키워드 검색 결과** → 동일 컴포넌트
15. **챗봇 - 용어 검색 결과** → 동일 컴포넌트
16. **챗봇 - 용어 사용 통계 Top 5** → 동일 컴포넌트
17. **챗봇 - 용어 통계 Excel 다운로드** → 동일 컴포넌트
18. **챗봇 - 원문 보기 모달** → `SourceModal` 컴포넌트

### ✅ 공통 화면 (5개)
1. **TermSync 랜딩 페이지** → `app/page.tsx`
2. **워크스페이스 선택** → `app/workspace/page.tsx`
3. **워크스페이스 선택 (자동 생성 모드 진입 전)** → 동일 페이지
4. **새 워크스페이스 생성 모달** → `WorkspaceCreateModal` 컴포넌트
5. **모드 선택** → `app/workspace/[id]/page.tsx`

---

## 🔑 핵심 구현 포인트

### 1. STORM Parse API 연동
```typescript
// lib/storm.ts
- 파일 업로드 → jobId 받기
- 2초 간격 폴링 (최대 30회)
- state === 'COMPLETED' 시 pages.content 추출
- 타임아웃 시 fallback 처리
```

### 2. OpenAI API 프롬프트
```typescript
// lib/openai.ts
- gpt_prompt.md의 프롬프트 사용
- response_format: { type: 'json_object' }
- temperature 조절 (0.3 ~ 0.7)
- 각 기능별 별도 함수
  - analyzeTerms
  - generateGuide
  - recommendTerms
  - chatWithDocs
  - analyzeStatistics
```

### 3. Zustand 상태 관리
```typescript
// store/unifyStore.ts
- 파일 업로드 상태
- 분석 진행 상태
- 용어 그룹 선택 상태
- API 호출 함수 포함
- persist middleware 사용

// store/generateStore.ts
- 가이드 생성 상태
- 편집 중인 가이드
- 용어 추천 결과

// store/chatStore.ts
- 메시지 히스토리
- 로딩 상태
- sendMessage 함수
```

### 4. 파일 업로드 및 드래그앤드롭
```typescript
// components/unify/FileUploader.tsx
- react-dropzone 사용 (선택적)
- 또는 native HTML5 drag & drop
- 파일 타입 검증 (docx, pdf)
- 파일 크기 제한
- 미리보기 표시
```

### 5. 실시간 진행 상황
```typescript
// components/unify/AnalysisProgress.tsx
- 진행률 프로그레스 바
- 실시간 로그 스트리밍
- 단계별 아이콘 + 상태
- 예상 소요 시간
```

### 6. 그룹 카드 (가장 복잡!)
```typescript
// components/unify/TermGroupCard.tsx
- 접기/펼치기 애니메이션
- 체크박스 전체/개별 선택
- 발견 위치별 표시
- 문맥 정보 표시
- Before/After 미리보기
```

### 7. 챗봇 UI
```typescript
// components/generate/Chatbot.tsx
- 메시지 스트리밍 표시
- 출처 카드 표시
- 스크롤 자동 이동
- 입력창 자동 포커스
- 로딩 인디케이터
```

---

## 📦 Package.json

```json
{
  "name": "termsync",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zustand": "^4.5.0",
    "openai": "^4.28.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.8",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

---

## 🗓️ 총 구현 일정

| Phase | 내용 | 소요 시간 |
|-------|------|-----------|
| Phase 1 | 프로젝트 초기 설정 | 1일 |
| Phase 2 | 타입 정의 및 유틸리티 | 1일 |
| Phase 3 | 공통 컴포넌트 | 2일 |
| Phase 4 | 랜딩 페이지 | 1일 |
| Phase 5 | 워크스페이스 관리 | 2일 |
| Phase 6 | 용어 통일 모드 | 5일 |
| Phase 7 | 자동 생성 모드 | 4일 |
| Phase 8 | 모달 및 세부 기능 | 2일 |
| Phase 9 | 스타일링 및 애니메이션 | 1일 |
| Phase 10 | 테스트 및 최적화 | 2일 |
| **총계** | | **21일** |

---

## ✅ 체크리스트

### 초기 설정
- [ ] Next.js 프로젝트 생성
- [ ] 의존성 설치
- [ ] 환경 변수 설정
- [ ] Tailwind 설정
- [ ] 폴더 구조 생성
- [ ] Git 초기화

### 개발
- [ ] 타입 정의 완료
- [ ] JSON Database 구현
- [ ] STORM Parse SDK 구현
- [ ] OpenAI SDK 구현
- [ ] 공통 컴포넌트 완료
- [ ] 랜딩 페이지 완료
- [ ] 워크스페이스 관리 완료
- [ ] 용어 통일 모드 완료
- [ ] 자동 생성 모드 완료
- [ ] 모든 모달 구현
- [ ] 스타일링 완료

### 테스트
- [ ] 파일 업로드 테스트
- [ ] STORM API 연동 테스트
- [ ] OpenAI API 연동 테스트
- [ ] 용어 분석 플로우 테스트
- [ ] 가이드 생성 플로우 테스트
- [ ] 챗봇 테스트
- [ ] 다운로드 기능 테스트

### 배포 준비
- [ ] 환경 변수 분리 (dev/prod)
- [ ] 빌드 테스트
- [ ] 성능 최적화
- [ ] SEO 메타 태그
- [ ] 에러 바운더리

---

## 🎯 우선순위 핵심 기능

### Must Have (MVP)
1. ✅ 워크스페이스 생성/선택
2. ✅ 파일 업로드 (DOCX, PDF)
3. ✅ STORM Parse API 연동
4. ✅ OpenAI 용어 분석
5. ✅ 그룹 검토 및 수정
6. ✅ 문서 생성 및 다운로드

### Should Have
1. ✅ 챗봇 검색
2. ✅ UI 가이드 자동 작성
3. ✅ 용어 추천
4. ✅ DB 용어 활용
5. ✅ Excel 다운로드

### Nice to Have
1. ⭐ 다크/라이트 모드 토글
2. ⭐ 사용자 인증
3. ⭐ 협업 기능
4. ⭐ 버전 관리
5. ⭐ 알림 기능

---

## 📝 주의사항

### STORM API
- 파싱 결과가 빈 문자열일 수 있음 → 검증 필요
- 타임아웃 설정 (30초)
- 에러 시 fallback 처리

### OpenAI API
- 토큰 제한 주의
- 응답 시간 고려 (30초~1분)
- JSON 파싱 에러 처리
- rate limit 고려

### 파일 처리
- 대용량 파일 처리 (100MB 제한)
- 브라우저 메모리 고려
- FormData 크기 제한

### 상태 관리
- 새로고침 시 상태 유지 (persist)
- 동시성 문제 (여러 탭)
- 에러 상태 관리

---

## 🚀 시작 명령어

```bash
# 1. 프로젝트 생성
npx create-next-app@latest termsync --typescript --tailwind --app --no-src-dir

# 2. 의존성 설치
cd termsync
npm install zustand openai uuid
npm install -D @types/uuid

# 3. 환경 변수 설정
cp .env.example .env.local
# .env.local에 API 키 입력

# 4. 개발 서버 실행
npm run dev

# 5. 빌드
npm run build

# 6. 프로덕션 실행
npm start
```

---

## 📚 참고 문서

1. **user_flow.md** - 사용자 플로우 (상세 시나리오)
2. **new_system_architecture.md** - 아키텍처 및 기술 스택
3. **parser_refer.md** - STORM Parse API 사용법
4. **gpt_prompt.md** - OpenAI API 프롬프트
5. **stitch_termsync/** - 37개 화면 디자인 HTML 코드

---

## 🎨 디자인 가이드라인

### 색상 사용
- **Primary (#2bee79)**: CTA 버튼, 포인트 요소
- **Background Dark (#102217)**: 페이지 배경
- **Surface Dark (#162e21)**: 카드 배경
- **Border Green (#234832)**: 테두리, 구분선
- **Text Dim (#92c9a8)**: 보조 텍스트

### 타이포그래피
- **제목**: font-bold, text-3xl ~ text-5xl
- **본문**: font-normal, text-base
- **라벨**: font-medium, text-sm
- **캡션**: font-normal, text-xs

### 간격
- **섹션**: gap-8, py-12
- **카드**: p-6, gap-4
- **버튼**: px-8, py-3
- **입력**: px-4, py-2

### 애니메이션
- **호버**: scale-105, shadow-glow
- **트랜지션**: transition-all duration-300
- **페이드인**: animate-fade-in-up

---

이 계획서를 바탕으로 **Phase 1부터 순차적으로 구현**하면 됩니다! 🚀

