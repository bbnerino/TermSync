import { create } from 'zustand';
import { Workspace } from '@/types';

interface WorkspaceState {
  // Current workspace
  currentWorkspace: Workspace | null;
  
  // All workspaces
  workspaces: Workspace[];
  
  // Loading state
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  removeWorkspace: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  workspaces: [],
  isLoading: false,
  error: null,

  setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

  setWorkspaces: (workspaces) => set({ workspaces }),

  addWorkspace: (workspace) => {
    const { workspaces } = get();
    set({ workspaces: [...workspaces, workspace] });
  },

  updateWorkspace: (id, updates) => {
    const { workspaces, currentWorkspace } = get();
    const updatedWorkspaces = workspaces.map(w =>
      w.id === id ? { ...w, ...updates } : w
    );
    
    let updatedCurrent = currentWorkspace;
    if (currentWorkspace && currentWorkspace.id === id) {
      updatedCurrent = { ...currentWorkspace, ...updates };
    }
    
    set({ workspaces: updatedWorkspaces, currentWorkspace: updatedCurrent });
  },

  removeWorkspace: (id) => {
    const { workspaces, currentWorkspace } = get();
    const filtered = workspaces.filter(w => w.id !== id);
    
    let updatedCurrent = currentWorkspace;
    if (currentWorkspace && currentWorkspace.id === id) {
      updatedCurrent = null;
    }
    
    set({ workspaces: filtered, currentWorkspace: updatedCurrent });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));

