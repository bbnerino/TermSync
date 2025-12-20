const STORM_API_KEY = process.env.NEXT_PUBLIC_STORM_API_KEY || "";
const STORM_API_BASE_URL = "https://live-stargate.sionic.im/api/v2";

export interface ChatRequest {
  workspaceId: string;
  question: string;
}

export interface ChatContext {
  id: string;
  type: string;
  bucketName?: string;
  fileName?: string;
  pageName?: string;
  context?: string;
  referenceIdx?: number;
}

export interface ChatResponse {
  status: string;
  data: {
    chat: {
      id: string;
      threadId: string;
      question: string;
      answer: string;
      createdAt: string;
      updatedAt: string;
      status: string;
    };
    contexts?: ChatContext[];
  };
}

export async function sendChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  if (!request.workspaceId || !request.question) {
    throw new Error("workspaceId와 question은 필수입니다.");
  }

  const response = await fetch(`${STORM_API_BASE_URL}/answer`, {
    method: "POST",
    headers: {
      "storm-api-key": STORM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question: request.question,
      bucketIds: [request.workspaceId],
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error || error.message || "챗봇 응답에 실패했습니다."
    );
  }

  const data = await response.json();

  // 응답 형식 변환
  return {
    status: data.status,
    data: {
      chat: data.data?.chat || {
        id: "",
        threadId: "",
        question: request.question,
        answer: data.answer || data.data?.answer || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: data.status || "success",
      },
      contexts: data.data?.contexts || [],
    },
  };
}
