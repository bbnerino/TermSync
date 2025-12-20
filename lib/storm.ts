/**
 * STORM Parse API Wrapper
 * Based on parser_refer.md documentation
 */

const STORM_API_KEY = process.env.STORM_API_KEY!;
const STORM_API_BASE_URL = 'https://storm-apis.sionic.im/parse-router/api/v2';

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
 * Upload file and start parsing job
 */
export async function uploadAndParse(file: File): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('language', 'ko'); // 한국어 문서
  formData.append('deleteOriginFile', 'true'); // 원본 파일 삭제

  console.log(`[STORM] Uploading file: ${file.name} (${file.type})`);

  const response = await fetch(`${STORM_API_BASE_URL}/parse/by-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STORM_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STORM] Upload failed:', response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data: ParseJobResponse = await response.json();
  console.log('[STORM] Upload response:', data);
  
  if (!data.jobId) {
    throw new Error('No jobId returned from STORM API');
  }

  if (data.state === 'FAILED') {
    throw new Error(data.message || 'Parse job failed');
  }

  return { jobId: data.jobId };
}

/**
 * Upload file from buffer (for server-side)
 */
export async function uploadAndParseBuffer(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{ jobId: string }> {
  const formData = new FormData();
  const blob = new Blob([buffer], { type: mimeType });
  formData.append('file', blob, filename);
  formData.append('language', 'ko');
  formData.append('deleteOriginFile', 'true');

  console.log(`[STORM] Uploading buffer: ${filename} (${mimeType})`);

  const response = await fetch(`${STORM_API_BASE_URL}/parse/by-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STORM_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[STORM] Upload failed:', response.status, error);
    throw new Error(`STORM Parse API Error: ${response.status} - ${error}`);
  }

  const data: ParseJobResponse = await response.json();
  console.log('[STORM] Upload response:', data);
  
  if (!data.jobId) {
    throw new Error('No jobId returned from STORM API');
  }

  if (data.state === 'FAILED') {
    throw new Error(data.message || 'Parse job failed');
  }

  return { jobId: data.jobId };
}

/**
 * Check parse job status
 */
export async function getParseStatus(jobId: string): Promise<ParseResultResponse> {
  const response = await fetch(`${STORM_API_BASE_URL}/parse/job/${jobId}`, {
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

