완전판 TermSync 풀스택 구조

📋 기술 스택 확정
프론트엔드: Next.js + Zustand + Tailwind
문서 파싱: Sionic API (STORM Parse)
AI 분석: OpenAI API (GPT-4)
DB: JSON 파일 (Storm Bucket 모킹)

= 모두 당신이 구현!

📂 완전한 프로젝트 구조
termsync/
├── app/
│   ├── layout.tsx                    # 글로벌 레이아웃
│   ├── page.tsx                      # 랜딩 페이지
│   │
│   ├── workspace/
│   │   ├── page.tsx                  # 워크스페이스 선택
│   │   └── [id]/
│   │       ├── page.tsx              # 모드 선택
│   │       │
│   │       ├── unify/                # 📖 용어 통일 모드
│   │       │   ├── upload/
│   │       │   │   └── page.tsx      # 1. 파일 업로드
│   │       │   ├── analyze/
│   │       │   │   └── page.tsx      # 2. AI 분석 진행
│   │       │   ├── review/
│   │       │   │   └── page.tsx      # 3. 그룹 검토 ⭐
│   │       │   ├── confirm/
│   │       │   │   └── page.tsx      # 4. 최종 확인
│   │       │   └── result/
│   │       │       └── page.tsx      # 5. 완료
│   │       │
│   │       └── generate/             # 🤖 자동 생성 모드
│   │           ├── page.tsx          # 메인 (챗봇 + 탭)
│   │           ├── guide/
│   │           │   └── page.tsx      # UI 가이드 작성
│   │           └── terms/
│   │               └── page.tsx      # 용어 추천
│   │
│   └── api/                          # 🔥 API Routes (당신이 구현)
│       ├── workspace/
│       │   ├── route.ts              # GET, POST 워크스페이스
│       │   └── [id]/
│       │       └── route.ts          # GET, PUT, DELETE
│       │
│       ├── unify/
│       │   ├── upload/
│       │   │   └── route.ts          # 파일 업로드
│       │   ├── parse/
│       │   │   └── route.ts          # Sionic Parse 호출
│       │   ├── analyze/
│       │   │   └── route.ts          # OpenAI 분석
│       │   └── generate/
│       │       └── route.ts          # 문서 생성 + DB 저장
│       │
│       ├── generate/
│       │   ├── guide/
│       │   │   └── route.ts          # UI 가이드 생성
│       │   └── terms/
│       │       └── route.ts          # 용어 추천
│       │
│       └── chat/
│           └── route.ts              # 챗봇 (DB 검색 + OpenAI)
│
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── ProgressBar.tsx
│   │
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   ├── workspace/
│   │   ├── WorkspaceCard.tsx
│   │   ├── WorkspaceList.tsx
│   │   └── WorkspaceCreateModal.tsx
│   │
│   ├── unify/
│   │   ├── FileUploader.tsx          # 드래그앤드롭
│   │   ├── DBToggle.tsx              # DB 활용 On/Off
│   │   ├── AnalysisProgress.tsx      # 진행 상황
│   │   ├── TermGroupCard.tsx         # ⭐ 가장 중요!
│   │   ├── TermGroupDetail.tsx       # 펼친 상태
│   │   ├── ManualGroupModal.tsx      # 수동 그룹 추가
│   │   ├── StatsPanel.tsx            # 우측 통계
│   │   ├── FinalSummary.tsx          # 최종 확인
│   │   └── ResultDownload.tsx        # 완료 화면
│   │
│   └── generate/
│       ├── Chatbot.tsx               # ⭐ 챗봇
│       ├── ChatMessage.tsx           # 챗 메시지
│       ├── ChatInput.tsx             # 입력창
│       ├── SourceCard.tsx            # 출처 카드
│       ├── GuideEditor.tsx           # 가이드 편집기
│       ├── GuidePreview.tsx          # 미리보기
│       ├── ImageUploader.tsx         # UI 캡처 업로드
│       └── TermRecommendation.tsx    # 용어 추천 결과
│
├── store/
│   ├── workspaceStore.ts             # 워크스페이스 상태
│   ├── unifyStore.ts                 # 용어 통일 상태
│   ├── generateStore.ts              # 자동 생성 상태
│   └── chatStore.ts                  # 챗봇 상태
│
├── lib/
│   ├── api/
│   │   ├── workspace.ts              # 워크스페이스 API
│   │   ├── unify.ts                  # 용어 통일 API
│   │   ├── generate.ts               # 자동 생성 API
│   │   └── chat.ts                   # 챗봇 API
│   │
│   ├── db/
│   │   ├── index.ts                  # DB 인터페이스
│   │   ├── json-db.ts                # JSON 파일 DB 구현
│   │   └── storm-bucket.ts           # Storm Bucket (빈 껍데기)
│   │
│   ├── sionic.ts                     # Sionic Parse SDK 래퍼
│   ├── openai.ts                     # OpenAI SDK 래퍼
│   └── utils.ts                      # 유틸 함수
│
├── types/
│   ├── index.ts
│   ├── workspace.ts
│   ├── unify.ts
│   ├── generate.ts
│   ├── chat.ts
│   └── db.ts
│
├── data/                             # JSON DB 파일들
│   ├── workspaces.json
│   ├── documents.json
│   └── terms.json
│
├── public/
│   └── ...
│
├── styles/
│   └── globals.css
│
├── .env.local
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json

