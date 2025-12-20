import { NextRequest, NextResponse } from "next/server";
import { analyzeTerms } from "@/lib/openai";
import { getTerms } from "@/lib/db/json-db";

// POST /api/unify/analyze - Analyze terms in documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, documents } = body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json(
        { error: "Documents are required" },
        { status: 400 }
      );
    }

    // Get existing terms from DB if workspace is specified
    let dbTerms: Array<{ standard: string; variants: string[] }> = [];
    if (workspaceId) {
      const terms = getTerms(workspaceId);
      dbTerms = terms.map((t) => ({
        standard: t.standard,
        variants: t.variants,
      }));
    }

    // Analyze terms using OpenAI
    const termGroups = await analyzeTerms(documents, dbTerms);

    if (!termGroups || !Array.isArray(termGroups)) {
      return NextResponse.json(
        { error: "Invalid response format from AI analysis" },
        { status: 500 }
      );
    }

    return NextResponse.json({ termGroups });
  } catch (error: any) {
    console.error("Error analyzing terms:", error);
    const errorMessage = error?.message || "Failed to analyze terms";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
