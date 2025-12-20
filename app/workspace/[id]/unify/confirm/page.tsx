"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function UnifyConfirmPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    parsedDocuments, 
    termGroups, 
    stats, 
    saveToDb, 
    setSaveToDb,
    setStep,
    setLoading, 
    setError, 
    reset 
  } = useUnifyStore();
  
  const [isApplying, setIsApplying] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'byDocument' | 'byGroup'>('summary');

  const selectedGroups = termGroups.filter(g => g.selected);
  const excludedCount = termGroups.reduce((sum, g) => 
    sum + g.occurrences.filter(o => !o.selected).length, 0
  );

  async function handleGenerate() {
    // Navigate to applying page
    setStep('result');
    router.push(`/workspace/${workspaceId}/unify/applying`);
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-border-green bg-surface-dark px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary text-3xl">assignment_turned_in</span>
            <div>
              <h2 className="text-xl font-bold">최종 확인</h2>
              <p className="text-text-dim text-sm">변경 사항을 확인하고 문서를 생성하세요</p>
            </div>
          </div>
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => router.push('/workspace')}
              className="text-text-dim hover:text-primary transition-colors font-medium"
            >
              Home
            </button>
            <span className="text-text-dim font-medium material-symbols-outlined text-[16px]">chevron_right</span>
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="text-text-dim hover:text-primary transition-colors font-medium"
            >
              {currentWorkspace?.name || 'Project'}
            </button>
            <span className="text-text-dim font-medium material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-white font-medium">Final Confirm</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border-green">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'summary'
                  ? 'text-primary'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              요약
              {activeTab === 'summary' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('byDocument')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'byDocument'
                  ? 'text-primary'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              문서별 상세
              {activeTab === 'byDocument' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('byGroup')}
              className={`px-6 py-3 font-medium transition-all relative ${
                activeTab === 'byGroup'
                  ? 'text-primary'
                  : 'text-text-dim hover:text-white'
              }`}
            >
              그룹별 상세
              {activeTab === 'byGroup' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {/* Tab Content - Summary */}
          {activeTab === 'summary' && (
            <div className="flex flex-col gap-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border-green bg-surface-dark">
                  <span className="text-4xl font-black text-white mb-1">{stats.selectedGroups}</span>
                  <span className="text-text-dim text-sm">선택된 그룹</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border-green bg-surface-dark">
                  <span className="text-4xl font-black text-primary mb-1">{stats.totalChanges}</span>
                  <span className="text-text-dim text-sm">총 변경 건수</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border-green bg-surface-dark">
                  <span className="text-4xl font-black text-white mb-1">{parsedDocuments.length}</span>
                  <span className="text-text-dim text-sm">생성할 문서</span>
                </div>
                <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-border-green bg-surface-dark">
                  <span className="text-4xl font-black text-yellow-400 mb-1">{excludedCount}</span>
                  <span className="text-text-dim text-sm">제외 항목</span>
                </div>
              </div>

              <div className="h-px bg-border-green" />

              {/* Changes Summary */}
              <div>
                <h3 className="text-white text-lg font-bold mb-4">변경 요약:</h3>
                <div className="flex flex-col gap-2">
                  {selectedGroups.map((group, index) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-surface-dark border border-border-green"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-text-dim font-medium">{index + 1}.</span>
                        <span className="text-white font-medium">{group.name}</span>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-text-dim">{group.variants.join(', ')}</span>
                          <span className="material-symbols-outlined text-text-dim text-[16px]">arrow_forward</span>
                          <span className="text-primary font-bold">{group.standard}</span>
                        </div>
                      </div>
                      <span className="text-text-dim text-sm">({group.occurrences.filter(o => o.selected).length}건)</span>
                    </div>
                  ))}
                </div>
              </div>

              {excludedCount > 0 && (
                <>
                  <div className="h-px bg-border-green" />
                  <div className="rounded-lg bg-yellow-900/10 border border-yellow-900/30 p-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-400 text-[20px]">block</span>
                      <span className="text-yellow-400 font-bold">제외된 항목: {excludedCount}건</span>
                    </div>
                    <p className="text-text-dim text-sm mt-2 ml-7">
                      사용자 판단으로 선택 해제된 항목입니다
                    </p>
                  </div>
                </>
              )}

              <div className="h-px bg-border-green" />

              {/* Save Options */}
              <div>
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">settings</span>
                  저장 옵션:
                </h3>
                <div className="flex flex-col gap-4">
                  <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-dark border border-border-green cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveToDb}
                      onChange={(e) => setSaveToDb(e.target.checked)}
                      className="h-5 w-5 mt-0.5 rounded border-border-green border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">database</span>
                        <span className="text-white font-bold">통일된 문서를 Storm DB에 저장</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">추천</span>
                      </div>
                      <p className="text-text-dim text-sm pl-7">
                        └─ 다음부터 이 문서 스타일로 자동 생성 가능
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-dark border border-border-green cursor-pointer hover:border-primary/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveToDb}
                      onChange={(e) => setSaveToDb(e.target.checked)}
                      className="h-5 w-5 mt-0.5 rounded border-border-green border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary text-[20px]">book</span>
                        <span className="text-white font-bold">승인된 용어 매핑을 용어 DB에 저장</span>
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">추천</span>
                      </div>
                      <p className="text-text-dim text-sm pl-7">
                        └─ 다음 작업부터 {stats.selectedGroups}개 용어 자동 매칭 (빠른 처리)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warning */}
              <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-yellow-400 text-[24px]">warning</span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">주의</p>
                    <p className="text-xs text-text-dim leading-relaxed">
                      원본 파일은 안전하게 보관됩니다
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content - By Document */}
          {activeTab === 'byDocument' && (
            <div className="flex flex-col gap-4">
              {parsedDocuments.map((doc, index) => {
                const docChanges = termGroups
                  .filter(g => g.selected)
                  .flatMap(g => g.occurrences.filter(o => o.selected && o.docName === doc.name));
                
                return (
                  <div key={index} className="rounded-lg border border-border-green bg-surface-dark p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <span className="text-white font-bold">{doc.name}</span>
                      </div>
                      <span className="text-text-dim text-sm">({docChanges.length}건 변경)</span>
                    </div>
                    <div className="flex flex-col gap-2 pl-9">
                      {docChanges.slice(0, 5).map((occ, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-text-dim">라인 {occ.line}:</span>
                          <span className="text-red-400 mx-2">"{occ.before}"</span>
                          <span className="material-symbols-outlined text-text-dim text-[14px] align-middle">arrow_forward</span>
                          <span className="text-primary mx-2 font-bold">"{occ.after}"</span>
                        </div>
                      ))}
                      {docChanges.length > 5 && (
                        <span className="text-text-dim text-sm">... {docChanges.length - 5}개 더 보기</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Content - By Group */}
          {activeTab === 'byGroup' && (
            <div className="flex flex-col gap-4">
              {selectedGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-border-green bg-surface-dark p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-bold">{group.name}</span>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-text-dim">{group.variants.join(', ')}</span>
                        <span className="material-symbols-outlined text-text-dim text-[16px]">arrow_forward</span>
                        <span className="text-primary font-bold">{group.standard}</span>
                      </div>
                    </div>
                    <span className="text-text-dim text-sm">({group.occurrences.filter(o => o.selected).length}건)</span>
                  </div>
                  <div className="flex flex-col gap-2 pl-6">
                    {group.occurrences.filter(o => o.selected).slice(0, 5).map((occ, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        <span className="text-primary font-medium">{occ.docName}</span>
                        <span className="text-text-dim">라인 {occ.line}</span>
                      </div>
                    ))}
                    {group.occurrences.filter(o => o.selected).length > 5 && (
                      <span className="text-text-dim text-sm">
                        ... {group.occurrences.filter(o => o.selected).length - 5}개 더
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-4 pt-6 border-t border-border-green">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}/unify/review`)}
              disabled={isApplying}
              className="flex items-center gap-2 h-12 px-6 rounded-full border border-border-green text-white hover:bg-border-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>돌아가서 수정</span>
            </button>

            <button
              onClick={handleGenerate}
              disabled={isApplying}
              className="flex items-center gap-2 h-14 px-10 rounded-full bg-primary text-background-dark font-bold text-lg hover:bg-[#52ff9a] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>통일 문서 생성</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