🔧 핵심 파일 구조
1. API Route: 문서 파싱 (Sionic)
typescript// app/api/unify/parse/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { parseDocumentWithSionic } from '@/lib/sionic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    // Sionic API로 문서 파싱
    const parsedDocuments = await Promise.all(
      files.map(async (file) => {
        const text = await parseDocumentWithSionic(file);
        return {
          name: file.name,
          content: text,
          size: file.size,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      documents: parsedDocuments,
    });
    
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse documents' },
      { status: 500 }
    );
  }
}

2. API Route: AI 분석 (OpenAI)
typescript// app/api/unify/analyze/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { analyzeTermsWithOpenAI } from '@/lib/openai';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, documents, dbEnabled } = await request.json();
    
    let dbTerms = [];
    
    // DB 활용이 켜져있으면 기존 용어 가져오기
    if (dbEnabled) {
      dbTerms = await db.listTerms(workspaceId);
    }
    
    // OpenAI로 용어 분석
    const termGroups = await analyzeTermsWithOpenAI(
      documents,
      dbTerms
    );
    
    return NextResponse.json({
      success: true,
      termGroups,
      stats: {
        totalGroups: termGroups.length,
        dbMatches: termGroups.filter(g => g.source === 'db').length,
        aiAnalyzed: termGroups.filter(g => g.source === 'ai').length,
      },
    });
    
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze terms' },
      { status: 500 }
    );
  }
}

3. Sionic SDK 래퍼
typescript// lib/sionic.ts

const SIONIC_API_URL = process.env.SIONIC_API_URL;
const SIONIC_API_KEY = process.env.SIONIC_API_KEY;

