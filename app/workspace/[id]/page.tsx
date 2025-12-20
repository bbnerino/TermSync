"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function WorkspaceModePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  const { currentWorkspace, setCurrentWorkspace, setLoading } = useWorkspaceStore();

  useEffect(() => {
    if (!currentWorkspace || currentWorkspace.id !== workspaceId) {
      loadWorkspace();
    }
  }, [workspaceId]);

  async function loadWorkspace() {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}`);
      const data = await response.json();
      setCurrentWorkspace(data.workspace);
    } catch (error) {
      console.error("Failed to load workspace:", error);
      router.push("/workspace");
    } finally {
      setLoading(false);
    }
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
          <div className="flex items-center gap-3">
            <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 border border-border-green shadow-inner bg-gray-700" />
          </div>
          <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-surface-highlight hover:bg-border-green transition-colors text-white text-sm font-bold leading-normal tracking-[0.015em]">
            <span className="truncate">Log out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center py-10 px-4 md:px-8 overflow-y-auto">
        <div className="max-w-[1024px] w-full flex flex-col gap-10">
          {/* Page Heading */}
          <div className="flex flex-col gap-4 text-center md:text-left animate-fade-in-up">
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
              모드 선택
            </h1>
            <p className="text-text-dim text-lg font-normal leading-relaxed max-w-2xl">
              작업 목적에 맞는 모드를 선택하세요. 언제든지 설정을 변경하여 다른 모드로 전환할 수 있습니다.
            </p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Card 1: Unification Mode */}
            <div className="group relative flex flex-col gap-6 rounded-3xl border border-border-green bg-card-dark p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 hover:-translate-y-1">
              <div className="absolute top-6 right-6 p-3 rounded-2xl bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[32px]">folder_managed</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-white text-xl font-bold leading-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">library_books</span>
                  용어 통일 모드
                </h2>
                <div className="flex flex-col">
                  <span className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mt-2 mb-1">
                    기존 문서 관리
                  </span>
                  <span className="text-slate-400 text-sm font-medium">분석 및 표준화</span>
                </div>
              </div>
              <div className="h-px w-full bg-border-green"></div>
              <div className="flex flex-col gap-4 flex-1">
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">여러 기술 문서에 산재된 용어를 일치시킵니다.</span>
                </div>
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">오래된 레거시 문서를 최신 용어로 업데이트합니다.</span>
                </div>
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">문서 간 용어 일관성 검사를 수행합니다.</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/unify`)}
                className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-6 bg-border-green text-white text-base font-bold tracking-[0.015em] transition-all duration-300 hover:bg-primary hover:text-background-dark group-hover:shadow-lg group-hover:shadow-primary/20"
              >
                <span className="truncate">이 모드 선택하기</span>
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
            </div>

            {/* Card 2: Generation Mode */}
            <div className="group relative flex flex-col gap-6 rounded-3xl border border-border-green bg-card-dark p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/50 hover:-translate-y-1">
              <div className="absolute top-6 right-6 p-3 rounded-2xl bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[32px]">auto_awesome</span>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-white text-xl font-bold leading-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">psychology</span>
                  자동 문서/용어 생성 모드
                </h2>
                <div className="flex flex-col">
                  <span className="text-white text-3xl font-black leading-tight tracking-[-0.033em] mt-2 mb-1">
                    AI 기반 생성
                  </span>
                  <span className="text-slate-400 text-sm font-medium">창작 및 제안</span>
                </div>
              </div>
              <div className="h-px w-full bg-border-green"></div>
              <div className="flex flex-col gap-4 flex-1">
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">신규 프로젝트를 위한 용어집을 자동으로 구축합니다.</span>
                </div>
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">키워드만으로 문서 초안을 빠르게 작성합니다.</span>
                </div>
                <div className="text-sm text-slate-300 flex gap-3 items-start">
                  <span className="material-symbols-outlined text-primary shrink-0 text-[20px]">check_circle</span>
                  <span className="leading-snug">AI가 문맥에 맞는 최적의 용어 정의를 추천합니다.</span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/workspace/${workspaceId}/generate`)}
                className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-full h-14 px-6 bg-border-green text-white text-base font-bold tracking-[0.015em] transition-all duration-300 hover:bg-primary hover:text-background-dark group-hover:shadow-lg group-hover:shadow-primary/20"
              >
                <span className="truncate">이 모드 선택하기</span>
                <span className="material-symbols-outlined ml-2 text-[20px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Back Button */}
          <div className="flex justify-start w-full mt-4">
            <button
              onClick={() => router.push("/workspace")}
              className="group flex items-center justify-center gap-2 text-slate-400 hover:text-primary transition-colors px-4 py-2 rounded-full hover:bg-white/5"
            >
              <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
                arrow_back
              </span>
              <span className="text-sm font-medium">이전 단계로 돌아가기</span>
            </button>
          </div>
        </div>
      </div>

      {/* Decorative background elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

