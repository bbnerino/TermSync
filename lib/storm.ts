/**
 * STORM API Wrapper
 * New Storm API for file upload and parsing
 */

const STORM_API_KEY = process.env.NEXT_PUBLIC_STORM_API_KEY || process.env.STORM_API_KEY || '';
const STORM_API_BASE_URL = 'https://live-stargate.sionic.im/api/v2';
const STORM_PARSE_API_BASE_URL = 'https://storm-apis.sionic.im/parse-router/api/v2';
const BUCKET_ID = '7407360148281683969';

export interface StormUploadResponse {
  id?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  status?: string;
  message?: string;
  [key: string]: any;
}

interface ParseJobResponse {
  jobId: string;
  state?: 'REQUESTED' | 'ACCEPTED' | 'PROCESSED' | 'COMPLETED' | 'FAILED';
  message?: string;
}

interface ParseResultResponse {
  jobId: string;
  state: 'REQUESTED' | 'ACCEPTED' | 'PROCESSED' | 'COMPLETED' | 'FAILED';
  pages?: Array<{
    content: string;
    pageNumber: number;
  }>;
  error?: string;
}

/**
 * Upload file to Storm API
 * https://sionic-storm-openapi.apidog.io/api-10588036
 */
export async function uploadFileToStorm(
  file: File
): Promise<StormUploadResponse> {
  if (!STORM_API_KEY) {
    throw new Error('Storm API 키가 설정되지 않았습니다.');
  }

  const formData = new FormData();
  formData.append('bucketId', BUCKET_ID);
  formData.append('file', file);

  console.log(`[STORM] Uploading file: ${file.name} (${file.type})`);

  const response = await fetch(
    `${STORM_API_BASE_URL}/documents/by-file`,
    {
      method: 'POST',
      headers: {
        'storm-api-key': STORM_API_KEY,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
        `파일 업로드 실패: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log('[STORM] Upload response:', data);
  return data;
}

/**
 * Upload file and start parsing job (legacy method - uses new upload API)
 */
export async function uploadAndParse(file: File): Promise<{ jobId: string; documentId?: string }> {
  // First upload file using new API
  const uploadResult = await uploadFileToStorm(file);
  
  if (!uploadResult.id) {
    throw new Error('파일 업로드 후 ID를 받지 못했습니다.');
  }

  // Then start parsing using parse API
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', 'ko');
  formData.append('deleteOriginFile', 'true');

  console.log(`[STORM] Starting parse for document: ${uploadResult.id}`);

  const response = await fetch(`${STORM_PARSE_API_BASE_URL}/parse/by-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STORM_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STORM] Parse start failed:', response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data: ParseJobResponse = await response.json();
  console.log('[STORM] Parse job started:', data);
  
  if (!data.jobId) {
    throw new Error('No jobId returned from STORM API');
  }

  if (data.state === 'FAILED') {
    throw new Error(data.message || 'Parse job failed');
  }

  return { jobId: data.jobId, documentId: uploadResult.id };
}

/**
 * Upload file from buffer (for server-side)
 */
export async function uploadAndParseBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ jobId: string; documentId?: string }> {
  // First upload file using new API
  const blob = new Blob([buffer], { type: mimeType });
  const file = new File([blob], filename, { type: mimeType });
  const uploadResult = await uploadFileToStorm(file);
  
  if (!uploadResult.id) {
    throw new Error('파일 업로드 후 ID를 받지 못했습니다.');
  }

  // Then start parsing using parse API
  const formData = new FormData();
  formData.append('file', blob, filename);
  formData.append('language', 'ko');
  formData.append('deleteOriginFile', 'true');

  console.log(`[STORM] Starting parse for buffer: ${filename} (${mimeType})`);

  const response = await fetch(`${STORM_PARSE_API_BASE_URL}/parse/by-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STORM_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STORM] Parse start failed:', response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data: ParseJobResponse = await response.json();
  console.log('[STORM] Parse job started:', data);
  
  if (!data.jobId) {
    throw new Error('No jobId returned from STORM API');
  }

  if (data.state === 'FAILED') {
    throw new Error(data.message || 'Parse job failed');
  }

  return { jobId: data.jobId, documentId: uploadResult.id };
}

/**
 * Check parse job status
 */
export async function getParseStatus(jobId: string): Promise<ParseResultResponse> {
  const response = await fetch(`${STORM_PARSE_API_BASE_URL}/parse/job/${jobId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${STORM_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STORM] Status check failed:', response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  console.log(`[STORM] Job status: ${data.state} (jobId: ${jobId})`);
  
  return data;
}

/**
 * Poll for parse job completion
 * @param jobId - Job ID from uploadAndParse
 * @param maxAttempts - Maximum number of polling attempts (default: 30)
 * @param intervalMs - Polling interval in milliseconds (default: 2000)
 */
export async function pollParseResult(
  jobId: string,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<ParseResultResponse> {
  console.log(`[STORM] Starting poll for jobId: ${jobId}, max attempts: ${maxAttempts}`);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getParseStatus(jobId);

    console.log(`[STORM] Poll attempt ${attempt + 1}/${maxAttempts}: ${result.state}`);

    if (result.state === 'COMPLETED') {
      console.log(`[STORM] Parse completed! Pages: ${result.pages?.length || 0}`);
      return result;
    }

    if (result.state === 'FAILED') {
      throw new Error(result.error || 'Parse job failed');
    }

    // Still processing (REQUESTED, ACCEPTED, PROCESSED)
    if (attempt < maxAttempts - 1) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error('Parse job timeout: exceeded maximum polling attempts');
}

/**
 * Parse file and wait for result (convenience method)
 */
export async function parseFile(file: File): Promise<{
  text: string;
  pages?: number;
  filename: string;
  filesize: number;
}> {
  console.log(`[STORM] Starting parse for file: ${file.name}`);
  
  const { jobId } = await uploadAndParse(file);
  const result = await pollParseResult(jobId);

  if (!result.pages || result.pages.length === 0) {
    throw new Error('Parse result is empty - no pages returned');
  }

  // Extract content from all pages
  const text = result.pages.map(page => page.content).join('\n');
  
  console.log(`[STORM] Parse complete: ${result.pages.length} pages, ${text.length} characters`);

  return {
    text,
    pages: result.pages.length,
    filename: file.name,
    filesize: file.size,
  };
}

/**
 * Parse file from buffer and wait for result (for server-side)
 */
export async function parseFileBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{
  text: string;
  pages?: number;
  filename: string;
  filesize: number;
}> {
  console.log(`[STORM] Starting parse for buffer: ${filename}`);
  
  const { jobId } = await uploadAndParseBuffer(buffer, filename, mimeType);
  const result = await pollParseResult(jobId);

  if (!result.pages || result.pages.length === 0) {
    throw new Error('Parse result is empty - no pages returned');
  }

  // Extract content from all pages
  const text = result.pages.map(page => page.content).join('\n');
  
  console.log(`[STORM] Parse complete: ${result.pages.length} pages, ${text.length} characters`);

  return {
    text,
    pages: result.pages.length,
    filename,
    filesize: buffer.length,
  };
}

/**
 * Extract text from multiple files in parallel
 */
export async function parseMultipleFiles(files: File[]): Promise<Array<{
  text: string;
  pages?: number;
  filename: string;
  filesize: number;
  error?: string;
}>> {
  const results = await Promise.allSettled(
    files.map(file => parseFile(file))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        text: '',
        filename: files[index].name,
        filesize: files[index].size,
        error: result.reason?.message || 'Unknown error',
      };
    }
  });
}