export async function parseDocumentWithSionic(
  file: File
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${SIONIC_API_URL}/parse`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SIONIC_API_KEY}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Sionic parse failed');
  }
  
  const data = await response.json();
  return data.text; // 파싱된 텍스트
}

4. OpenAI SDK 래퍼
typescript// lib/openai.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeTermsWithOpenAI(
  documents: Array<{ name: string; content: string }>,
  dbTerms: any[]
): Promise<any[]> {
  
  const prompt = `
다음 문서들에서 같은 개념을 나타내는 다른 용어들을 찾아주세요.

문서:
${documents.map(d => `
[${d.name}]
${d.content}
`).join('\n---\n')}

${dbTerms.length > 0 ? `
기존 DB 용어 (우선 매칭):
${dbTerms.map(t => `- ${t.standard}: ${t.variants.join(', ')}`).join('\n')}
` : ''}

응답 형식 (JSON):
{
  "termGroups": [
    {
      "name": "그룹명",
      "source": "db" | "ai",
      "standard": "표준 용어",
      "variants": ["용어1", "용어2"],
      "confidence": 0.95,
      "occurrences": [
        {
          "docName": "문서명",
          "line": 5,
          "before": "원래 용어",
          "after": "표준 용어",
          "sentence": "전체 문장",
          "context": "문맥 설명"
        }
      ]
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '당신은 기술 문서의 용어를 분석하는 전문가입니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: { type: 'json_object' },
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return result.termGroups || [];
}

export async function generateGuideWithOpenAI(
  imageDescriptions: string[],
  dbDocuments: any[]
): Promise<string> {
  
  const prompt = `
UI 캡처 이미지 설명:
${imageDescriptions.join('\n')}

DB 문서 스타일 참고:
${dbDocuments.map(d => d.content.slice(0, 500)).join('\n---\n')}

위 UI에 대한 사용 가이드를 DB 문서 스타일에 맞춰 작성해주세요.
구조: 화면 구성 → 구성 요소 → 사용 방법 → 주의사항
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '당신은 기술 문서 작성 전문가입니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  
  return completion.choices[0].message.content || '';
}

export async function chatWithOpenAI(
  question: string,
  searchResults: any[]
): Promise<{ answer: string; sources: any[] }> {
  
  const prompt = `
질문: ${question}

검색된 문서:
${searchResults.map(d => `
[${d.name}]
${d.content}
`).join('\n---\n')}

사용자의 질문에 대해 검색된 문서를 기반으로 답변해주세요.
출처를 명확히 밝히세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: '당신은 문서 DB 어시스턴트입니다.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });
  
  return {
    answer: completion.choices[0].message.content || '',
    sources: searchResults.map(d => ({
      id: d.id,
      name: d.name,
      snippet: d.content.slice(0, 200),
    })),
  };
}

5. JSON DB 구현
typescript// lib/db/json-db.ts

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'data');

class JsonDatabase {
  private async read<T>(filename: string): Promise<T[]> {
    try {
      const content = await fs.readFile(
        path.join(DATA_DIR, filename),
        'utf-8'
      );
      return JSON.parse(content);
    } catch {
      return [];
    }
  }
  
  private async write<T>(filename: string, data: T[]): Promise<void> {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(
      path.join(DATA_DIR, filename),
      JSON.stringify(data, null, 2)
    );
  }
  
  // Documents
  async saveDocument(doc: any) {
    const docs = await this.read('documents.json');
    const newDoc = { ...doc, id: uuidv4() };
    docs.push(newDoc);
    await this.write('documents.json', docs);
    return newDoc;
  }
  
  async searchDocuments(workspaceId: string, query: string) {
    const docs = await this.read('documents.json');
    return docs.filter(
      (d: any) =>
        d.workspaceId === workspaceId &&
        d.content.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  // Terms
  async saveTerm(term: any) {
    const terms = await this.read('terms.json');
    const newTerm = { ...term, id: uuidv4() };
    terms.push(newTerm);
    await this.write('terms.json', terms);
    return newTerm;
  }
  
  async listTerms(workspaceId: string) {
    const terms = await this.read('terms.json');
    return terms.filter((t: any) => t.workspaceId === workspaceId);
  }
  
  // Workspaces
  async createWorkspace(workspace: any) {
    const workspaces = await this.read('workspaces.json');
    const newWs = {
      ...workspace,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workspaces.push(newWs);
    await this.write('workspaces.json', workspaces);
    return newWs;
  }
  
  async listWorkspaces() {
    return await this.read('workspaces.json');
  }
}

export const db = new JsonDatabase();

6. Zustand Store
typescript// store/unifyStore.ts

import { create } from 'zustand';

interface UnifyStore {
  // 상태
  workspaceId: string;
  files: File[];
  dbEnabled: boolean;
  step: 'upload' | 'analyze' | 'review' | 'confirm' | 'result';
  
  // 분석 결과
  parsedDocuments: any[];
  termGroups: any[];
  selectedGroups: Set<string>;
  
  // 통계
  stats: {
    totalChanges: number;
    dbMatches: number;
    aiAnalyzed: number;
  };
  
  // 액션
  setWorkspaceId: (id: string) => void;
  setFiles: (files: File[]) => void;
  toggleDB: () => void;
  setStep: (step: UnifyStore['step']) => void;
  
  // API 호출
  uploadAndParse: () => Promise<void>;
  analyze: () => Promise<void>;
  toggleGroup: (groupId: string) => void;
  generate: () => Promise<void>;
}

export const useUnifyStore = create<UnifyStore>((set, get) => ({
  workspaceId: '',
  files: [],
  dbEnabled: false,
  step: 'upload',
  parsedDocuments: [],
  termGroups: [],
  selectedGroups: new Set(),
  stats: { totalChanges: 0, dbMatches: 0, aiAnalyzed: 0 },
  
  setWorkspaceId: (id) => set({ workspaceId: id }),
  setFiles: (files) => set({ files }),
  toggleDB: () => set((s) => ({ dbEnabled: !s.dbEnabled })),
  setStep: (step) => set({ step }),
  
  uploadAndParse: async () => {
    const { files } = get();
    
    // API: 파일 업로드 + Sionic Parse
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    
    const res = await fetch('/api/unify/parse', {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    
    set({
      parsedDocuments: data.documents,
      step: 'analyze',
    });
  },
  
  analyze: async () => {
    const { workspaceId, parsedDocuments, dbEnabled } = get();
    
    // API: OpenAI 분석
    const res = await fetch('/api/unify/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        documents: parsedDocuments,
        dbEnabled,
      }),
    });
    
    const data = await res.json();
    
    set({
      termGroups: data.termGroups,
      stats: data.stats,
      step: 'review',
    });
  },
  
  toggleGroup: (groupId) =>
    set((s) => {
      const newSet = new Set(s.selectedGroups);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return { selectedGroups: newSet };
    }),
  
  generate: async () => {
    const { workspaceId, termGroups, selectedGroups } = get();
    
    const selected = termGroups.filter(g =>
      selectedGroups.has(g.id)
    );
    
    // API: 문서 생성 + DB 저장
    await fetch('/api/unify/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        termGroups: selected,
        saveToDb: true,
      }),
    });
    
    set({ step: 'result' });
  },
}));

7. 챗봇 Store
typescript// store/chatStore.ts

import { create } from 'zustand';

interface ChatStore {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
  }>;
  isLoading: boolean;
  
  sendMessage: (workspaceId: string, question: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  
  sendMessage: async (workspaceId, question) => {
    // 사용자 메시지 추가
    set((s) => ({
      messages: [...s.messages, { role: 'user', content: question }],
      isLoading: true,
    }));
    
    // API: 챗봇
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspaceId, question }),
    });
    
    const data = await res.json();
    
    // AI 답변 추가
    set((s) => ({
      messages: [
        ...s.messages,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
        },
      ],
      isLoading: false,
    }));
  },
  
  clearMessages: () => set({ messages: [] }),
}));

🔑 환경 변수
bash# .env.local

# Sionic API
SIONIC_API_URL=https://api.sionic.ai
SIONIC_API_KEY=sk-sionic-xxxxx

# OpenAI API
OPENAI_API_KEY=sk-xxxxx

# 개발 모드
NODE_ENV=development
USE_STORM_BUCKET=false

📦 package.json
json{
  "name": "termsync",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "openai": "^4.20.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## ✅ 핵심 요약
```
당신이 구현하는 것:
✅ UI/UX (Next.js + Tailwind)
✅ API Routes (Sionic + OpenAI 연동)
✅ JSON DB (Storm Bucket 모킹)
✅ Zustand 상태 관리

= 완전히 동작하는 풀스택 앱!

나중에 팀원이 가져갈 것:
→ app/api/ (Sionic Platform으로)
→ lib/db/json-db.ts (Storm Bucket으로)
→ 나머지는 그대로 사용
