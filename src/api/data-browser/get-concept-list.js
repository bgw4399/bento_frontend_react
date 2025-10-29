import axios from 'axios';

/**
 * /data-browser/domains/{domain}/concepts (GET 방식)
 * query params:
 *   domain: string,             // 검색어
 *   viewBy?: 'source'|'target', // 기본 'target'
 * headers:
 *   cohortId: string[]          // 선택 코호트 ID 배열
 */
export async function getDomainConcepts({
  tabKey, // 'conditions' | 'drug-exposures' | 'labs-measurements' | 'procedures'
  keyword, // 검색창 텍스트
  viewBy = 'target',
  cohortIds = [],
}) {
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';
  const url = `${baseURL}/data-browser/domains/${tabKey}/concepts`;

  // params로 전달
  const params = {
    domain: keyword || '',
    viewBy,
  };

  // 헤더 구성 (배열 허용)
  const headers = {};
  if (Array.isArray(cohortIds) && cohortIds.length > 0) {
    headers['cohortId'] = cohortIds.map(String);
  }

  try {
    const { data } = await axios.get(url, {
      params,
      headers,
      withCredentials: true,
    });
    return data;
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message || 'unknown error';
    console.error(
      `[getDomainConcepts] GET failed (${status ?? 'no status'})`,
      msg,
    );
    throw new Error(
      `getDomainConcepts failed: ${status ?? ''} ${JSON.stringify(msg)}`,
    );
  }
}
