export interface Document {
  id: string;
  workspaceId: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Term {
  id: string;
  workspaceId: string;
  standard: string;
  variants: string[];
  usage: Array<{
    docId: string;
    count: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

