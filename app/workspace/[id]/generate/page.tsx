"use client";

import { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useGenerateStore } from "@/store/generateStore";
import { useWorkspaceStore } from "@/store/workspaceStore";
import ChatSidebar from "@/components/ChatSidebar";

type Tab = 'guide' | 'recommend';

export default function GeneratePage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  
  const { currentWorkspace } = useWorkspaceStore();
  const { setStep, setUIElements, setLoading, setError } = useGenerateStore();
  
  const [activeTab, setActiveTab] = useState<Tab>('guide');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [options, setOptions] = useState({
    useDBStyle: true,
    useDBTerms: true,
    includeUsage: true,
    includeWarnings: true,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }

  function handleFiles(files: File[]) {
    // Limit to 5 files
    const limitedFiles = files.slice(0, 5 - selectedFiles.length);
    
    // Check file types and sizes
    const validFiles = limitedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name}은(는) 이미지 파일이 아닙니다.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name}의 크기가 너무 큽니다. (최대 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Add to selected files
    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setPreviews(prev => [...prev, e.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  }

  function removeFile(index: number) {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (selectedFiles.length === 0) {
      alert('이미지를 먼저 업로드해주세요.');
      return;
    }

    setIsUploading(true);
    setLoading('uploading', true);

    try {
      // Step 1: Extract UI elements from images using STORM Parse API (OCR)
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('workspaceId', workspaceId);

      // First, parse images to extract text
      const parseResponse = await fetch('/api/generate/parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error('이미지 파싱에 실패했습니다.');
      }

      const parseData = await parseResponse.json();
      const extractedText = parseData.extractedText || '';

      // Step 2: Generate UI guide using OpenAI
      const guideResponse = await fetch('/api/generate/guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          extractedText,
          options,
        }),
      });

      if (!guideResponse.ok) {
        throw new Error('가이드 생성에 실패했습니다.');
      }

      const guideData = await guideResponse.json();
      
      setUIElements(guideData.uiElements || []);
      setStep(2);

      // Navigate to result page
      router.push(`/workspace/${workspaceId}/generate/result`);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.message);
      alert(error.message);
    } finally {
      setIsUploading(false);
      setLoading('uploading', false);
    }
  }

  async function handleRecommend() {
    if (selectedFiles.length === 0) {
      alert('이미지를 먼저 업로드해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      // Step 1: Extract text from images using STORM Parse API
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const parseResponse = await fetch('/api/generate/parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        throw new Error('이미지 파싱에 실패했습니다.');
      }

      const parseData = await parseResponse.json();
      const extractedText = parseData.extractedText || '';

      // Step 2: Get term recommendations using OpenAI
      const recommendResponse = await fetch('/api/generate/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspaceId,
          extractedText,
        }),
      });

      if (!recommendResponse.ok) {
        throw new Error('용어 추천에 실패했습니다.');
      }

      const recommendData = await recommendResponse.json();
      
      // Show recommendations in an alert for now
      alert(`용어 추천 완료!\n발견된 용어: ${recommendData.recommendations?.length || 0}개`);
      
      // TODO: Navigate to recommendations result page
    } catch (error: any) {
      console.error('Recommend error:', error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-10 py-6 border-b border-border-green/30 flex items-center justify-between shrink-0 bg-background-dark/80 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="flex items-center gap-2 text-text-dim hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              <span className="text-sm font-medium">{currentWorkspace?.name || '워크스페이스'}</span>
            </button>
            <span className="material-symbols-outlined text-text-dim text-sm">chevron_right</span>
            <span className="text-white text-sm font-medium">🤖 자동 생성 모드</span>
          </div>
          <button
            onClick={() => {}}
            className="text-text-dim hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="px-10 py-4 border-b border-border-green/30 shrink-0 bg-background-dark/50">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'guide'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-slate-800/30 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">description</span>
                <span>📝 UI 가이드 작성</span>
              </span>
            </button>
            <button
              onClick={() => setActiveTab('recommend')}
              className={`px-6 py-3 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'recommend'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-slate-800/30 text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">lightbulb</span>
                <span>💡 용어 추천</span>
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-10">
          <div className="max-w-4xl">
            {/* Tab Content */}
            {activeTab === 'guide' && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">📝 UI 가이드 자동 작성</h2>
                  <p className="text-slate-400">
                    UI 캡처를 업로드하면 DB 문서 스타일로 가이드를 자동 생성합니다.
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : 'border-border-green/50 bg-slate-800/20 hover:border-primary/50 hover:bg-slate-800/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[40px]">
                        photo_camera
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">
                        📸 UI 캡처 이미지 업로드
                      </p>
                      <p className="text-slate-400 text-sm">
                        파일을 드래그하거나 클릭하여 업로드
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-6 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium text-sm hover:bg-primary/30 transition-colors"
                    >
                      파일 선택
                    </button>
                    <p className="text-xs text-slate-500">
                      지원: PNG, JPG, PDF • 최대: 5개 이미지
                    </p>
                  </div>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold">
                      업로드된 이미지 ({selectedFiles.length}/5):
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="bg-slate-800/30 rounded-lg p-3 border border-border-green/30">
                          {previews[index] && (
                            <img 
                              src={previews[index]} 
                              alt={file.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Options */}
                {selectedFiles.length > 0 && (
                  <div className="bg-slate-800/20 border border-border-green/30 rounded-lg p-6 space-y-4">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">settings</span>
                      ⚙️ 가이드 옵션
                    </h3>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.useDBStyle}
                          onChange={(e) => setOptions({...options, useDBStyle: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-border-green/30 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            DB 문서 스타일 적용 ({currentWorkspace?.name || '워크스페이스'} 스타일)
                          </div>
                          <div className="text-sm text-slate-400">
                            저장된 문서의 문체와 구조를 자동으로 적용합니다
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.useDBTerms}
                          onChange={(e) => setOptions({...options, useDBTerms: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-border-green/30 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">
                            DB 용어 자동 적용 ({currentWorkspace?.termCount || 0}개 용어)
                          </div>
                          <div className="text-sm text-slate-400">
                            저장된 표준 용어를 가이드에 자동으로 적용합니다
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.includeUsage}
                          onChange={(e) => setOptions({...options, includeUsage: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-border-green/30 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">사용 방법 자동 생성</div>
                          <div className="text-sm text-slate-400">
                            UI 요소별 사용 방법을 단계별로 작성합니다
                          </div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={options.includeWarnings}
                          onChange={(e) => setOptions({...options, includeWarnings: e.target.checked})}
                          className="mt-1 w-5 h-5 rounded border-border-green/30 bg-slate-800 text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-white font-medium">주의사항 섹션 포함</div>
                          <div className="text-sm text-slate-400">
                            사용 시 주의할 점을 자동으로 추가합니다
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="pt-4 border-t border-border-green/20">
                      <div className="text-sm text-slate-400 mb-2">📝 문서 형식:</div>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="markdown"
                            defaultChecked
                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"
                          />
                          <span className="text-white text-sm">Markdown</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="docx"
                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"
                          />
                          <span className="text-white text-sm">Word (DOCX)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            value="pdf"
                            className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0"
                          />
                          <span className="text-white text-sm">PDF</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-sm text-primary">
                    💡 <strong>빠른 시작:</strong>
                  </p>
                  <ul className="text-sm text-slate-300 mt-2 space-y-1 ml-6 list-disc">
                    <li>여러 화면을 올릴수록 상세한 가이드가 생성됩니다</li>
                    <li>UI 요소가 명확한 스크린샷을 권장합니다</li>
                    <li>OCR이 텍스트를 자동으로 인식합니다</li>
                  </ul>
                </div>

                {/* Action Buttons */}
                {selectedFiles.length > 0 && (
                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={() => {
                        setSelectedFiles([]);
                        setPreviews([]);
                      }}
                      className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                      ← 취소
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={isUploading}
                      className="px-8 py-3 bg-primary rounded-full text-white font-bold hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>생성 중...</span>
                        </>
                      ) : (
                        <>
                          <span>가이드 생성</span>
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recommend' && (
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">💡 UI 용어 추천</h2>
                  <p className="text-slate-400">
                    UI 캡처를 업로드하면 각 요소에 맞는 표준 용어를 추천해드립니다.
                  </p>
                </div>

                {/* Upload Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-primary/10'
                      : 'border-border-green/50 bg-slate-800/20 hover:border-primary/50 hover:bg-slate-800/40'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[40px]">
                        photo_camera
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">
                        📸 UI 캡처 이미지 업로드
                      </p>
                      <p className="text-slate-400 text-sm">
                        파일을 드래그하거나 클릭하여 업로드
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-6 py-2 bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium text-sm hover:bg-primary/30 transition-colors"
                    >
                      파일 선택
                    </button>
                    <p className="text-xs text-slate-500">
                      지원: PNG, JPG
                    </p>
                  </div>
                </div>

                {/* Examples */}
                <div className="bg-slate-800/20 border border-border-green/30 rounded-lg p-6">
                  <h3 className="text-white font-semibold mb-4">💡 예시:</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-primary">•</span>
                      <div className="text-slate-300">
                        <span className="font-medium">"로그인"</span> → <span className="text-primary">"Login"</span> 추천
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary">•</span>
                      <div className="text-slate-300">
                        <span className="font-medium">"아이디"</span> → <span className="text-primary">"Email"</span> 또는 <span className="text-primary">"User ID"</span> 추천
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary">•</span>
                      <div className="text-slate-300">
                        <span className="font-medium">"비밀번호"</span> → <span className="text-primary">"Password"</span> 추천
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedFiles.length > 0 && (
                  <div className="flex justify-between items-center pt-4">
                    <button
                      onClick={() => {
                        setSelectedFiles([]);
                        setPreviews([]);
                      }}
                      className="px-6 py-3 text-slate-400 hover:text-white transition-colors"
                    >
                      ← 취소
                    </button>
                    <button
                      onClick={handleRecommend}
                      disabled={isUploading}
                      className="px-8 py-3 bg-primary rounded-full text-white font-bold hover:bg-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>분석 중...</span>
                        </>
                      ) : (
                        <>
                          <span>용어 추천 받기</span>
                          <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-96 shrink-0 h-full">
        <ChatSidebar />
      </div>
    </div>
  );
}
