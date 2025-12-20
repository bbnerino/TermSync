export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  termCount: number;
  documentCount: number;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

