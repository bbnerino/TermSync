import { NextRequest, NextResponse } from 'next/server';
import { parseMultipleFiles } from '@/lib/storm';

// POST /api/generate/parse - Parse images/documents to extract text
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const workspaceId = formData.get('workspaceId') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Parse files using STORM API
    const results = await parseMultipleFiles(files);

    // Combine all extracted text
    const extractedText = results
      .filter(r => !r.error)
      .map(r => r.text)
      .join('\n\n');

    if (!extractedText) {
      return NextResponse.json(
        { error: 'Failed to extract text from images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      extractedText,
      files: results.map(r => ({
        filename: r.filename,
        success: !r.error,
        error: r.error,
      })),
    });
  } catch (error) {
    console.error('Error parsing files:', error);
    return NextResponse.json(
      { error: 'Failed to parse files' },
      { status: 500 }
    );
  }
}

