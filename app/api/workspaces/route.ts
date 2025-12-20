import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaces, createWorkspace } from '@/lib/db/json-db';

// GET /api/workspaces - List all workspaces
export async function GET() {
  try {
    const workspaces = getWorkspaces();
    return NextResponse.json({ workspaces });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const workspace = createWorkspace({ name, description });
    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}

