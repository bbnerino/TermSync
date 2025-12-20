"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import { useWorkspaceStore } from "@/store/workspaceStore";

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  searchResults?: any[];
  statistics?: any;
};

export default function ChatSidebar() {
  const { currentWorkspace } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId: currentWorkspace?.id,
          query: input,
        }),
      });

      if (!response.ok) {
        throw new Error('챗봇 응답에 실패했습니다.');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.answer || data.response || '응답을 받지 못했습니다.',
        timestamp: new Date(),
        searchResults: data.sources || data.searchResults,
        statistics: data.statistics,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/50 border-l border-border-green/30">
      {/* Header */}
      <div className="p-4 border-b border-border-green/30 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
          <h3 className="text-white font-semibold">문서 DB 챗봇</h3>
        </div>

        {/* DB Status */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">📚 DB 상태</span>
            <button className="text-xs text-primary hover:underline">상세 보기</button>
          </div>
          
          <div className="text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-slate-400">description</span>
              <span>문서: {currentWorkspace?.documentCount || 0}개</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-[16px] text-slate-400">book</span>
              <span>용어: {currentWorkspace?.termCount || 0}개</span>
            </div>
          </div>

          <div className="text-xs text-slate-500">
            🕐 마지막 업데이트: {currentWorkspace?.lastUpdated ? new Date(currentWorkspace.lastUpdated).toLocaleDateString('ko-KR') : '-'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-8">
            <p>대화를 시작하세요!</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-primary/20 text-white' 
                  : 'bg-slate-800/50 text-slate-200'
              }`}>
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.role === 'user' ? '👤' : '🤖'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {msg.timestamp.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                
                {/* Search Results */}
                {msg.searchResults && msg.searchResults.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                    {msg.searchResults.map((result, idx) => (
                      <div key={idx} className="bg-slate-900/50 rounded p-2 text-xs">
                        <div className="font-medium text-slate-300 mb-1">
                          📄 {result.document}
                        </div>
                        <div className="text-slate-400 line-clamp-2">
                          {result.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                <span>검색 중...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border-green/30 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="질문 입력..."
            disabled={isLoading}
            className="flex-1 bg-slate-800/50 border border-border-green/30 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary rounded-lg text-white text-sm font-medium hover:bg-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
        
        <div className="flex gap-2 mt-2">
          <button className="flex-1 text-xs text-slate-400 hover:text-primary transition-colors py-1">
            🔍 검색
          </button>
          <button className="flex-1 text-xs text-slate-400 hover:text-primary transition-colors py-1">
            💡 제안
          </button>
        </div>
      </div>
    </div>
  );
}

