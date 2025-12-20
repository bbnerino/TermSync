import fs from 'fs';
import path from 'path';
import { Workspace, Document, Term } from '@/types';

const DATA_DIR = path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper: Read JSON file
function readJSON<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) {
    return [];
  }
  const data = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(data);
}

// Helper: Write JSON file
function writeJSON<T>(filename: string, data: T[]): void {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// ============ Workspaces ============

export function getWorkspaces(): Workspace[] {
  return readJSON<Workspace>('workspaces.json');
}

export function getWorkspace(id: string): Workspace | null {
  const workspaces = getWorkspaces();
  return workspaces.find(w => w.id === id) || null;
}

export function createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt' | 'termCount' | 'documentCount'>): Workspace {
  const workspaces = getWorkspaces();
  const now = new Date().toISOString();
  const workspace: Workspace = {
    ...data,
    id: `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
    termCount: 0,
    documentCount: 0,
  };
  workspaces.push(workspace);
  writeJSON('workspaces.json', workspaces);
  return workspace;
}

export function updateWorkspace(id: string, updates: Partial<Workspace>): Workspace | null {
  const workspaces = getWorkspaces();
  const index = workspaces.findIndex(w => w.id === id);
  if (index === -1) return null;
  
  workspaces[index] = {
    ...workspaces[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON('workspaces.json', workspaces);
  return workspaces[index];
}

export function deleteWorkspace(id: string): boolean {
  const workspaces = getWorkspaces();
  const filtered = workspaces.filter(w => w.id !== id);
  if (filtered.length === workspaces.length) return false;
  
  // Also delete all documents and terms in this workspace
  const documents = getDocuments().filter(d => d.workspaceId !== id);
  writeJSON('documents.json', documents);
  
  const terms = getTerms().filter(t => t.workspaceId !== id);
  writeJSON('terms.json', terms);
  
  writeJSON('workspaces.json', filtered);
  return true;
}

// ============ Documents ============

export function getDocuments(workspaceId?: string): Document[] {
  const docs = readJSON<Document>('documents.json');
  if (workspaceId) {
    return docs.filter(d => d.workspaceId === workspaceId);
  }
  return docs;
}

export function getDocument(id: string): Document | null {
  const documents = getDocuments();
  return documents.find(d => d.id === id) || null;
}

export function createDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Document {
  const documents = getDocuments();
  const now = new Date().toISOString();
  const document: Document = {
    ...data,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  documents.push(document);
  writeJSON('documents.json', documents);
  
  // Update workspace document count
  updateWorkspaceStats(data.workspaceId);
  
  return document;
}

export function updateDocument(id: string, updates: Partial<Document>): Document | null {
  const documents = getDocuments();
  const index = documents.findIndex(d => d.id === id);
  if (index === -1) return null;
  
  documents[index] = {
    ...documents[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON('documents.json', documents);
  return documents[index];
}

export function deleteDocument(id: string): boolean {
  const documents = getDocuments();
  const doc = documents.find(d => d.id === id);
  if (!doc) return false;
  
  const filtered = documents.filter(d => d.id !== id);
  writeJSON('documents.json', filtered);
  
  // Update workspace document count
  updateWorkspaceStats(doc.workspaceId);
  
  return true;
}

// ============ Terms ============

export function getTerms(workspaceId?: string): Term[] {
  const terms = readJSON<Term>('terms.json');
  if (workspaceId) {
    return terms.filter(t => t.workspaceId === workspaceId);
  }
  return terms;
}

export function getTerm(id: string): Term | null {
  const terms = getTerms();
  return terms.find(t => t.id === id) || null;
}

export function createTerm(data: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>): Term {
  const terms = getTerms();
  const now = new Date().toISOString();
  const term: Term = {
    ...data,
    id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  terms.push(term);
  writeJSON('terms.json', terms);
  
  // Update workspace term count
  updateWorkspaceStats(data.workspaceId);
  
  return term;
}

export function updateTerm(id: string, updates: Partial<Term>): Term | null {
  const terms = getTerms();
  const index = terms.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  terms[index] = {
    ...terms[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  writeJSON('terms.json', terms);
  return terms[index];
}

export function deleteTerm(id: string): boolean {
  const terms = getTerms();
  const term = terms.find(t => t.id === id);
  if (!term) return false;
  
  const filtered = terms.filter(t => t.id !== id);
  writeJSON('terms.json', filtered);
  
  // Update workspace term count
  updateWorkspaceStats(term.workspaceId);
  
  return true;
}

// ============ Search & Filter ============

export function searchTerms(workspaceId: string, query: string): Term[] {
  const terms = getTerms(workspaceId);
  const lowerQuery = query.toLowerCase();
  return terms.filter(t => 
    t.standard.toLowerCase().includes(lowerQuery) ||
    t.variants.some(v => v.toLowerCase().includes(lowerQuery))
  );
}

export function searchDocuments(workspaceId: string, query: string): Document[] {
  const documents = getDocuments(workspaceId);
  const lowerQuery = query.toLowerCase();
  return documents.filter(d => 
    d.name.toLowerCase().includes(lowerQuery) ||
    d.content.toLowerCase().includes(lowerQuery)
  );
}

// ============ Helpers ============

function updateWorkspaceStats(workspaceId: string): void {
  const workspace = getWorkspace(workspaceId);
  if (!workspace) return;
  
  const documentCount = getDocuments(workspaceId).length;
  const termCount = getTerms(workspaceId).length;
  
  updateWorkspace(workspaceId, { documentCount, termCount });
}

// ============ Batch Operations ============

export function createTermsBatch(workspaceId: string, termsData: Omit<Term, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt'>[]): Term[] {
  const terms = getTerms();
  const now = new Date().toISOString();
  
  const newTerms = termsData.map(data => ({
    ...data,
    workspaceId,
    id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  }));
  
  terms.push(...newTerms);
  writeJSON('terms.json', terms);
  
  // Update workspace term count
  updateWorkspaceStats(workspaceId);
  
  return newTerms;
}

