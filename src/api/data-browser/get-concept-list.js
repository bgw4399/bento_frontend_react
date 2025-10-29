import axios from 'axios';

/**
 * /api/data-browser/{domain}/concepts
 * body:
 * {
 *   domain: string,            // 검색창 텍스트
 *   viewBy?: 'source'|'target',// 기본 'target'
 *   cohortId?: string[],       // 선택 코호트 ID 리스트
 * }
 */
export async function getDomainConcepts({
  tabKey, // 'conditions' | 'drug-exposures' | 'labs-measurements' | 'procedures'
  keyword, // 검색창 텍스트
  viewBy = 'target',
  cohortIds = [],
}) {
  // 환경 변수에서 API 주소 불러오기 (없으면 상대경로로)
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';
  const url = `${baseURL}/api/data-browser/${tabKey}/concepts`;

  const body = {
    domain: keyword || '',
    viewBy,
    cohortId: cohortIds, // 리스트 형태로 전달
  };

  try {
    const { data } = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 쿠키/세션 사용하는 경우 필요
    });
    return data; // 서버 응답 배열 반환
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message || 'unknown error';
    console.error(
      `[getDomainConcepts] Request failed (${status ?? 'no status'})`,
      msg,
    );
    throw new Error(
      `getDomainConcepts failed: ${status ?? ''} ${JSON.stringify(msg)}`,
    );
  }
}
