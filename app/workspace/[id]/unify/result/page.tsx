"use client";

import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function UnifyResultPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    parsedDocuments, 
    termGroups, 
    stats, 
    saveToDb,
    reset 
  } = useUnifyStore();
  
  const selectedGroups = termGroups.filter(g => g.selected);
  const excludedCount = termGroups.reduce((sum, g) => 
    sum + g.occurrences.filter(o => !o.selected).length, 0
  );
  
  function handleDownload(docName: string) {
    // TODO: Implement download
    alert(`다운로드: ${docName}_unified.docx`);
  }
  
  function handleDownloadAll() {
    // TODO: Implement ZIP download
    alert(`전체 ZIP 다운로드`);
  }
  
  function handleNewWork() {
    reset();
    router.push(`/workspace/${workspaceId}`);
  }
  
  function handleHome() {
    reset();
    router.push('/workspace');
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-border-green bg-surface-dark px-6 py-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-white">
            <span className="material-symbols-outlined text-primary text-4xl">celebration</span>
            <div>
              <h2 className="text-2xl font-black">🎉 용어 통일 완료!</h2>
              <p className="text-text-dim text-sm">문서가 성공적으로 생성되었습니다</p>
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
            <span className="text-white font-medium">Complete</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-primary/50 bg-surface-dark shadow-lg shadow-primary/10">
              <span className="text-5xl font-black text-primary mb-2">{stats.selectedGroups}</span>
              <span className="text-text-dim text-sm text-center">적용 그룹</span>
            </div>
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-primary/50 bg-surface-dark shadow-lg shadow-primary/10">
              <span className="text-5xl font-black text-primary mb-2">{stats.totalChanges}</span>
              <span className="text-text-dim text-sm text-center">변경 용어</span>
            </div>
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-primary/50 bg-surface-dark shadow-lg shadow-primary/10">
              <span className="text-5xl font-black text-primary mb-2">{parsedDocuments.length}</span>
              <span className="text-text-dim text-sm text-center">생성 문서</span>
            </div>
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border border-primary/50 bg-surface-dark shadow-lg shadow-primary/10">
              <span className="text-5xl font-black text-yellow-400 mb-2">{excludedCount}</span>
              <span className="text-text-dim text-sm text-center">제외 항목</span>
            </div>
          </div>

          <div className="h-px bg-border-green" />

          {/* Download Section */}
          <div>
            <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">download</span>
              다운로드:
            </h3>
            <div className="flex flex-col gap-3">
              {parsedDocuments.map((doc, index) => {
                const docChanges = selectedGroups.flatMap(g => 
                  g.occurrences.filter(o => o.selected && o.docName === doc.name)
                ).length;
                
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-5 rounded-xl border border-border-green bg-surface-dark hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary text-3xl">description</span>
                      <div>
                        <p className="text-white font-bold">{doc.name.replace(/\.[^/.]+$/, '')}_unified.docx</p>
                        <p className="text-text-dim text-sm">{docChanges}건 변경 (용어 통일 완료)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.name)}
                      className="flex items-center gap-2 h-10 px-6 rounded-full bg-primary text-background-dark font-bold hover:bg-[#52ff9a] hover:scale-105 transition-all"
                    >
                      <span className="material-symbols-outlined text-lg">download</span>
                      <span>다운로드</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* ZIP Download */}
            <button
              onClick={handleDownloadAll}
              className="w-full mt-4 flex items-center justify-center gap-3 h-14 rounded-xl bg-gradient-to-r from-primary to-[#52ff9a] text-background-dark font-bold text-lg hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-2xl">folder_zip</span>
              <span>전체 ZIP 다운로드</span>
              <span className="text-sm font-normal opacity-80">(원본 + 통일본 + 변경 리포트)</span>
            </button>
          </div>

          <div className="h-px bg-border-green" />

          {/* Save Complete */}
          {saveToDb && (
            <>
              <div className="rounded-xl border border-primary/50 bg-surface-dark p-6">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">check_circle</span>
                  저장 완료:
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">database</span>
                    <span className="text-white">문서 {parsedDocuments.length}개가 Storm DB에 저장되었습니다</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="material-symbols-outlined text-primary">book</span>
                    <span className="text-white">
                      용어 매핑 {stats.selectedGroups}개가 "{currentWorkspace?.name}" DB에 저장되었습니다
                    </span>
                  </div>
                  <div className="ml-8 text-text-dim text-sm">
                    (다음 작업부터 자동 매칭으로 빠른 처리!)
                  </div>
                </div>
              </div>

              {/* Next Work Benefits */}
              <div className="rounded-xl border border-border-green bg-surface-dark p-6">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">trending_up</span>
                  다음 작업 시:
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-1">bolt</span>
                    <div>
                      <p className="text-white font-medium mb-1">DB 활용 ON</p>
                      <p className="text-text-dim text-sm">
                        {stats.selectedGroups}개 용어 즉시 매칭 (신뢰도 100%)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-1">schedule</span>
                    <div>
                      <p className="text-white font-medium mb-1">예상 분석 시간</p>
                      <p className="text-text-dim text-sm">
                        30초 → 5초 <span className="text-primary font-bold">(83% 단축!)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-border-green" />
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => alert('변경 리포트 기능 준비 중입니다')}
              className="flex items-center gap-2 h-12 px-6 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-background-dark transition-all font-medium"
            >
              <span className="material-symbols-outlined">assessment</span>
              <span>변경 리포트 보기</span>
            </button>
            
            <button
              onClick={handleNewWork}
              className="flex items-center gap-2 h-12 px-6 rounded-full bg-primary text-background-dark font-bold hover:bg-[#52ff9a] hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined">refresh</span>
              <span>새 작업 시작</span>
            </button>
            
            <button
              onClick={handleHome}
              className="flex items-center gap-2 h-12 px-6 rounded-full border border-border-green text-white hover:bg-border-green transition-colors font-medium"
            >
              <span className="material-symbols-outlined">home</span>
              <span>홈으로</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

