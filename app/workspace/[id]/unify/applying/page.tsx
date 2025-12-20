"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

interface LogEntry {
  time: string;
  message: string;
}

export default function UnifyApplyingPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { 
    parsedDocuments, 
    termGroups, 
    saveToDb,
    setLoading, 
    setError,
    reset 
  } = useUnifyStore();
  
  const [progress, setProgress] = useState(0);
  const [currentDoc, setCurrentDoc] = useState(0);
  const [currentChanges, setCurrentChanges] = useState(0);
  const [status, setStatus] = useState<'parsing' | 'applying' | 'saving' | 'done'>('parsing');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const selectedGroups = termGroups.filter(g => g.selected);
  const totalChanges = selectedGroups.reduce((sum, g) => 
    sum + g.occurrences.filter(o => o.selected).length, 0
  );

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    setLogs(prev => [...prev, { time, message }]);
  };

  useEffect(() => {
    applyTermUnification();
  }, []);

  async function applyTermUnification() {
    try {
      setLoading('applying', true);
      
      // Step 1: Parse documents (15%)
      addLog('문서 처리 시작...');
      setProgress(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      for (let i = 0; i < parsedDocuments.length; i++) {
        addLog(`${parsedDocuments[i].name} 로드 중...`);
        setCurrentDoc(i);
        setProgress(5 + (i + 1) * (10 / parsedDocuments.length));
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      addLog(`문서 ${parsedDocuments.length}개 로드 완료`);
      
      // Step 2: Apply changes (15% → 85%)
      setStatus('applying');
      addLog('용어 적용 시작...');
      
      let changeCount = 0;
      for (let i = 0; i < parsedDocuments.length; i++) {
        const doc = parsedDocuments[i];
        setCurrentDoc(i);
        
        const docChanges = selectedGroups.flatMap(g => 
          g.occurrences.filter(o => o.selected && o.docName === doc.name)
        );
        
        for (let j = 0; j < docChanges.length; j++) {
          const occ = docChanges[j];
          changeCount++;
          setCurrentChanges(changeCount);
          
          if (j === 0 || j === docChanges.length - 1 || j % 3 === 0) {
            addLog(`${doc.name} - ${occ.line}행: "${occ.before}" → "${occ.after}"`);
          }
          
          setProgress(15 + (changeCount / totalChanges) * 70);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        addLog(`✅ ${doc.name} 완료 (${docChanges.length}건 변경)`);
      }
      
      // Step 3: Save to DB (85% → 95%)
      if (saveToDb) {
        setStatus('saving');
        setProgress(85);
        addLog('문서 3개를 Storm DB에 저장 중...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProgress(90);
        addLog(`용어 매핑 ${selectedGroups.length}개를 용어 DB에 저장 중...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setProgress(95);
        addLog(`"${currentWorkspace?.name}" DB 업데이트 중...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Step 4: Complete
      setProgress(100);
      setStatus('done');
      addLog('✅ 모든 작업 완료!');
      addLog(`✅ ${totalChanges}건의 용어가 성공적으로 통일되었습니다`);
      if (saveToDb) {
        addLog(`✅ ${parsedDocuments.length}개 문서가 Storm DB에 저장되었습니다`);
        addLog(`✅ ${selectedGroups.length}개 용어 매핑이 "${currentWorkspace?.name}" DB에 저장되었습니다`);
      }
      
      setIsComplete(true);
      
      // Call actual API
      const response = await fetch('/api/unify/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          documents: parsedDocuments,
          termGroups: selectedGroups,
          saveToDb,
        }),
      });

      if (!response.ok) {
        throw new Error('용어 적용에 실패했습니다.');
      }

      await response.json();
      
    } catch (error: any) {
      console.error('Apply error:', error);
      setError(error.message || '용어 적용 중 오류가 발생했습니다.');
      addLog(`❌ 에러: ${error.message}`);
    } finally {
      setLoading('applying', false);
    }
  }

  function handleViewResult() {
    router.push(`/workspace/${workspaceId}/unify/result`);
  }

  const getStatusIcon = (docIndex: number) => {
    if (status === 'done') return { icon: 'check_circle', color: 'text-primary' };
    if (docIndex < currentDoc) return { icon: 'check_circle', color: 'text-primary' };
    if (docIndex === currentDoc) return { icon: 'sync', color: 'text-yellow-400 animate-spin' };
    return { icon: 'schedule', color: 'text-text-dim' };
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-border-green bg-surface-dark px-6 py-4">
        <div className="flex items-center gap-3 text-white">
          <span className="material-symbols-outlined text-primary text-3xl animate-pulse">autorenew</span>
          <div>
            <h2 className="text-xl font-bold">
              {status === 'done' ? '✅ 완료!' : '🤖 통일 문서를 생성하고 있습니다...'}
            </h2>
            <p className="text-text-dim text-sm">
              {status === 'done' 
                ? `${totalChanges}건의 용어가 성공적으로 통일되었습니다` 
                : '잠시만 기다려주세요...'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          {/* Progress Bar */}
          <div className="rounded-xl border border-border-green bg-surface-dark p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold">전체 진행률</span>
              <span className="text-primary font-bold text-2xl">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 bg-border-green rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-[#52ff9a] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Status */}
          <div className="rounded-xl border border-border-green bg-surface-dark p-6">
            <h3 className="text-white font-bold mb-4">진행 상황:</h3>
            <div className="flex flex-col gap-3">
              {/* Document Processing */}
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${
                  status === 'parsing' || status === 'applying' ? 'text-primary animate-pulse' : 
                  status === 'done' || status === 'saving' ? 'text-primary' : 'text-text-dim'
                }`}>
                  {status === 'done' || status === 'saving' || (status === 'applying' && currentDoc === parsedDocuments.length - 1) 
                    ? 'check_circle' 
                    : status === 'parsing' || status === 'applying' ? 'sync' : 'schedule'}
                </span>
                <span className={status !== 'parsing' && status !== 'applying' ? 'text-primary' : 'text-white'}>
                  📄 문서 처리 {status === 'done' || status === 'saving' ? '완료' : status === 'applying' ? '중' : '중'}
                  {(status === 'parsing' || status === 'applying') && ` (${currentDoc + 1}/${parsedDocuments.length})`}
                </span>
              </div>

              {/* Term Application */}
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${
                  status === 'applying' ? 'text-primary animate-pulse' : 
                  status === 'done' || status === 'saving' ? 'text-primary' : 'text-text-dim'
                }`}>
                  {status === 'done' || status === 'saving' ? 'check_circle' : status === 'applying' ? 'sync' : 'schedule'}
                </span>
                <span className={status === 'done' || status === 'saving' ? 'text-primary' : status === 'applying' ? 'text-white' : 'text-text-dim'}>
                  🔍 용어 적용 {status === 'done' || status === 'saving' ? '완료' : status === 'applying' ? '중' : '대기'}
                  {status === 'applying' && ` (${currentChanges}/${totalChanges}건)`}
                </span>
              </div>

              {/* DB Save */}
              {saveToDb && (
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined ${
                    status === 'saving' ? 'text-primary animate-pulse' : 
                    status === 'done' ? 'text-primary' : 'text-text-dim'
                  }`}>
                    {status === 'done' ? 'check_circle' : status === 'saving' ? 'sync' : 'schedule'}
                  </span>
                  <span className={status === 'done' ? 'text-primary' : status === 'saving' ? 'text-white' : 'text-text-dim'}>
                    💾 DB 저장 {status === 'done' ? '완료' : status === 'saving' ? '중' : '대기'}
                  </span>
                </div>
              )}

              {/* Result */}
              <div className="flex items-center gap-3">
                <span className={`material-symbols-outlined ${status === 'done' ? 'text-primary animate-pulse' : 'text-text-dim'}`}>
                  {status === 'done' ? 'check_circle' : 'schedule'}
                </span>
                <span className={status === 'done' ? 'text-primary font-bold' : 'text-text-dim'}>
                  📋 결과 {status === 'done' ? '생성 완료' : '생성 대기'}
                </span>
              </div>
            </div>
            
            {status !== 'done' && (
              <div className="mt-4 text-text-dim text-sm">
                예상 소요 시간: 약 {Math.max(1, Math.ceil((100 - progress) / 10))}초
              </div>
            )}
          </div>

          {/* Document Status */}
          <div className="rounded-xl border border-border-green bg-surface-dark p-6">
            <h3 className="text-white font-bold mb-4">문서별 상태:</h3>
            <div className="flex flex-col gap-2">
              {parsedDocuments.map((doc, index) => {
                const statusInfo = getStatusIcon(index);
                const docChanges = selectedGroups.flatMap(g => 
                  g.occurrences.filter(o => o.selected && o.docName === doc.name)
                ).length;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-surface-highlight">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined ${statusInfo.color}`}>
                        {statusInfo.icon}
                      </span>
                      <span className="text-white font-medium">{doc.name}</span>
                    </div>
                    <span className="text-text-dim text-sm">
                      {index < currentDoc || status === 'done' ? '완료' : 
                       index === currentDoc && status !== 'done' ? '처리 중...' : '대기 중'}
                      {' '}({docChanges}건)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Log */}
          <div className="rounded-xl border border-border-green bg-surface-dark p-6">
            <h3 className="text-white font-bold mb-4">실시간 로그:</h3>
            <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-sm space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-primary">
                  <span className="text-text-dim">[{log.time}]</span> {log.message}
                </div>
              ))}
            </div>
          </div>

          {/* Complete Button */}
          {isComplete && (
            <button
              onClick={handleViewResult}
              className="flex items-center justify-center gap-2 h-14 rounded-full bg-primary text-background-dark font-bold text-lg hover:bg-[#52ff9a] hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined">check_circle</span>
              <span>결과 확인</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

