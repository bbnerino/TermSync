/**
 * OpenAI API Wrapper
 * Based on gpt_prompt.md prompt structures
 */

import OpenAI from 'openai';
import { TermGroup, TermRecommendation, ChatResponse, Source } from '@/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const GPT_MODEL = 'gpt-4o';

// ============ 1. 용어 통일 모드 - 용어 분석 ============

export async function analyzeTerms(
  documents: Array<{ name: string; content: string }>,
  dbTerms: Array<{ standard: string; variants: string[] }>
): Promise<TermGroup[]> {
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
      "name": "그룹 이름",
      "category": "카테고리",
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
          "sentence": "전체 문장",
          "context": "문맥 설명",
          "selected": true
        }
      ],
      "selected": true
    }
  ]
}
\`\`\``;

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return parsed.termGroups || [];
}

// ============ 2. 자동 생성 모드 - UI 가이드 작성 ============

export async function generateUIGuide(
  uiElements: Array<{ type: string; text: string; description: string }>,
  appliedTerms: Array<{ standard: string; before: string[] }>,
  style?: { tone?: string; structure?: string }
): Promise<string> {
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

  const userPrompt = `
# UI 요소 정보

${uiElements.map((el, i) => `
${i + 1}. **${el.type}**: "${el.text}"
   설명: ${el.description}
`).join('\n')}

# DB 용어 (가능하면 사용)

${appliedTerms.map(t => `- ${t.standard}`).join('\n')}

${style ? `
# 스타일 가이드

- 톤: ${style.tone || '친근하고 전문적인'}
- 구조: ${style.structure || '단계별 안내'}
` : ''}

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
\`\`\``;

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  const content = response.choices[0].message.content;
  if (!content) return '';

  const parsed = JSON.parse(content);
  return parsed.content || '';
}

// ============ 3. 자동 생성 모드 - 용어 추천 ============

export async function recommendTerms(
  extractedTerms: string[],
  context: string
): Promise<TermRecommendation[]> {
  const systemPrompt = `당신은 기술 문서의 용어 표준화 전문가입니다.

역할:
- 추출된 용어에 대해 더 나은 대안 추천
- 국제 표준, 업계 관행, 사용성 관점에서 분석
- 각 추천에 대한 근거와 영향도 제공

규칙:
1. ISO, W3C, 업계 표준 용어 우선 고려
2. 사용자 친화성과 명확성 중시
3. 일관성과 통일성 확보
4. 신뢰도와 영향도를 0~1 사이로 제공
5. 대안이 없으면 빈 배열 반환`;

  const userPrompt = `
# 추출된 용어

${extractedTerms.map((t, i) => `${i + 1}. ${t}`).join('\n')}

# 문맥

${context}

# 추천 요청

위 용어들에 대해 더 나은 표준 용어를 추천해주세요.

# 응답 형식 (JSON)

\`\`\`json
{
  "recommendations": [
    {
      "original": "원래 용어",
      "recommended": "추천 용어",
      "source": "db" | "iso" | "w3c" | "industry" | "ai",
      "confidence": 0.9,
      "reasoning": "추천 이유",
      "alternatives": [
        { "term": "대안1", "reason": "이유" },
        { "term": "대안2", "reason": "이유" }
      ],
      "impact": {
        "clarity": 0.8,
        "consistency": 0.9,
        "usability": 0.85
      }
    }
  ]
}
\`\`\``;

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');

  const parsed = JSON.parse(content);
  return parsed.recommendations || [];
}

// ============ 4. 챗봇 - 문서 검색 답변 ============

