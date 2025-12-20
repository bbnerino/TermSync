import { NextRequest, NextResponse } from 'next/server';
import { getWorkspace, updateWorkspace, deleteWorkspace } from '@/lib/db/json-db';

// GET /api/workspaces/[id] - Get workspace by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const workspace = getWorkspace(params.id);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error fetching workspace:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workspace' },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[id] - Update workspace
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const workspace = updateWorkspace(params.id, body);
    
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[id] - Delete workspace
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = deleteWorkspace(params.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    );
  }
}

