"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUnifyStore } from "@/store/unifyStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { parseMultipleFiles } from "@/api/file-parse.api";

type AnalysisStep =
  | "parsing"
  | "extracting"
  | "grouping"
  | "matching"
  | "completed";

export default function UnifyAnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { currentWorkspace } = useWorkspaceStore();
  const { files, setParsedDocuments, setTermGroups, setStep, setLoading } =
    useUnifyStore();

  const [currentStep, setCurrentStep] = useState<AnalysisStep>("parsing");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      router.push(`/workspace/${workspaceId}/unify`);
      return;
    }

    startAnalysis();
  }, []);

  async function startAnalysis() {
    try {
      // Step 1: Parsing documents
      setCurrentStep("parsing");
      setProgress(10);
      setLoading("uploading", true);

      // Parse files using STORM API (프론트엔드에서 직접 호출)
      const results = await parseMultipleFiles(files);

      // Filter out failed results
      const successful = results.filter((r) => !r.error);
      const failed = results.filter((r) => r.error);

      if (successful.length === 0) {
        throw new Error(
          failed.length > 0
            ? failed.map((f) => f.error).join(", ")
            : "파일 파싱에 실패했습니다."
        );
      }

      const parseData = {
        documents: successful.map((r) => ({
          name: r.filename,
          content: r.text,
          size: r.filesize,
          pageCount: r.pages,
          wordCount: r.text.split(/\s+/).length,
        })),
      };

      if (!parseData.documents || parseData.documents.length === 0) {
        throw new Error("파싱된 문서가 없습니다.");
      }

      setParsedDocuments(parseData.documents);
      setLoading("uploading", false);
      setProgress(40);

      // Step 2: Extracting terms (AI 분석 시작 전 단계 표시)
      setCurrentStep("extracting");
      setProgress(50);

      // Step 3: Grouping terms (AI 분석 중 단계 표시)
      setCurrentStep("grouping");
      setProgress(60);

      // Step 4: Matching with DB and AI analysis
      setCurrentStep("matching");
      setProgress(70);
      setLoading("analyzing", true);

      const response = await fetch("/api/unify/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          documents: parseData.documents,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "용어 분석에 실패했습니다.");
      }

      const data = await response.json();

      if (!data.termGroups || !Array.isArray(data.termGroups)) {
        throw new Error("분석 결과 형식이 올바르지 않습니다.");
      }

      setTermGroups(data.termGroups);
      setLoading("analyzing", false);

      // Step 5: Completed
      setCurrentStep("completed");
      setProgress(100);

      // Navigate to review page after a brief moment to show completion
      setTimeout(() => {
        setStep("review");
        router.push(`/workspace/${workspaceId}/unify/review`);
      }, 500);
    } catch (error: any) {
      console.error("Analysis error:", error);
      setError(error.message || "분석 중 오류가 발생했습니다.");
      setLoading("analyzing", false);
      setLoading("uploading", false);
    }
  }

  function handleCancel() {
    if (confirm("분석을 취소하시겠습니까?")) {
      router.push(`/workspace/${workspaceId}/unify`);
    }
  }

  const steps = [
    {
      key: "parsing",
      label: "문서 파싱",
      description: "문서 구조와 내용을 분석하고 있습니다.",
      icon: "sync",
    },
    {
      key: "extracting",
      label: "용어 추출",
      description: "문서에서 주요 용어를 식별하고 있습니다.",
      icon: "manage_search",
    },
    {
      key: "grouping",
      label: "용어 그룹화",
      description: "유사한 용어들을 그룹화하고 있습니다.",
      icon: "workspaces",
    },
    {
      key: "matching",
      label: "DB 매칭 및 AI 분석",
      description: "기존 DB와 매칭하고 AI로 표준화하고 있습니다.",
      icon: "psychology",
    },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-surface-border bg-surface-dark px-4 py-3 md:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <span className="material-symbols-outlined text-2xl">
                terminal
              </span>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">
              TermSync {currentWorkspace && `• ${currentWorkspace.name}`}
            </h2>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 md:px-10 overflow-y-auto">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-6">
          {/* Page Heading */}
          <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl border border-surface-border bg-surface-dark p-6 md:p-8 shadow-lg shadow-black/20">
            <div className="flex flex-col gap-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                  {error
                    ? "실패"
                    : currentStep === "completed"
                    ? "완료"
                    : "처리 중"}
                </span>
                <span className="text-xs text-text-dim">
                  {files.length}개 문서
                </span>
              </div>
              <h1 className="text-3xl font-black leading-tight tracking-[-0.033em] text-white md:text-4xl">
                {error
                  ? "분석 실패"
                  : currentStep === "completed"
                  ? "분석 완료!"
                  : "AI 분석 진행 중"}
              </h1>
              <p className="text-text-dim text-base md:text-lg">
                {error ||
                  (currentStep === "completed"
                    ? "문서에서 용어를 성공적으로 식별하고 그룹화했습니다."
                    : "TermSync가 문서를 분석하여 용어를 식별하고 표준화하고 있습니다.")}
              </p>
            </div>
            {!error && currentStep !== "completed" && (
              <button
                onClick={handleCancel}
                className="flex h-10 items-center justify-center gap-2 rounded-full border border-surface-border bg-[#1a2e23] px-6 text-sm font-bold text-white transition hover:bg-[#253f31] hover:text-red-400"
              >
                <span className="material-symbols-outlined text-[18px]">
                  cancel
                </span>
                <span>분석 취소</span>
              </button>
            )}
            {error && (
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/unify`)}
                className="flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-background-dark transition hover:bg-[#52ff9a]"
              >
                <span>다시 시도</span>
              </button>
            )}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Status & Timeline */}
            <div className="flex flex-col gap-6 lg:col-span-7">
              {/* Progress Card */}
              <div className="flex flex-col gap-4 rounded-xl border border-surface-border bg-surface-dark p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">
                        data_usage
                      </span>
                    </div>
                    <div>
                      <p className="text-base font-medium text-white">
                        전체 진행률
                      </p>
                      <p className="text-sm text-text-dim">
                        {error
                          ? "분석 실패"
                          : steps[currentStepIndex]?.label || "처리 중..."}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      error ? "text-red-400" : "text-primary"
                    }`}
                  >
                    {error ? "오류" : `${progress}%`}
                  </p>
                </div>
                <div className="relative h-3 w-full overflow-hidden rounded-full bg-[#1a2e23]">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out ${
                      error
                        ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        : "bg-primary shadow-[0_0_10px_rgba(43,238,121,0.5)]"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Timeline Stepper */}
              <div className="flex-1 rounded-xl border border-surface-border bg-surface-dark p-6 shadow-md">
                <h3 className="mb-6 text-lg font-bold text-white">분석 단계</h3>
                <div className="grid grid-cols-[32px_1fr] gap-x-4">
                  {steps.map((step, index) => {
                    const isActive = currentStepIndex === index;
                    const isCompleted = currentStepIndex > index;
                    const isPending = currentStepIndex < index;

                    return (
                      <div key={step.key} className="contents">
                        {/* Icon */}
                        <div className="flex flex-col items-center">
                          <div
                            className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                              isCompleted
                                ? "bg-primary text-background-dark shadow-[0_0_10px_rgba(43,238,121,0.3)]"
                                : isActive
                                ? "bg-primary text-background-dark shadow-[0_0_15px_rgba(43,238,121,0.4)]"
                                : "border-2 border-surface-border bg-surface-dark text-surface-border"
                            }`}
                          >
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                isActive ? "animate-spin" : ""
                              }`}
                            >
                              {isCompleted ? "check" : step.icon}
                            </span>
                          </div>
                          {index < steps.length - 1 && (
                            <div
                              className={`h-full w-[2px] my-2 ${
                                isCompleted
                                  ? "bg-primary"
                                  : isActive
                                  ? "bg-gradient-to-b from-primary to-surface-border"
                                  : "bg-surface-border opacity-50"
                              }`}
                            />
                          )}
                        </div>

                        {/* Content */}
                        <div
                          className={`pb-8 pt-1 ${
                            isPending ? "opacity-60" : ""
                          }`}
                        >
                          <p className="text-base font-bold text-white">
                            {step.label}
                          </p>
                          <p
                            className={`text-sm mt-1 font-medium ${
                              isActive
                                ? "text-primary"
                                : isCompleted
                                ? "text-green-400"
                                : "text-text-dim"
                            }`}
                          >
                            {isCompleted
                              ? "완료"
                              : isActive
                              ? "처리 중..."
                              : "대기 중"}
                          </p>
                          <p className="text-xs text-text-dim mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Document Info */}
            <div className="flex flex-col gap-6 lg:col-span-5">
              {/* Documents Card */}
              <div className="rounded-xl border border-surface-border bg-surface-dark p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-primary">
                    description
                  </span>
                  <h3 className="text-lg font-bold text-white">
                    분석 중인 문서
                  </h3>
                </div>
                <div className="flex flex-col gap-3">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg bg-[#1a2e23] border border-surface-border"
                    >
                      <span className="material-symbols-outlined text-text-dim text-[20px]">
                        article
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-text-dim mt-1">
                          <span>{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip Card */}
              <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-5">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-yellow-400 text-[24px]">
                    lightbulb
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">
                      분석 시간
                    </p>
                    <p className="text-xs text-text-dim leading-relaxed">
                      문서 크기와 복잡도에 따라 1-3분 정도 소요됩니다. 분석이
                      완료되면 자동으로 검토 화면으로 이동합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