export async function chatDocumentSearch(
  query: string,
  documents: Array<{ id: string; name: string; content: string }>,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<ChatResponse> {
  const systemPrompt = `당신은 기술 문서 검색 전문 AI 어시스턴트입니다.

역할:
- 사용자 질문에 대해 관련 문서를 검색하고 정확한 답변 제공
- 문서의 내용을 인용하며 출처 명시
- 찾지 못한 경우 대안 제시

규칙:
1. 문서 내용을 기반으로만 답변 (추측 금지)
2. 인용 시 문서명과 관련 문장 포함
3. 관련도가 높은 순서로 출처 정렬
4. 찾지 못한 경우 "notFound": true 반환
5. 관련 질문 제안 (suggestions)`;

  const userPrompt = `
# 사용 가능한 문서

${documents.map((d, i) => `
## 문서 ${i + 1}: ${d.name}
${d.content.substring(0, 2000)}${d.content.length > 2000 ? '...' : ''}
`).join('\n---\n')}

# 사용자 질문

${query}

# 응답 형식 (JSON)

\`\`\`json
{
  "answer": "답변 내용",
  "sources": [
    {
      "docId": "문서 ID",
      "docName": "문서명",
      "snippet": "관련 문장 또는 단락",
      "relevance": 0.9
    }
  ],
  "notFound": false,
  "suggestions": ["관련 질문1", "관련 질문2"]
}
\`\`\``;

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    messages.push(...conversationHistory.slice(-6)); // Last 3 exchanges
  }

  messages.push({ role: 'user', content: userPrompt });

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages,
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('Empty response from OpenAI');

  return JSON.parse(content);
}

// ============ 5. 챗봇 - 통계 분석 ============

export async function chatStatisticsAnalysis(
  query: string,
  statistics: {
    totalTerms: number;
    totalOccurrences: number;
    topTerms: Array<{ term: string; count: number }>;
    categories: Array<{ name: string; count: number }>;
    documents: Array<{ name: string; termCount: number }>;
  }
): Promise<string> {
  const systemPrompt = `당신은 용어 통계 분석 전문가입니다.

역할:
- 용어 사용 패턴을 분석
- 인사이트를 제공
- 시각화 가능한 형태로 정리

규칙:
1. 숫자 기반 정확한 분석
2. 시각적으로 이해하기 쉽게 설명
3. 실행 가능한 제안 포함
4. 중요도 순서로 정보 제공`;

  const userPrompt = `
# 통계 데이터

- 총 용어 수: ${statistics.totalTerms}
- 총 발생 횟수: ${statistics.totalOccurrences}

## 상위 용어
${statistics.topTerms.map((t, i) => `${i + 1}. ${t.term}: ${t.count}회`).join('\n')}

## 카테고리별 분포
${statistics.categories.map(c => `- ${c.name}: ${c.count}개`).join('\n')}

## 문서별 용어 수
${statistics.documents.map(d => `- ${d.name}: ${d.termCount}개`).join('\n')}

# 사용자 질문

${query}

# 답변 요청

위 통계 데이터를 바탕으로 사용자 질문에 답변해주세요. 구체적인 숫자와 함께 인사이트를 제공해주세요.

# 응답 형식 (JSON)

\`\`\`json
{
  "answer": "답변 내용 (마크다운)",
  "insights": ["인사이트1", "인사이트2"],
  "recommendations": ["추천사항1", "추천사항2"]
}
\`\`\``;

  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) return '';

  const parsed = JSON.parse(content);
  return parsed.answer || '';
}

// ============ Helper Functions ============

/**
 * Extract key terms from text using GPT
 */
export async function extractKeyTerms(text: string): Promise<string[]> {
  const response = await openai.chat.completions.create({
    model: GPT_MODEL,
    messages: [
      {
        role: 'system',
        content: '당신은 텍스트에서 중요한 기술 용어를 추출하는 전문가입니다. JSON 형식으로 용어 배열을 반환하세요.',
      },
      {
        role: 'user',
        content: `다음 텍스트에서 중요한 기술 용어들을 추출해주세요:\n\n${text}\n\n응답 형식: {"terms": ["용어1", "용어2", ...]}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) return [];

  const parsed = JSON.parse(content);
  return parsed.terms || [];
}

/**
 * Check if OpenAI API is properly configured
 */
export function checkOpenAIConfig(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

