import { NextRequest, NextResponse } from 'next/server';
import { recommendTerms, extractKeyTerms } from '@/lib/openai';

// POST /api/generate/recommend - Recommend terms for UI elements
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, extractedText } = body;

    if (!extractedText) {
      return NextResponse.json(
        { error: 'Extracted text is required' },
        { status: 400 }
      );
    }

    // Step 1: Extract key terms from text using OpenAI
    const extractedTerms = await extractKeyTerms(extractedText);

    if (extractedTerms.length === 0) {
      return NextResponse.json({
        recommendations: [],
        message: '추출된 용어가 없습니다.',
      });
    }

    // Step 2: Get recommendations for each term
    const recommendations = await recommendTerms(extractedTerms, extractedText);

    return NextResponse.json({
      recommendations,
      extractedTerms,
      totalTerms: extractedTerms.length,
    });
  } catch (error) {
    console.error('Error recommending terms:', error);
    return NextResponse.json(
      { error: 'Failed to recommend terms' },
      { status: 500 }
    );
  }
}

