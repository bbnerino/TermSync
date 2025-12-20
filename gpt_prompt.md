🤖 OpenAI API 프롬프트 전체

📋 목차

용어 통일 모드 - 용어 분석
자동 생성 모드 - UI 가이드 작성
자동 생성 모드 - 용어 추천
챗봇 - 문서 검색 답변
챗봇 - 통계 분석


1️⃣ 용어 통일 모드 - 용어 분석
프롬프트 구조
typescript// lib/openai.ts

export async function analyzeTermsWithOpenAI(
  documents: Array<{ name: string; content: string }>,
  dbTerms: Array<{ standard: string; variants: string[] }>
): Promise<any[]> {
  
  const systemPrompt = `당신은 기술 문서의 용어를 분석하는 전문가입니다.

역할:
- 여러 문서에서 같은 개념을 나타내는 다른 용어들을 찾아 그룹화
- 각 그룹에 대해 가장 적합한 표준 용어 추천
- 신뢰도와 이유를 함께 제공

규칙:
1. 같은 개념이지만 표현이 다른 용어들을 그룹화
2. 기존 DB 용어가 있으면 우선 매칭 (source: "db")
3. 새로 발견된 용어는 AI 분석 (source: "ai")
4. 각 발견 위치에 대해 행 번호, 전체 문장, 문맥 제공
5. 신뢰도는 0~1 사이 (DB 매칭은 1.0)`;

  const userPrompt = `
# 문서 내용

${documents.map((d, i) => `
## 문서 ${i + 1}: ${d.name}
${d.content}
`).join('\n---\n')}

${dbTerms.length > 0 ? `
# 기존 DB 용어 (우선 매칭)

${dbTerms.map(t => `- **${t.standard}**: ${t.variants.join(', ')}`).join('\n')}

※ DB 용어와 매칭되는 경우 source: "db", confidence: 1.0으로 설정
` : ''}

# 분석 요청

위 문서들을 분석하여 같은 개념을 나타내는 다른 용어들을 찾아주세요.

# 응답 형식 (JSON)

\`\`\`json
{
  "termGroups": [
    {
      "id": "group_1",
      "name": "그룹 이름 (예: 촬영 모드)",
      "category": "카테고리 (예: UI, 기능, 설정)",
      "source": "db" | "ai",
      "standard": "표준 용어",
      "confidence": 0.95,
      "reasoning": "이 용어를 표준으로 선택한 이유",
      "variants": ["발견된 용어1", "발견된 용어2"],
      "occurrences": [
        {
          "id": "occ_1",
          "docName": "문서명",
          "docIndex": 0,
          "line": 5,
          "before": "원래 용어",
          "after": "표준 용어",
          "sentence": "전체 문장 (용어가 포함된)",
          "context": "문맥 설명 (몇 장 몇 절, 어떤 섹션)"
        }
      ]
    }
  ]
}
\`\`\`

# 예시

입력:
- 문서1: "Auto 모드를 선택하세요."
- 문서2: "Manual 모드로 전환하세요."

출력:
\`\`\`json
{
  "termGroups": [
    {
      "id": "group_1",
      "name": "촬영 모드",
      "category": "기능",
      "source": "ai",
      "standard": "모드",
      "confidence": 0.98,
      "reasoning": "Auto와 Manual이 모두 '모드'라는 공통 개념을 나타내며, '모드'로 통일하면 간결하고 일관성 있음",
      "variants": ["Auto 모드", "Manual 모드"],
      "occurrences": [
        {
          "id": "occ_1",
          "docName": "문서1",
          "docIndex": 0,
          "line": 2,
          "before": "Auto 모드",
          "after": "모드",
          "sentence": "Auto 모드를 선택하세요.",
          "context": "1장 기본 조작 섹션"
        }
      ]
    }
  ]
}
\`\`\`

이제 분석을 시작하세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3, // 일관성을 위해 낮게
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return result.termGroups || [];
}

2️⃣ 자동 생성 모드 - UI 가이드 작성
프롬프트 구조
typescript// lib/openai.ts

export async function generateGuideWithOpenAI(
  uiElements: Array<{
    type: string;
    text: string;
    description: string;
  }>,
  dbDocuments: Array<{
    name: string;
    content: string;
  }>,
  dbTerms: Array<{
    standard: string;
  }>
): Promise<{ content: string; appliedTerms: string[] }> {
  
  const systemPrompt = `당신은 기술 문서 작성 전문가입니다.

역할:
- UI 캡처를 기반으로 사용 가이드를 작성
- 기존 DB 문서의 스타일과 톤을 정확히 모방
- DB 용어를 자동으로 적용

문서 작성 원칙:
1. DB 문서의 문체를 분석하여 동일하게 작성
2. DB 용어를 우선적으로 사용
3. 구조는 DB 문서 패턴을 따름
4. 명확하고 간결하게
5. 사용자 관점에서 작성`;

  // DB 문서에서 스타일 추출
  const styleAnalysis = `
# DB 문서 스타일 분석

${dbDocuments.map((d, i) => `
## 문서 ${i + 1}: ${d.name}
${d.content.slice(0, 1000)}
...
`).join('\n')}

**분석 항목:**
- 문체: (예: ~합니다, ~하세요)
- 구조: (예: 화면 구성 → 구성 요소 → 사용 방법 → 주의사항)
- 평균 문장 길이
- 용어 사용 패턴
`;

  const userPrompt = `
# UI 요소 정보

${uiElements.map((el, i) => `
${i + 1}. **${el.type}**: "${el.text}"
   설명: ${el.description}
`).join('\n')}

${styleAnalysis}

# DB 용어 (가능하면 사용)

${dbTerms.map(t => `- ${t.standard}`).join('\n')}

# 작성 요청

위 UI에 대한 **사용 가이드**를 작성해주세요.

**반드시 지켜야 할 것:**
1. DB 문서의 문체와 구조를 정확히 모방
2. DB 용어를 적극 활용
3. 섹션 구조를 DB 패턴과 동일하게

**응답 형식:**

\`\`\`json
{
  "content": "마크다운 형식의 가이드 전체 내용",
  "appliedTerms": ["사용된 DB 용어 목록"],
  "style": {
    "tone": "분석된 문체",
    "structure": "적용된 구조",
    "matchRate": 0.94
  }
}
\`\`\`

# 예시

**UI 요소:**
- Button: "로그인하기"
- Input: "이메일"
- Input: "비밀번호"

**DB 스타일:**
- 문체: ~합니다
- 구조: 화면 구성 → 구성 요소 → 사용 방법

**출력:**

\`\`\`json
{
  "content": "# 로그인 화면 사용 가이드\\n\\n## 1. 화면 구성\\n\\n로그인 화면은 사용자가 시스템에 접근하기 위한 첫 번째 진입점입니다...\\n\\n## 2. 구성 요소\\n\\n### 2.1 이메일 입력 필드\\n사용자의 등록된 이메일 주소를 입력합니다...",
  "appliedTerms": ["입력 필드", "클릭", "화면"],
  "style": {
    "tone": "~합니다 (존댓말)",
    "structure": "5단계 구성",
    "matchRate": 0.94
  }
}
\`\`\`

이제 가이드를 작성하세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return {
    content: result.content || '',
    appliedTerms: result.appliedTerms || [],
  };
}

3️⃣ 자동 생성 모드 - 용어 추천
프롬프트 구조
typescript// lib/openai.ts

export async function recommendTermsWithOpenAI(
  uiTexts: string[],
  dbTerms: Array<{ standard: string; variants: string[]; usage: number }>
): Promise<any[]> {
  
  const systemPrompt = `당신은 UI 용어 표준화 전문가입니다.

역할:
- UI에서 추출된 텍스트에 대해 표준 용어 추천
- 기존 DB 용어와 매칭하거나 업계 표준 제안
- 추천 이유를 명확히 설명

추천 원칙:
1. DB에 있는 용어 우선
2. 국제 표준 (ISO, W3C 등)
3. 사용자 친화성
4. 일관성
5. 명확성`;

  const userPrompt = `
# UI에서 추출된 텍스트

${uiTexts.map((text, i) => `${i + 1}. "${text}"`).join('\n')}

# 기존 DB 용어

${dbTerms.map(t => `
- **${t.standard}** (사용률: ${t.usage}%)
  동의어: ${t.variants.join(', ')}
`).join('\n')}

# 추천 요청

각 UI 텍스트에 대해 표준 용어를 추천해주세요.

# 응답 형식 (JSON)

\`\`\`json
{
  "recommendations": [
    {
      "original": "원래 UI 텍스트",
      "recommended": "추천 표준 용어",
      "source": "db" | "iso" | "w3c" | "industry" | "ai",
      "confidence": 0.95,
      "reasoning": "추천 이유",
      "alternatives": [
        {
          "term": "대안 용어",
          "reason": "대안 이유"
        }
      ],
      "impact": {
        "clarity": "명확성 점수 (0-1)",
        "consistency": "일관성 점수 (0-1)",
        "usability": "사용성 점수 (0-1)"
      }
    }
  ]
}
\`\`\`

# 예시

**입력:**
- "로그인"
- "아이디"
- "비밀번호"

**DB 용어:**
- Email (사용률: 87%)
- Password (사용률: 95%)

**출력:**

\`\`\`json
{
  "recommendations": [
    {
      "original": "로그인",
      "recommended": "Login",
      "source": "industry",
      "confidence": 0.92,
      "reasoning": "국제 표준 UI 용어로 널리 사용됨. DB에는 없지만 업계 표준",
      "alternatives": [
        {
          "term": "로그인",
          "reason": "한글 선호 시 유지 가능"
        },
        {
          "term": "Sign In",
          "reason": "다른 국제 표준 표현"
        }
      ],
      "impact": {
        "clarity": 0.95,
        "consistency": 0.90,
        "usability": 0.92
      }
    },
    {
      "original": "아이디",
      "recommended": "Email",
      "source": "db",
      "confidence": 1.0,
      "reasoning": "DB에서 87% 사용률. '아이디'보다 '이메일'이 더 명확",
      "alternatives": [
        {
          "term": "User ID",
          "reason": "일반적인 표현"
        },
        {
          "term": "이메일 주소",
          "reason": "한글 선호 시"
        }
      ],
      "impact": {
        "clarity": 1.0,
        "consistency": 0.95,
        "usability": 0.98
      }
    }
  ]
}
\`\`\`

이제 추천을 시작하세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return result.recommendations || [];
}

4️⃣ 챗봇 - 문서 검색 답변
프롬프트 구조
typescript// lib/openai.ts

export async function chatWithOpenAI(
  question: string,
  searchResults: Array<{
    id: string;
    name: string;
    content: string;
  }>
): Promise<{ answer: string; sources: any[] }> {
  
  const systemPrompt = `당신은 문서 DB 어시스턴트입니다.

역할:
- 사용자의 질문에 대해 검색된 문서를 기반으로 답변
- 정확한 출처를 명시
- 원문을 그대로 인용

답변 원칙:
1. 검색된 문서에 있는 내용만 답변
2. 추측하지 않음
3. 출처를 명확히 밝힘 (문서명 + 위치)
4. 원문을 그대로 인용
5. 찾지 못한 경우 솔직히 말함

답변 형식:
- 간결하고 명확하게
- 여러 문서에서 발견 시 모두 나열
- 문서명과 내용을 함께 제공`;

  const userPrompt = `
# 사용자 질문

${question}

# 검색된 문서

${searchResults.map((doc, i) => `
## [${i + 1}] ${doc.name}

${doc.content}
`).join('\n---\n')}

# 답변 요청

사용자의 질문에 대해 검색된 문서를 기반으로 답변해주세요.

**반드시 지켜야 할 것:**
1. 검색된 문서의 내용만 사용
2. 원문을 그대로 인용 (요약 X)
3. 출처를 명확히 밝힘

# 응답 형식 (JSON)

\`\`\`json
{
  "answer": "답변 내용 (마크다운)",
  "sources": [
    {
      "docId": "문서 ID",
      "docName": "문서명",
      "snippet": "인용된 원문",
      "relevance": 0.95
    }
  ],
  "notFound": false,
  "suggestions": ["관련 질문 제안 (선택)"]
}
\`\`\`

# 예시

**질문:** "광각 렌즈에 대해 어떻게 썼지?"

**검색 결과:**
- 문서1: "광각 렌즈는 풍경 촬영에 적합합니다."
- 문서2: "18-35mm 광각 렌즈는 초광각 영역입니다."

**출력:**

\`\`\`json
{
  "answer": "3개 문서에서 '광각 렌즈'를 찾았어요:\\n\\n**📄 문서1 (camera_manual_03.docx)**\\n> 광각 렌즈는 풍경 촬영에 적합합니다. 넓은 화각으로 더 많은 피사체를 담을 수 있습니다.\\n\\n**📄 문서2 (camera_manual_01.docx)**\\n> 18-35mm 광각 렌즈는 초광각 영역입니다.",
  "sources": [
    {
      "docId": "doc_001",
      "docName": "camera_manual_03.docx",
      "snippet": "광각 렌즈는 풍경 촬영에 적합합니다.",
      "relevance": 0.98
    },
    {
      "docId": "doc_002",
      "docName": "camera_manual_01.docx",
      "snippet": "18-35mm 광각 렌즈는 초광각 영역입니다.",
      "relevance": 0.95
    }
  ],
  "notFound": false,
  "suggestions": [
    "초광각 렌즈와 광각 렌즈의 차이는?",
    "광각 렌즈 사용 시 주의사항은?"
  ]
}
\`\`\`

이제 답변을 작성하세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return {
    answer: result.answer || '답변을 생성할 수 없습니다.',
    sources: result.sources || [],
  };
}

5️⃣ 챗봇 - 통계 분석
프롬프트 구조
typescript// lib/openai.ts

export async function analyzeTermStatistics(
  terms: Array<{
    standard: string;
    variants: string[];
    usage: Array<{ docId: string; count: number }>;
    createdAt: string;
  }>
): Promise<any> {
  
  const systemPrompt = `당신은 용어 통계 분석 전문가입니다.

역할:
- 용어 사용 패턴을 분석
- 인사이트를 제공
- 시각화 가능한 형태로 정리`;

  const userPrompt = `
# 용어 데이터

${terms.map(t => `
- **${t.standard}**
  동의어: ${t.variants.join(', ')}
  사용: ${t.usage.map(u => `${u.docId} (${u.count}회)`).join(', ')}
  생성일: ${t.createdAt}
`).join('\n')}

# 분석 요청

용어 사용 통계를 분석하고 Top 5를 제공해주세요.

# 응답 형식 (JSON)

\`\`\`json
{
  "topTerms": [
    {
      "rank": 1,
      "term": "용어명",
      "totalUsage": 8,
      "beforeUnify": [
        { "variant": "변형1", "count": 5 },
        { "variant": "변형2", "count": 3 }
      ],
      "afterUnify": { "term": "통일 용어", "count": 8 },
      "documents": ["doc1", "doc2"],
      "insight": "인사이트"
    }
  ],
  "summary": {
    "totalTerms": 9,
    "totalUsage": 40,
    "mostChanged": "가장 많이 변경된 용어",
    "consistency": 0.94
  }
}
\`\`\`

이제 분석하세요.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });
  
  const result = JSON.parse(
    completion.choices[0].message.content || '{}'
  );
  
  return result;
}

📊 프롬프트 최적화 팁
1. Temperature 설정
typescript// 일관성 중요 (용어 분석, 챗봇)
temperature: 0.3

// 창의성 필요 (가이드 작성)
temperature: 0.5

// 다양성 필요 (용어 추천 대안)
temperature: 0.7
2. Token 제한
typescript// 짧은 답변
max_tokens: 1000

// 긴 가이드
max_tokens: 3000

// 제한 없음
max_tokens: null
3. JSON 모드
typescript// 구조화된 응답 필요 시
response_format: { type: 'json_object' }

// 일반 텍스트
response_format: { type: 'text' }
```

---

## ✅ 전체 프롬프트 요약
```
1. 용어 분석
   - 여러 문서 비교
   - DB 용어 우선 매칭
   - 신뢰도 + 이유

2. UI 가이드 작성
   - DB 스타일 모방
   - DB 용어 적용
   - 구조 일관성

3. 용어 추천
   - DB 매칭
   - 업계 표준
   - 대안 제시

4. 챗봇 답변
   - 원문 인용
   - 출처 명시
   - 간결한 답변

5. 통계 분석
   - Top 5
   - 인사이트
   - 시각화 데이터