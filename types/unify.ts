export interface TermGroup {
  id: string;
  name: string;
  category: string;
  source: 'db' | 'ai';
  standard: string;
  confidence: number;
  reasoning: string;
  variants: string[];
  occurrences: Occurrence[];
  selected: boolean;
}

export interface Occurrence {
  id: string;
  docName: string;
  docIndex: number;
  line: number;
  before: string;
  after: string;
  sentence: string;
  context: string;
  selected: boolean;
}

export interface ParsedDocument {
  name: string;
  content: string;
  size: number;
  pageCount?: number;
  wordCount?: number;
}

export interface UnifyStats {
  totalGroups: number;
  selectedGroups: number;
  totalChanges: number;
  dbMatches: number;
  aiAnalyzed: number;
}

export type UnifyStep = 'upload' | 'analyze' | 'review' | 'confirm' | 'result';

