import axios from 'axios';

/**
 * GET /data-browser/domains/{domain}/concepts
 * @param {Object} params
 * @param {'conditions'|'drugs'|'measurements'|'procedures'} params.tabKey - 도메인 키
 * @param {string} [params.keyword] - 검색어 (optional)
 * @param {Array<string|number>} [params.cohortIds] - 코호트 ID 배열
 */
export async function getDomainConcepts({
  tabKey, // 'conditions' | 'drugs' | 'measurements' | 'procedures'
  keyword = '',
  cohortIds = [],
}) {
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';
  const url = `${baseURL}/data-browser/domains/${tabKey}/concepts`;

  // API 명세에 맞게 query string 구성
  const params = {};
  if (Array.isArray(cohortIds) && cohortIds.length > 0) {
    params.cohortIds = cohortIds.join(','); // comma-separated string
  }
  if (keyword && keyword.trim()) {
    params.keyword = keyword.trim();
  }

  try {
    const { data } = await axios.get(url, {
      params,
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
