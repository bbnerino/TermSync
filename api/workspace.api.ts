/**
 * Workspace API 클라이언트 사이드 함수
 * https://live-stargate.sionic.im/api/v2/buckets
 */

const STORM_API_KEY = process.env.NEXT_PUBLIC_STORM_API_KEY || "";
const STORM_API_BASE_URL = "https://live-stargate.sionic.im/api/v2";

export interface Workspace {
  id: string;
  name: string;
  agentId?: string;
  description?: string;
  documentCount?: number;
  termCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface WorkspaceListResponse {
  status: string;
  data: {
    data: Workspace[];
    pageInfo: {
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    };
  };
}

export interface CreateWorkspaceRequest {
  agentId: string;
  name: string;
}

/**
 * 워크스페이스 목록 조회
 * GET https://live-stargate.sionic.im/api/v2/buckets?agentId&page&size
 */
export async function getWorkspaces(params?: {
  agentId?: string;
  page?: number;
  size?: number;
}): Promise<WorkspaceListResponse> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  const queryParams = new URLSearchParams();
  if (params?.agentId) {
    queryParams.append("agentId", params.agentId);
  }
  if (params?.page !== undefined) {
    queryParams.append("page", params.page.toString());
  }
  if (params?.size !== undefined) {
    queryParams.append("size", params.size.toString());
  }

  const url = `${STORM_API_BASE_URL}/buckets${
    queryParams.toString() ? `?${queryParams.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "storm-api-key": STORM_API_KEY,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Workspace API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data;
}

/**
 * 워크스페이스 생성
 * POST https://live-stargate.sionic.im/api/v2/buckets
 */
export async function createWorkspace(
  request: CreateWorkspaceRequest
): Promise<Workspace> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  if (!request.agentId || !request.name) {
    throw new Error("agentId와 name은 필수입니다.");
  }

  const response = await fetch(`${STORM_API_BASE_URL}/buckets`, {
    method: "POST",
    headers: {
      "storm-api-key": STORM_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agentId: request.agentId,
      name: request.name,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Workspace API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data;
}
