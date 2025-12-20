import { NextRequest, NextResponse } from 'next/server';
import { analyzeTerms } from '@/lib/openai';
import { getTerms } from '@/lib/db/json-db';

// POST /api/unify/analyze - Analyze terms in documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, documents } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: 'Documents are required' },
        { status: 400 }
      );
    }

    // Get existing terms from DB if workspace is specified
    let dbTerms: Array<{ standard: string; variants: string[] }> = [];
    if (workspaceId) {
      const terms = getTerms(workspaceId);
      dbTerms = terms.map(t => ({
        standard: t.standard,
        variants: t.variants,
      }));
    }

    // Analyze terms using OpenAI
    const termGroups = await analyzeTerms(documents, dbTerms);

    return NextResponse.json({ termGroups });
  } catch (error) {
    console.error('Error analyzing terms:', error);
    return NextResponse.json(
      { error: 'Failed to analyze terms' },
      { status: 500 }
    );
  }
}

