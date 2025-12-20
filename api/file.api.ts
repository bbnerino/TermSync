/**
 * 클라이언트 사이드 파일 업로드 API
 * 서버 사이드 API 라우트 없이 클라이언트에서 직접 처리
 */

export interface UploadFileResponse {
  name: string;
  savedName: string;
  size: number;
  type: string;
}

/**
 * Storm API 관련 인터페이스 및 함수
 */

const STORM_API_KEY = process.env.NEXT_PUBLIC_STORM_API_KEY || "";
const STORM_API_BASE_URL = "https://live-stargate.sionic.im/api/v2";
const BUCKET_ID = "7407360148281683969";

export interface StormUploadResponse {
  id?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

export interface ParsedDocument {
  name: string;
  content: string;
  size: number;
  pageCount?: number;
  wordCount?: number;
}

/**
 * Storm API 파일 업로드
 * https://sionic-storm-openapi.apidog.io/api-10588036
 */
export async function uploadFileToStorm(
  file: File
): Promise<StormUploadResponse> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  const formData = new FormData();
  formData.append("bucketId", BUCKET_ID);
  formData.append("file", file);

  console.log(`[STORM] Uploading file: ${file.name} (${file.type})`);

  const response = await fetch(`${STORM_API_BASE_URL}/documents/by-file`, {
    method: "POST",
    headers: {
      "storm-api-key": STORM_API_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `파일 업로드 실패: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("[STORM] Upload response:", data);
  return data;
}

// 파싱 관련 함수는 file-parse.api.ts로 이동
export { parseFile, parseMultipleFiles } from "./file-parse.api";

/**
 * 파일을 로컬 스토리지에 저장 (메타데이터만)
 * 실제 파일은 IndexedDB에 저장
 */
export async function uploadFileToLocal(
  file: File
): Promise<UploadFileResponse> {
  return new Promise((resolve, reject) => {
    try {
      const timestamp = Date.now();
      const originalName = file.name;
      const savedName = `${timestamp}-${originalName}`;

      // IndexedDB에 파일 저장
      const request = indexedDB.open("fileStorage", 1);

      request.onerror = () => {
        reject(new Error("IndexedDB를 열 수 없습니다."));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 파일을 ArrayBuffer로 변환
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          const transaction = db.transaction(["files"], "readwrite");
          const objectStore = transaction.objectStore("files");

          const fileData = {
            id: savedName,
            name: originalName,
            data: arrayBuffer,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
          };

          const addRequest = objectStore.add(fileData);

          addRequest.onsuccess = () => {
            resolve({
              name: originalName,
              savedName: savedName,
              size: file.size,
              type: file.type,
            });
          };

          addRequest.onerror = () => {
            reject(new Error("파일 저장에 실패했습니다."));
          };
        };

        reader.onerror = () => {
          reject(new Error("파일 읽기에 실패했습니다."));
        };

        reader.readAsArrayBuffer(file);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("files")) {
          db.createObjectStore("files", { keyPath: "id" });
        }
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * IndexedDB에서 파일 목록 조회
 */
export async function getFilesFromLocal(): Promise<
  Array<{
    name: string;
    savedName: string;
    size: number;
    type: string;
    uploadedAt: string;
  }>
> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fileStorage", 1);

    request.onerror = () => {
      reject(new Error("IndexedDB를 열 수 없습니다."));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("files")) {
        resolve([]);
        return;
      }

      const transaction = db.transaction(["files"], "readonly");
      const objectStore = transaction.objectStore("files");
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = () => {
        const files = getAllRequest.result.map((file: any) => ({
          name: file.name,
          savedName: file.id,
          size: file.size,
          type: file.type,
          uploadedAt: file.uploadedAt,
        }));

        // 업로드 시간 기준 내림차순 정렬
        files.sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );

        resolve(files);
      };

      getAllRequest.onerror = () => {
        reject(new Error("파일 목록을 불러올 수 없습니다."));
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };
  });
}

/**
 * IndexedDB에서 파일 삭제
 */
export async function deleteFileFromLocal(savedName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("fileStorage", 1);

    request.onerror = () => {
      reject(new Error("IndexedDB를 열 수 없습니다."));
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("files")) {
        resolve();
        return;
      }

      const transaction = db.transaction(["files"], "readwrite");
      const objectStore = transaction.objectStore("files");
      const deleteRequest = objectStore.delete(savedName);

      deleteRequest.onsuccess = () => {
        resolve();
      };

      deleteRequest.onerror = () => {
        reject(new Error("파일 삭제에 실패했습니다."));
      };
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "id" });
      }
    };
  });
}
