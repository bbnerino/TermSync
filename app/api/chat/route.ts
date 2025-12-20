import { NextRequest, NextResponse } from 'next/server';
import { chatDocumentSearch, chatStatisticsAnalysis } from '@/lib/openai';
import { getDocuments, getTerms } from '@/lib/db/json-db';

// POST /api/chat - Chat with documents or statistics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, query, type, conversationHistory } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'Workspace ID is required' },
        { status: 400 }
      );
    }

    if (type === 'statistics') {
      // Handle statistics query
      const terms = getTerms(workspaceId);
      const documents = getDocuments(workspaceId);

      // Calculate statistics
      const totalOccurrences = terms.reduce(
        (sum, t) => sum + t.usage.reduce((s, u) => s + u.count, 0),
        0
      );

      const topTerms = terms
        .map(t => ({
          term: t.standard,
          count: t.usage.reduce((s, u) => s + u.count, 0),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Note: Categories would need to be added to the Term type
      const categories: Array<{ name: string; count: number }> = [];

      const documentsStats = documents.map(d => {
        const termCount = terms.filter(t => 
          t.usage.some(u => u.docId === d.id)
        ).length;
        return { name: d.name, termCount };
      });

      const statistics = {
        totalTerms: terms.length,
        totalOccurrences,
        topTerms,
        categories,
        documents: documentsStats,
      };

      const answer = await chatStatisticsAnalysis(query, statistics);

      return NextResponse.json({
        answer,
        sources: [],
        notFound: false,
      });
    } else {
      // Handle document search query
      const documents = getDocuments(workspaceId);

      if (documents.length === 0) {
        return NextResponse.json({
          answer: '워크스페이스에 문서가 없습니다. 먼저 문서를 업로드해주세요.',
          sources: [],
          notFound: true,
          suggestions: [
            '용어 통일 모드에서 문서를 업로드하세요',
            '자동 생성 모드에서 가이드를 만들어보세요',
          ],
        });
      }

      const response = await chatDocumentSearch(query, documents, conversationHistory);

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}

