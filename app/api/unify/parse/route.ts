import { NextRequest, NextResponse } from 'next/server';
import { parseFile, parseMultipleFiles } from '@/lib/storm';

// POST /api/unify/parse - Parse uploaded files
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Parse multiple files in parallel
    const results = await parseMultipleFiles(files);

    // Filter out failed results
    const successful = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    if (successful.length === 0) {
      return NextResponse.json(
        { error: 'All files failed to parse', failed },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: successful.map((r, i) => ({
        name: r.filename,
        content: r.text,
        size: r.filesize,
        pageCount: r.pages,
        wordCount: r.text.split(/\s+/).length,
      })),
      failed: failed.length > 0 ? failed : undefined,
    });
  } catch (error: any) {
    console.error('Error parsing files:', error);
    const errorMessage = error?.message || 'Failed to parse files';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

