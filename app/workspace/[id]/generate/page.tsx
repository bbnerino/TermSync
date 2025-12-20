"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { sendChatMessage } from "@/api/chat.api";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: any[];
};

export default function GeneratePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;

  const { currentWorkspace } = useWorkspaceStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatMode, setChatMode] = useState<"chat" | "write" | "edit">("chat");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    // 모드에 따라 프롬프트 접두사 추가
    let promptPrefix = "";
    if (chatMode === "write") {
      promptPrefix = "문서작성, ";
    } else if (chatMode === "edit") {
      promptPrefix = "문서수정 ";
    }

    const finalQuestion = promptPrefix + input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage({
        workspaceId,
        question: finalQuestion,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.data?.chat?.answer || "응답을 받지 못했습니다.",
        timestamp: new Date(),
        sources: response.data?.contexts || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error.message || "죄송합니다. 오류가 발생했습니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {/* Top Navigation */}
      <header className="border-b border-surface-border bg-surface-dark px-4 py-3 md:px-10">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="flex items-center gap-2 text-text-dim hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                arrow_back
              </span>
              <span className="text-sm font-medium">
                {currentWorkspace?.name || "워크스페이스"}
              </span>
            </button>
            <span className="material-symbols-outlined text-text-dim text-sm">
              chevron_right
            </span>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span className="material-symbols-outlined text-2xl">chat</span>
              </div>
              <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">
                문서 DB 챗봇
              </h2>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-10">
          <div className="mx-auto max-w-4xl">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-5xl">
                    chat
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  문서 DB 챗봇
                </h3>
                <p className="text-text-dim text-base max-w-md">
                  워크스페이스의 문서와 용어에 대해 질문해보세요.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl p-4 ${
                        msg.role === "user"
                          ? "bg-primary/20 text-white"
                          : "bg-surface-dark border border-surface-border text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-semibold">
                          {msg.role === "user" ? "👤 사용자" : "🤖 AI"}
                        </span>
                        <span className="text-xs text-text-dim">
                          {msg.timestamp.toLocaleTimeString("ko-KR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-dark border border-surface-border rounded-xl p-4">
                      <div className="flex items-center gap-2 text-sm text-text-dim">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <span>답변 생성 중...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-surface-border bg-surface-dark px-4 py-4 md:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-3">
              {/* Mode Select */}
              <div className="flex justify-end">
                <select
                  value={chatMode}
                  onChange={(e) =>
                    setChatMode(e.target.value as "chat" | "write" | "edit")
                  }
                  className="bg-surface-highlight border border-surface-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  <option value="chat">채팅 모드</option>
                  <option value="write">문서 작성 모드</option>
                  <option value="edit">문서 수정 모드</option>
                </select>
              </div>
              {/* Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="문서나 용어에 대해 질문해보세요..."
                  disabled={isLoading}
                  className="flex-1 bg-surface-highlight border border-surface-border rounded-full px-6 py-3 text-sm text-white placeholder-text-dim/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="px-6 py-3 bg-primary rounded-full text-background-dark font-bold hover:bg-[#52ff9a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    send
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
