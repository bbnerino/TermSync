storm api 연동은 아래 지침 참고해. 

"""
STORM Parse API 연동 모듈
"""
import httpx
from typing import Dict, Any, List
from app.config import settings


async def parse_document(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    STORM Parse API를 사용하여 문서 파싱
    
    Args:
        file_path: 파일 경로
        file_type: 파일 타입 (docx, pdf, etc.)
    
    Returns:
        파싱된 문서 내용
    """
    if not settings.STORM_API_KEY:
        # API 키가 없으면 기본 파싱
        return await fallback_parse(file_path, file_type)
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            headers = {'Authorization': f'Bearer {settings.STORM_API_KEY}'}
            
            # Step 1: 파일 업로드
            with open(file_path, 'rb') as f:
                files = {'file': (f.name, f, 'application/octet-stream')}
                data = {
                    'language': 'ko',
                    'deleteOriginFile': 'true'
                }
                
                upload_response = await client.post(
                    'https://storm-apis.sionic.im/parse-router/api/v2/parse/by-file',
                    files=files,
                    data=data,
                    headers=headers,
                )
                
                if upload_response.status_code != 200:
                    print(f"STORM API 업로드 실패: {upload_response.status_code} - {upload_response.text}")
                    return await fallback_parse(file_path, file_type)
                
                upload_result = upload_response.json()
                job_id = upload_result.get('jobId')
                
                if not job_id:
                    print(f"STORM API jobId 없음: {upload_result}")
                    return await fallback_parse(file_path, file_type)
                
                print(f"STORM API 파싱 시작: jobId={job_id}")
            
            # Step 2: 결과 조회 (폴링)
            import asyncio
            max_attempts = 30  # 최대 30번 시도 (약 1분)
            
            for attempt in range(max_attempts):
                await asyncio.sleep(2)  # 2초 대기
                
                result_response = await client.get(
                    f'https://storm-apis.sionic.im/parse-router/api/v2/parse/job/{job_id}',
                    headers=headers,
                )
                
                if result_response.status_code != 200:
                    continue
                
                result = result_response.json()
                state = result.get('state')
                
                print(f"STORM API 상태 확인 ({attempt + 1}/{max_attempts}): {state}")
                
                if state == 'COMPLETED':
                    # 파싱 완료 - pages에서 content 추출
                    pages = result.get('pages', [])
                    content = '\n'.join([page.get('content', '') for page in pages])
                    
                    print(f"STORM API 파싱 완료: {len(pages)}페이지, {len(content)}자")
                    
                    return {
                        "content": content,
                        "paragraphs": content.split('\n'),
                        "word_count": len(content.split()),
                        "page_count": len(pages),
                    }
                
                elif state in ['REQUESTED', 'ACCEPTED', 'PROCESSED']:
                    # 아직 진행 중
                    continue
                else:
                    # 오류 또는 알 수 없는 상태
                    print(f"STORM API 알 수 없는 상태: {state}")
                    break
            
            # 타임아웃 또는 실패 - fallback 사용
            print(f"STORM API 타임아웃, fallback 사용")
            return await fallback_parse(file_path, file_type)
                    
    except Exception as e:
        print(f"STORM API 오류: {e}")
        return await fallback_parse(file_path, file_type)


async def fallback_parse(file_path: str, file_type: str) -> Dict[str, Any]:
    """
    STORM API 없을 때 기본 파싱
    """
    content = ""
    
    if file_type == 'docx':
        from docx import Document
        doc = Document(file_path)
        content = '\n'.join([p.text for p in doc.paragraphs])
        
    elif file_type == 'pdf':
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            content = '\n'.join([page.extract_text() or '' for page in reader.pages])
        except Exception as e:
            print(f"PDF 파싱 오류: {e}")
            content = ""
            
    elif file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    
    return {
        "content": content,
        "paragraphs": content.split('\n') if content else [],
        "word_count": len(content.split()) if content else 0,
    }


def extract_terms_from_content(content: str) -> List[str]:
    """
    문서 내용에서 용어 추출 (간단한 버전)
    """
    import re
    
    # 한글 용어 추출 (2글자 이상)
    korean_terms = re.findall(r'[가-힣]{2,}', content)
    
    # 영어 용어 추출 (2글자 이상)
    english_terms = re.findall(r'[A-Za-z]{2,}', content)
    
    # 중복 제거 및 빈도 계산
    term_counts = {}
    for term in korean_terms + english_terms:
        term_counts[term] = term_counts.get(term, 0) + 1
    
    # 빈도가 2 이상인 용어만 반환
    return [term for term, count in term_counts.items() if count >= 2]

