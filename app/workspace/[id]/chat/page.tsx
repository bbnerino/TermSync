"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useChatStore } from "@/store/chatStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { messages, isLoading, addUserMessage, addAssistantMessage, setLoading } = useChatStore();
  
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    addUserMessage(userMessage);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          query: userMessage,
          type: 'document', // or 'statistics'
          conversationHistory: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('챗봇 응답에 실패했습니다.');
      }

      const data = await response.json();
      addAssistantMessage(data.answer, data.sources);
    } catch (error: any) {
      console.error('Chat error:', error);
      addAssistantMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Left Panel: Chat Thread */}
      <section className="flex flex-col w-[400px] border-r border-border-green bg-surface-dark relative z-10 shadow-xl">
        {/* Chat Header */}
        <div className="h-16 border-b border-border-green flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="text-text-dim hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h2 className="text-lg font-semibold text-white">TermBot Assistant</h2>
          </div>
          <button className="text-text-dim hover:text-white">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 scroll-smooth pb-20">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
              </div>
              <div>
                <p className="text-white font-medium mb-1">Welcome to TermBot!</p>
                <p className="text-text-dim text-sm">
                  Ask me anything about your documents and terms.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => setInput("셔터 스피드에 대해 알려줘")}
                  className="px-3 py-2 rounded-lg bg-surface-highlight border border-border-green text-sm text-white hover:bg-border-green transition-colors"
                >
                  용어 검색
                </button>
                <button
                  onClick={() => setInput("가장 많이 사용된 용어는?")}
                  className="px-3 py-2 rounded-lg bg-surface-highlight border border-border-green text-sm text-white hover:bg-border-green transition-colors"
                >
                  통계 분석
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                <span className="text-xs text-text-dim bg-surface-highlight px-3 py-1 rounded-full">오늘</span>
              </div>

              {messages.map((message, index) => (
                <div key={index}>
                  {message.role === 'user' ? (
                    /* User Message */
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-end gap-2 justify-end max-w-[90%]">
                        <div className="px-4 py-3 bg-primary rounded-2xl rounded-tr-sm text-background-dark text-sm leading-relaxed shadow-md">
                          {message.content}
                        </div>
                      </div>
                      <span className="text-text-dim text-[11px] pr-1">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    /* Bot Message */
                    <div className="flex flex-col items-start gap-1">
                      <div className="flex items-end gap-3 max-w-[90%]">
                        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 border border-border-green bg-primary/10 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                        </div>
                        <div className="flex flex-col gap-2 items-start">
                          <span className="text-text-dim text-[12px] pl-1">TermBot</span>
                          <div className="px-4 py-3 bg-surface-highlight rounded-2xl rounded-tl-sm text-white text-sm leading-relaxed shadow-md border border-border-green">
                            {message.content}
                            
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border-green">
                                <p className="text-xs text-text-dim mb-2">Sources:</p>
                                {message.sources.map((source, i) => (
                                  <div key={i} className="text-xs text-text-dim mb-1">
                                    • {source.docName}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-text-dim text-[11px] pl-12">
                        {new Date(message.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-end gap-3 max-w-[90%]">
                    <div className="bg-primary/10 rounded-full w-8 h-8 shrink-0 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                    </div>
                    <div className="px-4 py-3 bg-surface-highlight rounded-2xl text-white text-sm">
                      <span className="inline-flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>●</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-surface-dark border-t border-border-green shrink-0">
          <div className="relative flex items-center bg-surface-highlight rounded-xl border border-border-green focus-within:border-primary transition-colors">
            <input
              className="w-full bg-transparent text-white text-sm px-4 py-3 focus:outline-none placeholder-text-dim"
              placeholder="용어에 대해 질문하세요..."
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <div className="flex items-center pr-2 gap-1">
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 text-white bg-primary hover:bg-[#52ff9a] transition-colors rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Info/Stats */}
      <section className="flex-1 flex flex-col bg-background-dark overflow-hidden">
        {/* Header */}
        <header className="px-8 py-6 border-b border-border-green bg-surface-dark">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded text-xs font-medium flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">info</span>
              {currentWorkspace?.name || 'Workspace'}
            </span>
          </div>
          <h2 className="text-white text-2xl font-bold tracking-tight">Document & Term Analysis</h2>
          <p className="text-text-dim text-sm mt-1">
            Ask questions about your documents or request statistical analysis.
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-green bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">analytics</span>
                </div>
                <div className="relative z-10">
                  <p className="text-text-dim text-sm mb-1">Total Documents</p>
                  <p className="text-white text-3xl font-bold">{currentWorkspace?.documentCount || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-green bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-blue-400">label</span>
                </div>
                <div className="relative z-10">
                  <p className="text-text-dim text-sm mb-1">Unified Terms</p>
                  <p className="text-white text-3xl font-bold">{currentWorkspace?.termCount || 0}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-green bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-purple-400">auto_awesome</span>
                </div>
                <div className="relative z-10">
                  <p className="text-text-dim text-sm mb-1">AI Analyzed</p>
                  <p className="text-white text-3xl font-bold">0</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-xl border border-border-green bg-surface-dark p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tips_and_updates</span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInput("가장 많이 사용된 용어 Top 10을 알려줘")}
                  className="p-4 rounded-lg bg-surface-highlight border border-border-green hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <span className="material-symbols-outlined text-primary mb-2">trending_up</span>
                  <p className="text-white text-sm font-medium">Top Terms</p>
                </button>
                <button
                  onClick={() => setInput("문서별 용어 사용 현황을 보여줘")}
                  className="p-4 rounded-lg bg-surface-highlight border border-border-green hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <span className="material-symbols-outlined text-purple-400 mb-2">description</span>
                  <p className="text-white text-sm font-medium">Document Stats</p>
                </button>
                <button
                  onClick={() => setInput("DB 매칭된 용어는 몇 개야?")}
                  className="p-4 rounded-lg bg-surface-highlight border border-border-green hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <span className="material-symbols-outlined text-blue-400 mb-2">database</span>
                  <p className="text-white text-sm font-medium">DB Matches</p>
                </button>
                <button
                  onClick={() => setInput("최근 추가된 용어를 알려줘")}
                  className="p-4 rounded-lg bg-surface-highlight border border-border-green hover:border-primary hover:bg-primary/5 transition-all text-left"
                >
                  <span className="material-symbols-outlined text-yellow-400 mb-2">schedule</span>
                  <p className="text-white text-sm font-medium">Recent Terms</p>
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-yellow-900/30 bg-yellow-900/10 p-6">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-yellow-400 text-[24px]">lightbulb</span>
                <div>
                  <p className="text-sm font-bold text-white mb-2">TermBot Can Help You:</p>
                  <ul className="text-xs text-text-dim leading-relaxed space-y-1">
                    <li>• Search for specific terms in your documents</li>
                    <li>• Analyze term usage statistics and patterns</li>
                    <li>• Compare different term variants</li>
                    <li>• Export data for further analysis</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

