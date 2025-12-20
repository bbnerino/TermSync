"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function UnifyUploadPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { currentWorkspace } = useWorkspaceStore();
  const {
    files,
    setFiles,
    setStep,
    setParsedDocuments,
    useDbTerms,
    setUseDbTerms,
    setLoading,
    setError,
  } = useUnifyStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dbTermCount, setDbTermCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch DB term count
    async function fetchDbTermCount() {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/terms`);
        if (response.ok) {
          const data = await response.json();
          setDbTermCount(data.terms?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch DB terms:", error);
      }
    }
    fetchDbTermCount();
  }, [workspaceId]);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  }

  function handleFiles(newFiles: File[]) {
    console.log("[TermSync] 파일 선택:", newFiles.length);

    // Filter for supported file types
    const supportedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validFiles = newFiles.filter((file) => {
      console.log(`[TermSync] 파일 확인: ${file.name} (${file.type})`);
      return supportedTypes.includes(file.type);
    });

    if (validFiles.length === 0) {
      alert(
        "지원되지 않는 파일 형식입니다. PDF 또는 DOCX 파일만 업로드 가능합니다."
      );
      return;
    }

    if (validFiles.length > 5) {
      alert("최대 5개의 파일만 업로드 가능합니다.");
      return;
    }

    console.log("[TermSync] 유효한 파일:", validFiles.length);
    setFiles(validFiles);
  }

  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  async function handleStartAnalysis() {
    console.log("[TermSync] 분석 시작 버튼 클릭, 파일 수:", files.length);

    if (files.length === 0) {
      console.log("[TermSync] 파일이 없어서 분석을 시작할 수 없습니다.");
      return;
    }

    // Store files in state and move to analyze page immediately
    setFiles(files);
    setStep("analyze");
    console.log("[TermSync] 분석 페이지로 즉시 이동");
    router.push(`/workspace/${workspaceId}/unify/analyze`);
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-green bg-surface-dark px-6 py-3 lg:px-10">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">terminal</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            TermSync {currentWorkspace && `• ${currentWorkspace.name}`}
          </h2>
        </div>
        <div className="flex items-center justify-end gap-6">
          <button
            onClick={() => router.push(`/workspace/${workspaceId}`)}
            className="flex items-center gap-2 text-text-dim hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 md:px-10 overflow-y-auto">
        <div className="flex flex-col max-w-[960px] w-full gap-8">
          {/* Breadcrumbs & Heading */}
          <div className="flex flex-col gap-4">
            <nav className="flex flex-wrap gap-2 items-center text-sm">
              <button
                onClick={() => router.push("/workspace")}
                className="text-text-dim hover:text-primary transition-colors font-medium"
              >
                홈
              </button>
              <span className="text-text-dim/50 font-medium">/</span>
              <button
                onClick={() => router.push(`/workspace/${workspaceId}`)}
                className="text-text-dim hover:text-primary transition-colors font-medium"
              >
                {currentWorkspace?.name || "워크스페이스"}
              </button>
              <span className="text-text-dim/50 font-medium">/</span>
              <span className="text-white font-medium">문서 업로드</span>
            </nav>
            <div className="flex flex-col gap-2">
              <h1 className="text-white text-3xl md:text-4xl font-black leading-tight tracking-tight">
                문서 업로드
              </h1>
              <p className="text-text-dim text-base md:text-lg">
                용어 분석을 위해 기술 문서를 업로드해주세요.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center p-8 md:p-16 rounded-xl border-2 border-dashed ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border-green-light hover:border-primary hover:bg-primary/5"
            } transition-all cursor-pointer`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-6 max-w-[480px]">
              <div
                className={`size-20 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isDragging
                    ? "bg-primary text-background-dark"
                    : "bg-border-green text-text-dim group-hover:bg-primary group-hover:text-background-dark"
                }`}
              >
                <span className="material-symbols-outlined text-4xl">
                  cloud_upload
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-white text-xl font-bold">
                  여기에 파일을 드래그하거나 클릭하세요
                </p>
                <p className="text-text-dim text-sm">
                  지원 형식: DOCX, PDF (최대 5개)
                </p>
              </div>
              <button
                type="button"
                className="mt-2 flex items-center justify-center h-12 px-8 rounded-full bg-primary text-background-dark text-base font-bold shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                파일 선택
              </button>
            </div>
          </div>

          {/* Selected Files List */}
          {files.length > 0 && (
            <>
              <div className="h-px bg-border-green" />

              <div className="flex flex-col gap-3">
                <h3 className="text-white text-lg font-bold">
                  업로드된 파일 ({files.length})
                </h3>
                <div className="flex flex-col gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border border-border-green bg-surface-highlight"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">
                          description
                        </span>
                        <div>
                          <p className="text-white font-medium">{file.name}</p>
                          <p className="text-text-dim text-sm">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        className="text-text-dim hover:text-red-400 transition-colors"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border-green" />

              {/* DB Settings */}
              <div className="flex flex-col gap-4">
                <h3 className="text-white text-lg font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    settings
                  </span>
                  DB 용어 활용 설정
                </h3>

                <div className="rounded-xl border border-border-green bg-surface-dark p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-2xl">
                        database
                      </span>
                      <span className="text-white font-bold">
                        기존 용어 DB 활용하기
                      </span>
                    </div>
                    <button
                      onClick={() => setUseDbTerms(!useDbTerms)}
                      className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                        useDbTerms ? "bg-primary" : "bg-border-green"
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                          useDbTerms ? "translate-x-9" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 pl-11">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-text-dim text-[18px]">
                        storage
                      </span>
                      <span className="text-text-dim">
                        현재 저장된 용어:{" "}
                        <span className="text-white font-bold">
                          {dbTermCount}개
                        </span>
                        {dbTermCount === 0 && (
                          <span className="text-yellow-400 ml-1">
                            (새 워크스페이스)
                          </span>
                        )}
                      </span>
                    </div>

                    {dbTermCount === 0 ? (
                      <div className="rounded-lg bg-yellow-900/10 border border-yellow-900/30 p-4">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-yellow-400 text-[20px]">
                            info
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg bg-primary/10 border border-primary/30 p-4">
                        <div className="flex items-start gap-2">
                          <span className="material-symbols-outlined text-primary text-[20px]">
                            check_circle
                          </span>
                          <div className="flex-1">
                            <p className="text-primary text-sm font-medium mb-2">
                              {useDbTerms ? "ON으로 설정하면:" : ""}
                            </p>
                            <ul className="text-text-dim text-xs space-y-1 leading-relaxed">
                              <li>
                                • DB에 있는 용어는 자동으로 매칭 (신뢰도 100%)
                              </li>
                              <li>• 새로운 용어만 AI가 분석</li>
                              <li>• 분석 시간 단축 (예상: 30초 → 5초)</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tips & Actions */}
          <div className="flex flex-col gap-8">
            {/* Tip Card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl border border-border-green bg-surface-dark shadow-sm">
              <div className="flex items-start gap-4">
                <div className="shrink-0 p-2 rounded-lg bg-yellow-900/30 text-yellow-400">
                  <span className="material-symbols-outlined">lightbulb</span>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-white text-base font-bold">
                    정확도 향상 팁
                  </p>
                  <p className="text-text-dim text-sm leading-normal">
                    기존 용어집(Glossary) 파일이 있다면 함께 업로드하여 분석
                    정확도를 높일 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border-green">
              <button
                onClick={() => router.push(`/workspace/${workspaceId}`)}
                className="flex items-center gap-2 h-12 px-6 rounded-full border border-border-green-light text-white hover:bg-border-green transition-colors font-medium"
              >
                <span className="material-symbols-outlined text-lg">
                  arrow_back
                </span>
                <span>이전</span>
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={files.length === 0}
                className={`flex items-center gap-2 h-12 px-8 rounded-full font-bold transition-all ${
                  files.length > 0
                    ? "bg-primary text-background-dark hover:bg-[#52ff9a] hover:scale-105 cursor-pointer"
                    : "bg-border-green text-text-dim/50 cursor-not-allowed"
                }`}
              >
                <span>분석 시작</span>
                <span className="material-symbols-outlined text-lg">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
