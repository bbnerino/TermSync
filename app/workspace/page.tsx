"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { getWorkspaces, createWorkspace } from "@/api/workspace.api";
import { Workspace } from "@/types";

const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || "7408016797648121856";

export default function WorkspacePage() {
  const router = useRouter();
  const {
    workspaces,
    isLoading,
    setWorkspaces,
    setLoading,
    setCurrentWorkspace,
  } = useWorkspaceStore();

  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  async function loadWorkspaces() {
    setLoading(true);
    try {
      // agentId가 있으면 쿼리 파라미터에 포함
      const params: { agentId?: string } = {};
      if (AGENT_ID) {
        params.agentId = AGENT_ID;
      }

      const response = await getWorkspaces(params);
      // API 응답 형식: { status, data: { data: [...], pageInfo: {...} } }
      const workspacesData = response.data?.data || [];
      // API 응답을 types의 Workspace 형식으로 변환
      const convertedWorkspaces: Workspace[] = workspacesData.map((w: any) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        createdAt: w.createdAt || new Date().toISOString(),
        updatedAt: w.updatedAt || new Date().toISOString(),
        termCount: w.termCount || 0,
        documentCount: w.documentCount || 0,
      }));
      setWorkspaces(convertedWorkspaces);
    } catch (error) {
      console.error("Failed to load workspaces:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceName.trim()) return;

    if (!AGENT_ID) {
      alert("Agent ID가 설정되지 않았습니다. 환경 변수를 확인해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const apiWorkspace = await createWorkspace({
        agentId: AGENT_ID,
        name: workspaceName.trim(),
      });

      // API 응답을 types의 Workspace 형식으로 변환
      const newWorkspace: Workspace = {
        id: apiWorkspace.id,
        name: apiWorkspace.name,
        description: apiWorkspace.description,
        createdAt: apiWorkspace.createdAt || new Date().toISOString(),
        updatedAt: apiWorkspace.updatedAt || new Date().toISOString(),
        termCount: apiWorkspace.termCount || 0,
        documentCount: apiWorkspace.documentCount || 0,
      };

      await loadWorkspaces();
      setShowModal(false);
      setWorkspaceName("");

      setCurrentWorkspace(newWorkspace);
      router.push(`/workspace/${newWorkspace.id}`);
    } catch (error: any) {
      console.error("Failed to create workspace:", error);
      alert(error.message || "워크스페이스 생성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectWorkspace(workspace: Workspace) {
    setCurrentWorkspace(workspace);
    router.push(`/workspace/${workspace.id}`);
  }

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-green bg-surface-dark px-6 py-3 lg:px-10">
        <div className="flex items-center gap-4 text-white">
          <div className="flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-3xl">terminal</span>
          </div>
          <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            TermSync
          </h2>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-1 justify-center py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col w-full max-w-[1024px] gap-8">
            {/* Page Header & Toolbar */}
            <div className="flex flex-col gap-6 border-b border-border-green pb-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-col gap-2 max-w-2xl">
                  <h1 className="text-white text-3xl sm:text-4xl font-black leading-tight tracking-[-0.033em]">
                    워크스페이스 선택
                  </h1>
                  <p className="text-text-dim text-base font-normal leading-normal">
                    프로젝트 관리를 시작할 워크스페이스를 선택하거나 새로
                    만드세요.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:min-w-[280px]">
                    <input
                      className="w-full bg-surface-highlight border border-border-green-light text-white text-sm rounded-full focus:ring-2 focus:ring-primary focus:border-transparent block pl-10 pr-4 py-2.5 placeholder-text-dim/70 transition-all"
                      placeholder="워크스페이스 검색..."
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-text-dim text-[20px]">
                        search
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center rounded-full h-[42px] px-5 bg-border-green hover:bg-border-green-light text-white text-sm font-bold transition-all gap-2 whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      add
                    </span>
                    <span>새 워크스페이스</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Workspace List or Empty State */}
            {isLoading ? (
              <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] py-12">
                <div className="animate-pulse text-primary text-xl">
                  로딩 중...
                </div>
              </div>
            ) : filteredWorkspaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWorkspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => handleSelectWorkspace(workspace)}
                    className="group relative overflow-hidden rounded-xl border border-border-green bg-surface-highlight hover:bg-surface-dark hover:border-primary transition-all duration-300 cursor-pointer transform hover:scale-105"
                  >
                    <div className="p-6 flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white text-xl font-bold mb-2 line-clamp-1">
                            {workspace.name}
                          </h3>
                        </div>
                        <span className="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          arrow_forward
                        </span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center min-h-[400px] py-12">
                <div className="flex flex-col items-center gap-8 max-w-[480px] text-center animate-fade-in-up">
                  <div className="relative size-32 sm:size-40 flex items-center justify-center rounded-full bg-surface-highlight border border-border-green shadow-[0_0_40px_-10px_rgba(43,238,121,0.1)]">
                    <span className="material-symbols-outlined text-text-dim/50 text-6xl sm:text-7xl">
                      folder_off
                    </span>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-background-dark rounded-full p-2 border-4 border-background-dark">
                      <span className="material-symbols-outlined text-xl font-bold">
                        add
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <h3 className="text-white text-xl sm:text-2xl font-bold leading-tight">
                      워크스페이스가 없습니다
                    </h3>
                    <p className="text-text-dim text-sm sm:text-base font-normal leading-relaxed">
                      TermSync를 사용하여 기술 용어를 효율적으로 관리해보세요.
                      <br className="hidden sm:block" />
                      새로운 프로젝트를 위한 첫 번째 워크스페이스를
                      만들어보세요.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowModal(true)}
                    className="group flex items-center justify-center rounded-full h-12 px-8 bg-primary hover:bg-[#52ff9a] text-background-dark text-base font-bold leading-normal tracking-[0.015em] transition-all transform hover:scale-105 shadow-glow"
                  >
                    <span className="truncate">워크스페이스 만들기</span>
                    <span className="material-symbols-outlined ml-2 transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Workspace Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-surface-dark border border-border-green rounded-2xl p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white text-xl font-bold">새 워크스페이스</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setWorkspaceName("");
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form
              onSubmit={handleCreateWorkspace}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  이름 <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full bg-surface-highlight border border-border-green-light text-white text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent block px-4 py-2.5 placeholder-text-dim/70 transition-all"
                  placeholder="예: 카메라 매뉴얼"
                  required
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setWorkspaceName("");
                  }}
                  className="flex-1 h-10 rounded-full border border-border-green-light text-white hover:bg-surface-highlight transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !workspaceName.trim()}
                  className="flex-1 h-10 rounded-full bg-primary text-background-dark font-bold hover:bg-[#52ff9a] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "만드는 중..." : "만들기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
