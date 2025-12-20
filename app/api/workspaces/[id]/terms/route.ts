import { NextRequest, NextResponse } from 'next/server';
import { getTerms } from '@/lib/db/json-db';

// GET /api/workspaces/[id]/terms - Get terms for a workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const terms = getTerms(id);

    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Error fetching workspace terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}

