"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGenerateStore } from "@/store/generateStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function GenerateResultPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    uiElements, 
    guide, 
    editedGuide,
    recommendations,
    setGuide, 
    setEditedGuide,
    setRecommendations,
    setLoading,
    toggleRecommendation,
    acceptedRecommendations,
  } = useGenerateStore();
  
  const [isGenerating, setIsGenerating] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (uiElements.length === 0) {
      router.push(`/workspace/${workspaceId}/generate`);
      return;
    }

    if (!guide) {
      generateGuide();
    } else {
      setIsGenerating(false);
    }
  }, []);

  async function generateGuide() {
    setIsGenerating(true);
    setLoading('generating', true);

    try {
      const response = await fetch('/api/generate/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          uiElements,
          style: {
            tone: '친근하고 전문적인',
            structure: '단계별 안내',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('가이드 생성에 실패했습니다.');
      }

      const data = await response.json();
      setGuide(data.guide);
      setRecommendations(data.recommendations || []);
    } catch (error: any) {
      console.error('Generation error:', error);
      alert(error.message);
    } finally {
      setIsGenerating(false);
      setLoading('generating', false);
    }
  }

  async function handleSave() {
    if (!guide) return;

    setIsSaving(true);
    try {
      // Mock: Save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('가이드가 저장되었습니다!');
      router.push(`/workspace/${workspaceId}`);
    } catch (error: any) {
      console.error('Save error:', error);
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleDownload() {
    if (!guide) return;

    const content = isEditing ? editedGuide : guide.content;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${guide.title || 'guide'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (isGenerating || !guide) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <header className="px-10 py-6 border-b border-border-green bg-surface-dark">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary text-3xl animate-spin">sync</span>
            <div>
              <h2 className="text-xl font-bold">AI Guide Generation in Progress</h2>
              <p className="text-text-dim text-sm">Analyzing UI elements and generating documentation...</p>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="size-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl animate-pulse">auto_awesome</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Creating Your Guide</h3>
              <p className="text-text-dim">
                Our AI is analyzing the UI elements and generating comprehensive documentation...
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-dim">
              <span className="material-symbols-outlined text-[18px]">hourglass_empty</span>
              <span>This usually takes 10-30 seconds</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Header */}
      <header className="px-10 py-4 border-b border-border-green bg-surface-dark flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-3xl">article</span>
          <div>
            <h2 className="text-xl font-bold text-white">{guide.title}</h2>
            <p className="text-text-dim text-sm">
              {guide.appliedTerms.length} terms • {guide.style.matchRate * 100}% match rate
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 h-10 px-4 rounded-full border transition-colors ${
              isEditing
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border-green text-white hover:bg-border-green'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isEditing ? 'visibility' : 'edit'}
            </span>
            <span className="text-sm font-medium">{isEditing ? 'Preview' : 'Edit'}</span>
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 h-10 px-4 rounded-full border border-border-green text-white hover:bg-border-green transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span className="text-sm font-medium">Download</span>
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 h-10 px-6 rounded-full bg-primary text-background-dark font-bold hover:bg-[#52ff9a] transition-all disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Finish'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left: Content/Editor */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-4xl mx-auto">
            {isEditing ? (
              <textarea
                value={editedGuide}
                onChange={(e) => setEditedGuide(e.target.value)}
                className="w-full min-h-[600px] bg-surface-dark border border-border-green rounded-xl p-6 text-white font-mono text-sm focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Edit your guide here..."
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <div 
                  className="text-white leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: guide.content.replace(/\n/g, '<br/>') }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Recommendations */}
        {recommendations.length > 0 && (
          <div className="w-96 border-l border-border-green overflow-y-auto bg-surface-dark/50">
            <div className="p-6 border-b border-border-green sticky top-0 bg-surface-dark">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">stars</span>
                Term Recommendations
              </h3>
              <p className="text-text-dim text-sm mt-1">
                {acceptedRecommendations.size} of {recommendations.length} accepted
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    acceptedRecommendations.has(rec.original)
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border-green bg-surface-dark'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-text-dim line-through text-sm">{rec.original}</span>
                        <span className="material-symbols-outlined text-text-dim text-[14px]">arrow_right_alt</span>
                        <span className="text-white font-bold">{rec.recommended}</span>
                      </div>
                      <p className="text-xs text-text-dim">{rec.reasoning}</p>
                    </div>
                    
                    <button
                      onClick={() => toggleRecommendation(rec.original)}
                      className={`shrink-0 ml-2 ${
                        acceptedRecommendations.has(rec.original)
                          ? 'text-primary'
                          : 'text-text-dim hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {acceptedRecommendations.has(rec.original) ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      rec.source === 'db' ? 'bg-blue-500/10 text-blue-400' :
                      rec.source === 'iso' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-green-500/10 text-green-400'
                    }`}>
                      {rec.source.toUpperCase()}
                    </span>
                    <span className="text-xs text-text-dim">
                      {Math.round(rec.confidence * 100)}% confidence
                    </span>
                  </div>

                  {rec.alternatives && rec.alternatives.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border-green/30">
                      <p className="text-xs text-text-dim mb-2">Alternatives:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.alternatives.map((alt, i) => (
                          <span key={i} className="px-2 py-1 rounded bg-surface-highlight text-white text-xs">
                            {alt.term}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

