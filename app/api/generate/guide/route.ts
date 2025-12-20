import { NextRequest, NextResponse } from 'next/server';
import { generateUIGuide, recommendTerms, extractKeyTerms } from '@/lib/openai';
import { getTerms } from '@/lib/db/json-db';

// POST /api/generate/guide - Generate UI guide from extracted text
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, extractedText, options } = body;

    if (extractedText === undefined || extractedText === null) {
      return NextResponse.json(
        { error: 'Extracted text is required' },
        { status: 400 }
      );
    }

    // Handle empty text case
    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({
        guide: {
          id: `guide-${Date.now()}`,
          workspaceId: workspaceId || null,
          title: 'AI 생성 가이드',
          content: '추출된 텍스트가 없어 가이드를 생성할 수 없습니다. 더 선명한 이미지를 업로드하거나, 텍스트가 포함된 UI 화면을 업로드해주세요.',
          appliedTerms: [],
          style: {
            tone: '친근하고 전문적인',
            structure: '단계별 안내',
            matchRate: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        recommendations: [],
        uiElements: [],
        extractedTerms: [],
      });
    }

    // Step 1: Extract key terms from text
    const extractedTerms = await extractKeyTerms(extractedText);

    // Step 2: Create mock UI elements from extracted text
    // In a real implementation, you would use computer vision to detect UI elements
    const uiElements = extractedTerms.slice(0, 10).map((term, index) => ({
      type: index === 0 ? 'heading' : index % 3 === 0 ? 'button' : 'input',
      text: term,
      description: `${term} element`,
    }));

    // Step 3: Get term recommendations
    const recommendations = await recommendTerms(extractedTerms, extractedText);

    // Step 4: Get existing terms from workspace if specified
    let appliedTerms: Array<{ standard: string; before: string[] }> = [];
    if (workspaceId && options?.useDBTerms) {
      const dbTerms = getTerms(workspaceId);
      appliedTerms = dbTerms.map(t => ({
        standard: t.standard,
        before: t.variants,
      }));
    }

    // Step 5: Generate guide with applied terms
    const style = options?.useDBStyle ? {
      tone: '친근하고 전문적인',
      structure: '단계별 안내',
    } : undefined;

    const guideContent = await generateUIGuide(uiElements, appliedTerms, style);

    return NextResponse.json({
      guide: {
        id: `guide-${Date.now()}`,
        workspaceId: workspaceId || null,
        title: 'AI 생성 가이드',
        content: guideContent,
        appliedTerms: appliedTerms.map(t => t.standard),
        style: {
          tone: style?.tone || '친근하고 전문적인',
          structure: style?.structure || '단계별 안내',
          matchRate: appliedTerms.length > 0 ? 0.85 : 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      recommendations,
      uiElements,
      extractedTerms,
    });
  } catch (error) {
    console.error('Error generating guide:', error);
    return NextResponse.json(
      { error: 'Failed to generate guide' },
      { status: 500 }
    );
  }
}

