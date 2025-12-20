import { create } from 'zustand';
import { TermGroup, ParsedDocument, UnifyStep, UnifyStats } from '@/types';

interface UnifyState {
  // Current step
  step: UnifyStep;
  
  // Uploaded files
  files: File[];
  parsedDocuments: ParsedDocument[];
  
  // Analysis results
  termGroups: TermGroup[];
  
  // Selection state
  selectedGroups: Set<string>;
  
  // Statistics
  stats: UnifyStats;
  
  // DB options
  useDbTerms: boolean;
  saveToDb: boolean;
  
  // Loading states
  isUploading: boolean;
  isAnalyzing: boolean;
  isApplying: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setStep: (step: UnifyStep) => void;
  setFiles: (files: File[]) => void;
  setParsedDocuments: (docs: ParsedDocument[]) => void;
  setTermGroups: (groups: TermGroup[]) => void;
  toggleGroupSelection: (groupId: string) => void;
  toggleOccurrenceSelection: (groupId: string, occurrenceId: string) => void;
  updateGroupStandard: (groupId: string, newStandard: string) => void;
  selectAllGroups: () => void;
  deselectAllGroups: () => void;
  updateStats: () => void;
  setUseDbTerms: (value: boolean) => void;
  setSaveToDb: (value: boolean) => void;
  setLoading: (type: 'uploading' | 'analyzing' | 'applying', value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as UnifyStep,
  files: [],
  parsedDocuments: [],
  termGroups: [],
  selectedGroups: new Set<string>(),
  stats: {
    totalGroups: 0,
    selectedGroups: 0,
    totalChanges: 0,
    dbMatches: 0,
    aiAnalyzed: 0,
  },
  useDbTerms: false,
  saveToDb: true,
  isUploading: false,
  isAnalyzing: false,
  isApplying: false,
  error: null,
};

export const useUnifyStore = create<UnifyState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setFiles: (files) => set({ files }),

  setParsedDocuments: (docs) => set({ parsedDocuments: docs }),

  setTermGroups: (groups) => {
    const selectedGroups = new Set(groups.filter(g => g.selected).map(g => g.id));
    set({ termGroups: groups, selectedGroups });
    get().updateStats();
  },

  toggleGroupSelection: (groupId) => {
    const { termGroups, selectedGroups } = get();
    const newSelected = new Set(selectedGroups);
    
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }

    const updatedGroups = termGroups.map(g =>
      g.id === groupId ? { ...g, selected: newSelected.has(g.id) } : g
    );

    set({ termGroups: updatedGroups, selectedGroups: newSelected });
    get().updateStats();
  },

  toggleOccurrenceSelection: (groupId, occurrenceId) => {
    const { termGroups } = get();
    const updatedGroups = termGroups.map(group => {
      if (group.id === groupId) {
        const updatedOccurrences = group.occurrences.map(occ =>
          occ.id === occurrenceId ? { ...occ, selected: !occ.selected } : occ
        );
        return { ...group, occurrences: updatedOccurrences };
      }
      return group;
    });

    set({ termGroups: updatedGroups });
    get().updateStats();
  },

  updateGroupStandard: (groupId, newStandard) => {
    const { termGroups } = get();
    const updatedGroups = termGroups.map(group => {
      if (group.id === groupId) {
        // Update standard term and all occurrences' after text
        const updatedOccurrences = group.occurrences.map(occ => ({
          ...occ,
          after: newStandard,
        }));
        return { ...group, standard: newStandard, occurrences: updatedOccurrences };
      }
      return group;
    });

    set({ termGroups: updatedGroups });
  },

  selectAllGroups: () => {
    const { termGroups } = get();
    const allIds = new Set(termGroups.map(g => g.id));
    const updatedGroups = termGroups.map(g => ({ ...g, selected: true }));
    
    set({ termGroups: updatedGroups, selectedGroups: allIds });
    get().updateStats();
  },

  deselectAllGroups: () => {
    const { termGroups } = get();
    const updatedGroups = termGroups.map(g => ({ ...g, selected: false }));
    
    set({ termGroups: updatedGroups, selectedGroups: new Set() });
    get().updateStats();
  },

  updateStats: () => {
    const { termGroups, selectedGroups } = get();
    
    const stats: UnifyStats = {
      totalGroups: termGroups.length,
      selectedGroups: selectedGroups.size,
      totalChanges: 0,
      dbMatches: termGroups.filter(g => g.source === 'db').length,
      aiAnalyzed: termGroups.filter(g => g.source === 'ai').length,
    };

    // Count total changes from selected groups
    termGroups.forEach(group => {
      if (selectedGroups.has(group.id)) {
        stats.totalChanges += group.occurrences.filter(o => o.selected).length;
      }
    });

    set({ stats });
  },

  setUseDbTerms: (value) => set({ useDbTerms: value }),

  setSaveToDb: (value) => set({ saveToDb: value }),

  setLoading: (type, value) => {
    switch (type) {
      case 'uploading':
        set({ isUploading: value });
        break;
      case 'analyzing':
        set({ isAnalyzing: value });
        break;
      case 'applying':
        set({ isApplying: value });
        break;
    }
  },

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

