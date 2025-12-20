export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: string;
}

export interface Source {
  docId: string;
  docName: string;
  snippet: string;
  relevance: number;
}

export interface ChatResponse {
  answer: string;
  sources: Source[];
  notFound?: boolean;
  suggestions?: string[];
}

