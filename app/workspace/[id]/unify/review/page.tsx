"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function UnifyReviewPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    termGroups, 
    stats,
    toggleGroupSelection, 
    selectAllGroups, 
    deselectAllGroups,
    toggleOccurrenceSelection,
    updateGroupStandard,
    setLoading,
    setError 
  } = useUnifyStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'confidence' | 'frequency'>('confidence');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  if (termGroups.length === 0) {
    router.push(`/workspace/${workspaceId}/unify`);
    return null;
  }

  // Filter and sort term groups
  const filteredGroups = termGroups
    .filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.standard.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.variants.some(v => v.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      } else {
        return b.occurrences.length - a.occurrences.length;
      }
    });

  async function handleContinue() {
    if (stats.selectedGroups === 0) {
      alert('최소 1개 이상의 용어 그룹을 선택해주세요.');
      return;
    }

    router.push(`/workspace/${workspaceId}/unify/confirm`);
  }

  function getConfidenceBadge(confidence: number) {
    if (confidence >= 0.9) {
      return {
        color: 'primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        textColor: 'text-primary',
        label: `${Math.round(confidence * 100)}% 신뢰도`,
        pulse: true,
      };
    } else if (confidence >= 0.7) {
      return {
        color: 'yellow',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20',
        textColor: 'text-yellow-500',
        label: `${Math.round(confidence * 100)}% 검토 필요`,
        pulse: false,
      };
    } else {
      return {
        color: 'red',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        textColor: 'text-red-500',
        label: `${Math.round(confidence * 100)}% 낮은 신뢰도`,
        pulse: false,
      };
    }
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-border-green bg-surface-dark px-6 py-3">
        <div className="flex items-center gap-3 text-white mb-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
            <span className="material-symbols-outlined text-2xl">terminal</span>
          </div>
          <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">
            TermSync {currentWorkspace && `• ${currentWorkspace.name}`}
          </h2>
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
          <span className="text-white font-medium">Term Review</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-4">
          <h1 className="text-white tracking-tight text-[28px] font-bold leading-tight">용어 그룹 검토</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}/unify`)}
              className="flex h-10 items-center justify-center gap-x-2 rounded-full border border-border-green hover:bg-border-green px-4 transition-all"
            >
              <span className="material-symbols-outlined text-white text-[20px]">arrow_back</span>
              <span className="text-white text-sm font-medium">이전</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden w-full max-w-7xl mx-auto px-6 py-6 flex gap-8">
        {/* Left Column: Term List */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          {/* Filter & Search Bar */}
          <div className="flex flex-wrap gap-4 mb-6 shrink-0">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <label className="flex w-full items-center rounded-xl h-12 bg-surface-highlight border border-transparent focus-within:border-primary transition-colors">
                <div className="text-text-dim flex items-center justify-center pl-4 pr-2">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input
                  className="w-full bg-transparent border-none text-white focus:ring-0 placeholder:text-text-dim text-base h-full rounded-r-xl"
                  placeholder="용어 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </label>
            </div>

            {/* Sort Buttons */}
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setSortBy('confidence')}
                className={`flex h-10 shrink-0 items-center gap-x-2 rounded-full px-4 pr-3 transition-colors ${
                  sortBy === 'confidence'
                    ? 'bg-primary text-background-dark'
                    : 'bg-surface-highlight hover:bg-border-green text-white'
                }`}
              >
                <span className="text-sm font-medium">신뢰도순</span>
              </button>
              <button
                onClick={() => setSortBy('frequency')}
                className={`flex h-10 shrink-0 items-center gap-x-2 rounded-full px-4 pr-3 transition-colors ${
                  sortBy === 'frequency'
                    ? 'bg-primary text-background-dark'
                    : 'bg-surface-highlight hover:bg-border-green text-white'
                }`}
              >
                <span className="text-sm font-medium">빈도순</span>
              </button>
            </div>
          </div>

          {/* List Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-surface-dark/50 rounded-t-2xl border-b border-border-green">
            <label className="flex gap-x-3 items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={stats.selectedGroups === stats.totalGroups && stats.totalGroups > 0}
                onChange={(e) => e.target.checked ? selectAllGroups() : deselectAllGroups()}
                className="h-5 w-5 rounded border-border-green border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 transition-all cursor-pointer"
              />
              <span className="text-white text-sm font-medium group-hover:text-primary transition-colors">
                전체 선택 ({stats.selectedGroups}/{stats.totalGroups})
              </span>
            </label>
            <span className="text-text-dim text-sm">{filteredGroups.length}개 그룹</span>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto pr-2 pb-24 space-y-3 pt-3">
            {filteredGroups.map((group) => {
              const badge = getConfidenceBadge(group.confidence);
              const isExpanded = expandedGroupId === group.id;
              const selectedOccurrences = group.occurrences.filter(o => o.selected).length;
              
              return (
                <div
                  key={group.id}
                  className={`flex flex-col rounded-2xl bg-surface-dark border transition-all shadow-lg relative overflow-hidden ${
                    group.selected
                      ? 'border-primary/50 shadow-primary/10'
                      : 'border-transparent hover:border-primary/30'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-primary transition-opacity ${
                    group.selected ? 'opacity-100' : 'opacity-0'
                  }`} />

                  {/* Group Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center gap-3 shrink-0 pt-1">
                        <input
                          type="checkbox"
                          checked={group.selected}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleGroupSelection(group.id);
                          }}
                          className="h-5 w-5 rounded border-border-green border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white font-bold text-base">{group.name}</span>
                              <span className="text-text-dim text-sm">({group.occurrences.length}건)</span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {group.variants.map((variant, i) => (
                                <span key={i} className="text-text-dim text-sm px-2 py-0.5 rounded bg-surface-highlight">
                                  {variant}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className={`flex items-center px-3 py-1 rounded-full ${badge.bgColor} border ${badge.borderColor}`}>
                              <span className={`w-2 h-2 rounded-full ${badge.textColor.replace('text-', 'bg-')} mr-2 ${badge.pulse ? 'animate-pulse' : ''}`} />
                              <span className={`${badge.textColor} text-xs font-bold`}>{Math.round(group.confidence * 100)}%</span>
                            </div>
                            {group.source === 'db' && (
                              <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                                DB
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}
                          className="flex items-center gap-2 text-primary hover:text-[#52ff9a] transition-colors text-sm font-medium"
                        >
                          <span>상세 보기</span>
                          <span className={`material-symbols-outlined text-[16px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            expand_more
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-border-green bg-surface-highlight/30 p-6">
                      <div className="space-y-6">
                        {/* AI Analysis */}
                        <div>
                          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">psychology</span>
                            AI 분석 결과
                          </h4>
                          <div className="bg-surface-dark rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2">
                              <span className="text-text-dim text-sm">신뢰도:</span>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span
                                    key={star}
                                    className={`material-symbols-outlined text-[18px] ${
                                      star <= Math.round(group.confidence * 5)
                                        ? 'text-yellow-400'
                                        : 'text-text-dim/30'
                                    }`}
                                    style={{ fontVariationSettings: '"FILL" 1' }}
                                  >
                                    star
                                  </span>
                                ))}
                              </div>
                              <span className="text-white font-bold text-sm ml-1">
                                {Math.round(group.confidence * 100)}%
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-text-dim text-sm shrink-0">판단 근거:</span>
                              <p className="text-white text-sm leading-relaxed">{group.reasoning}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-text-dim text-sm">카테고리:</span>
                              <span className="text-primary text-sm font-medium">{group.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Standard Term Selection */}
                        <div>
                          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                            표준 용어 선택
                          </h4>
                          <div className="space-y-2">
                            {[group.standard, ...group.variants].map((term, idx) => (
                              <label
                                key={idx}
                                className="flex items-center gap-3 p-3 rounded-lg bg-surface-dark hover:bg-border-green cursor-pointer transition-colors group"
                              >
                                <input
                                  type="radio"
                                  name={`standard-${group.id}`}
                                  checked={group.standard === term}
                                  onChange={() => updateGroupStandard(group.id, term)}
                                  className="h-4 w-4 border-border-green border-2 bg-transparent text-primary focus:ring-0 focus:ring-offset-0"
                                />
                                <span className={`flex-1 ${group.standard === term ? 'text-primary font-bold' : 'text-white'}`}>
                                  {term}
                                </span>
                                {idx === 0 && (
                                  <span className="text-primary text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10">
                                    AI 추천
                                  </span>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Occurrences */}
                        <div>
                          <h4 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">list</span>
                            문서별 발견 위치
                            <span className="text-text-dim font-normal text-xs">
                              ({selectedOccurrences}/{group.occurrences.length}개 선택)
                            </span>
                          </h4>
                          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {group.occurrences.map((occurrence) => (
                              <div
                                key={occurrence.id}
                                className={`p-4 rounded-lg border transition-all ${
                                  occurrence.selected
                                    ? 'bg-surface-dark border-primary/30'
                                    : 'bg-surface-dark/50 border-transparent'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={occurrence.selected}
                                    onChange={() => toggleOccurrenceSelection(group.id, occurrence.id)}
                                    className="h-4 w-4 mt-1 rounded border-border-green border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-primary text-sm font-medium">{occurrence.docName}</span>
                                      <span className="text-text-dim text-xs">라인 {occurrence.line}</span>
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="text-text-dim shrink-0">Before:</span>
                                        <span className="text-red-400 line-through">{occurrence.before}</span>
                                      </div>
                                      <div className="flex items-start gap-2 text-xs">
                                        <span className="text-text-dim shrink-0">After:</span>
                                        <span className="text-primary font-bold">{occurrence.after}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2 p-2 rounded bg-surface-highlight/50 text-text-dim text-xs leading-relaxed">
                                      {occurrence.context}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredGroups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="material-symbols-outlined text-text-dim text-5xl mb-4">search_off</span>
                <p className="text-white font-medium">검색 결과가 없습니다</p>
                <p className="text-text-dim text-sm mt-1">다른 검색어를 시도해보세요</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Stats & Actions */}
        <div className="w-80 shrink-0 flex flex-col gap-6">
          {/* Stats Card */}
          <div className="rounded-xl border border-border-green bg-surface-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">monitoring</span>
              분석 통계
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-sm">총 그룹 수</span>
                <span className="text-white font-bold text-lg">{stats.totalGroups}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-sm">선택된 그룹</span>
                <span className="text-primary font-bold text-lg">{stats.selectedGroups}</span>
              </div>
              <div className="h-px bg-border-green" />
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-sm">적용할 변경</span>
                <span className="text-white font-bold text-lg">{stats.totalChanges}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-sm">DB 매칭</span>
                <span className="text-blue-400 font-bold">{stats.dbMatches}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-dim text-sm">AI 분석</span>
                <span className="text-purple-400 font-bold">{stats.aiAnalyzed}</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContinue}
            disabled={stats.selectedGroups === 0}
            className={`flex items-center justify-center gap-2 h-14 rounded-full font-bold text-lg transition-all ${
              stats.selectedGroups > 0
                ? 'bg-primary text-background-dark hover:bg-[#52ff9a] hover:scale-105 cursor-pointer shadow-lg shadow-primary/20'
                : 'bg-border-green text-text-dim/50 cursor-not-allowed'
            }`}
          >
            <span>최종 확인</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          {/* Help Card */}
          <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-5">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-yellow-400 text-[24px]">info</span>
              <div>
                <p className="text-sm font-bold text-white mb-1">도움말</p>
                <p className="text-xs text-text-dim leading-relaxed">
                  용어 그룹을 선택하면 해당 용어들이 표준 용어로 일괄 변경됩니다.
                  신뢰도가 낮은 항목은 수동으로 검토해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

