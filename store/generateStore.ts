import { create } from 'zustand';
import { Guide, UIElement, TermRecommendation, GenerateStep } from '@/types';

interface GenerateState {
  // Current step
  step: GenerateStep;
  
  // UI elements
  uiElements: UIElement[];
  
  // Generated guide
  guide: Guide | null;
  editedGuide: string;
  
  // Term recommendations
  recommendations: TermRecommendation[];
  acceptedRecommendations: Set<string>;
  
  // Loading states
  isUploading: boolean;
  isGenerating: boolean;
  isAnalyzing: boolean;
  
  // Error state
  error: string | null;
  
  // Actions
  setStep: (step: GenerateStep) => void;
  setUIElements: (elements: UIElement[]) => void;
  setGuide: (guide: Guide) => void;
  setEditedGuide: (content: string) => void;
  setRecommendations: (recommendations: TermRecommendation[]) => void;
  toggleRecommendation: (original: string) => void;
  acceptAllRecommendations: () => void;
  rejectAllRecommendations: () => void;
  setLoading: (type: 'uploading' | 'generating' | 'analyzing', value: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: 'upload' as GenerateStep,
  uiElements: [],
  guide: null,
  editedGuide: '',
  recommendations: [],
  acceptedRecommendations: new Set<string>(),
  isUploading: false,
  isGenerating: false,
  isAnalyzing: false,
  error: null,
};

export const useGenerateStore = create<GenerateState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setUIElements: (elements) => set({ uiElements: elements }),

  setGuide: (guide) => set({ guide, editedGuide: guide.content }),

  setEditedGuide: (content) => set({ editedGuide: content }),

  setRecommendations: (recommendations) => {
    // Auto-accept high-confidence recommendations
    const accepted = new Set(
      recommendations
        .filter(r => r.confidence >= 0.9)
        .map(r => r.original)
    );
    set({ recommendations, acceptedRecommendations: accepted });
  },

  toggleRecommendation: (original) => {
    const { acceptedRecommendations } = get();
    const newAccepted = new Set(acceptedRecommendations);
    
    if (newAccepted.has(original)) {
      newAccepted.delete(original);
    } else {
      newAccepted.add(original);
    }

    set({ acceptedRecommendations: newAccepted });
  },

  acceptAllRecommendations: () => {
    const { recommendations } = get();
    const accepted = new Set(recommendations.map(r => r.original));
    set({ acceptedRecommendations: accepted });
  },

  rejectAllRecommendations: () => {
    set({ acceptedRecommendations: new Set() });
  },

  setLoading: (type, value) => {
    switch (type) {
      case 'uploading':
        set({ isUploading: value });
        break;
      case 'generating':
        set({ isGenerating: value });
        break;
      case 'analyzing':
        set({ isAnalyzing: value });
        break;
    }
  },

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));

