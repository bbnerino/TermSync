/**
 * Storm Parse API 클라이언트 사이드 파싱 함수
 * https://storm-apis.sionic.im/parse-router/api/v2/parse/by-file
 */

const STORM_API_KEY = process.env.NEXT_PUBLIC_PARSE_STORM_API_KEY || "";
const STORM_PARSE_API_BASE_URL =
  "https://storm-apis.sionic.im/parse-router/api/v2";

interface ParseJobResponse {
  jobId: string;
  state?: "REQUESTED" | "ACCEPTED" | "PROCESSED" | "COMPLETED" | "FAILED";
  message?: string;
}

interface ParseResultResponse {
  jobId: string;
  state: "REQUESTED" | "ACCEPTED" | "PROCESSED" | "COMPLETED" | "FAILED";
  pages?: Array<{
    content: string;
    pageNumber: number;
  }>;
  error?: string;
}

/**
 * 파싱 작업 상태 확인
 * https://storm-apis.sionic.im/parse-router/api/v2/parse/job/{jobId}
 */
async function getParseStatus(jobId: string): Promise<ParseResultResponse> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  const response = await fetch(
    `${STORM_PARSE_API_BASE_URL}/parse/job/${jobId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STORM_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("[STORM] Status check failed:", response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[STORM] Job status: ${data.state} (jobId: ${jobId})`);

  return data;
}

/**
 * 파싱 결과를 폴링하여 대기
 */
async function pollParseResult(
  jobId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<ParseResultResponse> {
  console.log(
    `[STORM] Starting poll for jobId: ${jobId}, max attempts: ${maxAttempts}`
  );

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getParseStatus(jobId);

    console.log(
      `[STORM] Poll attempt ${attempt + 1}/${maxAttempts}: ${result.state}`
    );

    if (result.state === "COMPLETED") {
      console.log(
        `[STORM] Parse completed! Pages: ${result.pages?.length || 0}`
      );
      return result;
    }

    if (result.state === "FAILED") {
      throw new Error(result.error || "Parse job failed");
    }

    // Still processing (REQUESTED, ACCEPTED, PROCESSED)
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error("Parse job timeout: exceeded maximum polling attempts");
}

/**
 * 파일 파싱 작업 시작
 * https://storm-apis.sionic.im/parse-router/api/v2/parse/by-file
 */
async function startParseJob(file: File): Promise<{ jobId: string }> {
  if (!STORM_API_KEY) {
    throw new Error("Storm API 키가 설정되지 않았습니다.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", "ko");
  formData.append("deleteOriginFile", "true");

  console.log(`[STORM] Starting parse for file: ${file.name}`);

  const response = await fetch(`${STORM_PARSE_API_BASE_URL}/parse/by-file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STORM_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[STORM] Parse start failed:", response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data: ParseJobResponse = await response.json();
  console.log("[STORM] Parse job started:", data);

  if (!data.jobId) {
    throw new Error("No jobId returned from STORM API");
  }

  if (data.state === "FAILED") {
    throw new Error(data.message || "Parse job failed");
  }

  return { jobId: data.jobId };
}

/**
 * 파일을 파싱하여 텍스트 추출 (폴링 포함)
 */
export async function parseFile(file: File): Promise<{
  text: string;
  pages?: number;
  filename: string;
  filesize: number;
}> {
  console.log(`[STORM] Starting parse for file: ${file.name}`);

  // Start parse job
  const { jobId } = await startParseJob(file);

  // Poll for result
  const result = await pollParseResult(jobId);

  if (!result.pages || result.pages.length === 0) {
    throw new Error("Parse result is empty - no pages returned");
  }

  // Extract content from all pages
  const text = result.pages.map((page) => page.content).join("\n");

  console.log(
    `[STORM] Parse complete: ${result.pages.length} pages, ${text.length} characters`
  );

  return {
    text,
    pages: result.pages.length,
    filename: file.name,
    filesize: file.size,
  };
}

/**
 * 여러 파일을 병렬로 파싱
 */
export async function parseMultipleFiles(files: File[]): Promise<any[]> {
  const results = await Promise.allSettled(
    files.map((file) => parseFile(file))
  );

  return results.map((result, index) => {
    if (result.status === "fulfilled") {
      return result.value;
    } else {
      return {
        error: result.reason?.message || "Unknown error",
        filename: files[index].name,
      };
    }
  });
}
