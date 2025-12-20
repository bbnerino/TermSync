import { NextRequest, NextResponse } from "next/server";
import { createDocument, createTermsBatch } from "@/lib/db/json-db";
import { TermGroup } from "@/types";
import { Document, Term } from "@/types/db";

// POST /api/unify/apply - Apply term unification and save to DB
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, documents, termGroups, saveToDb = true } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { error: "Documents are required" },
        { status: 400 }
      );
    }

    if (!termGroups || !Array.isArray(termGroups)) {
      return NextResponse.json(
        { error: "Term groups are required" },
        { status: 400 }
      );
    }

    // Apply term replacements to documents
    const processedDocuments = applyTermReplacements(documents, termGroups);

    let savedDocuments: Document[] = [];
    let savedTerms: Term[] = [];

    // Save to DB if requested
    if (saveToDb) {
      // Save documents to DB
      savedDocuments = processedDocuments.map((doc) =>
        createDocument({
          workspaceId,
          name: doc.name.replace(/\.[^/.]+$/, "_unified.docx"),
          content: doc.content,
        })
      );

      // Save terms to DB
      const termsData = termGroups
        .filter((g: TermGroup) => g.selected)
        .map((g: TermGroup) => ({
          standard: g.standard,
          variants: g.variants,
          usage: savedDocuments.map((doc) => ({
            docId: doc.id,
            count: countOccurrences(doc.content, g.standard),
          })),
        }));

      savedTerms = createTermsBatch(workspaceId, termsData);
    }

    return NextResponse.json({
      documents: processedDocuments,
      savedDocuments: saveToDb ? savedDocuments : [],
      savedTerms: saveToDb ? savedTerms : [],
      stats: {
        documentsProcessed: processedDocuments.length,
        termsUnified: termGroups.filter((g: TermGroup) => g.selected).length,
        totalReplacements: termGroups.reduce(
          (sum: number, g: TermGroup) =>
            sum + g.occurrences.filter((o) => o.selected).length,
          0
        ),
        savedToDb: saveToDb,
      },
    });
  } catch (error) {
    console.error("Error applying term unification:", error);
    return NextResponse.json(
      { error: "Failed to apply term unification" },
      { status: 500 }
    );
  }
}

// Helper: Apply term replacements to documents
function applyTermReplacements(
  documents: Array<{ name: string; content: string }>,
  termGroups: TermGroup[]
): Array<{ name: string; content: string }> {
  return documents.map((doc) => {
    let content = doc.content;

    // Apply selected replacements
    termGroups.forEach((group) => {
      if (group.selected) {
        group.occurrences.forEach((occ) => {
          if (occ.selected && occ.docName === doc.name) {
            // Replace the specific occurrence
            content = content.replace(occ.before, occ.after);
          }
        });
      }
    });

    return { name: doc.name, content };
  });
}

// Helper: Count occurrences of a term in content
function countOccurrences(content: string, term: string): number {
  const regex = new RegExp(term, "gi");
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}
