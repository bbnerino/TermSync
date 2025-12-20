export interface Guide {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  appliedTerms: string[];
  style: {
    tone: string;
    structure: string;
    matchRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UIElement {
  type: string;
  text: string;
  description: string;
}

export interface TermRecommendation {
  original: string;
  recommended: string;
  source: 'db' | 'iso' | 'w3c' | 'industry' | 'ai';
  confidence: number;
  reasoning: string;
  alternatives: Alternative[];
  impact: {
    clarity: number;
    consistency: number;
    usability: number;
  };
}

export interface Alternative {
  term: string;
  reason: string;
}

export type GenerateStep = 'upload' | 'generating' | 'preview' | 'edit';

