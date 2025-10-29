import axios from 'axios';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

// 서버 → 탭 키 매핑(유연 매핑)
const DOMAIN_KEY_MAP = {
  conditions: 'conditions',
  condition: 'conditions',
  drugs: 'drug-exposures',
  drug: 'drug-exposures',
  measurements: 'labs-measurements',
  measurement: 'labs-measurements',
  labs: 'labs-measurements',
  procedures: 'procedures',
  procedure: 'procedures',
};

function normalizeDomainKey(rawKey) {
  if (!rawKey) return rawKey;
  const k = String(rawKey).toLowerCase().replace(/\s+/g, '-');
  return DOMAIN_KEY_MAP[k] || rawKey;
}

/**
 * 도메인 요약 가져오기 (GET 방식)
 * @param {Object} params
 * @param {string=} params.keyword     - 검색 키워드 (optional)
 * @param {string[]=} params.cohortIds - 헤더로 보낼 코호트 ID 배열(최대 5)
 * @returns {Promise<Array<{domain_name:string, participant_count:number, concept_count:number}>>}
 */
export async function getDomainSummary({ keyword, cohortIds } = {}) {
  const headers = {};

  if (Array.isArray(cohortIds) && cohortIds.length > 0) {
    headers['cohortId'] = cohortIds.map(String);
  }

  // GET 요청 → keyword는 params로 전달
  const url = `${API_URI}/data-browser/summary`;
  const params = keyword && keyword.trim() ? { keyword: keyword.trim() } : {};

  try {
    const res = await axios.get(url, { params, headers });
    const list = Array.isArray(res.data) ? res.data : [];

    return list.map((row) => ({
      ...row,
      _tab_key: normalizeDomainKey(row.domain_name),
    }));
  } catch (err) {
    const status = err?.response?.status;
    const msg = err?.response?.data || err?.message || 'unknown error';
    console.error(`[getDomainSummary] failed: ${status ?? ''}`, msg);
    throw new Error(
      `getDomainSummary failed: ${status ?? ''} ${JSON.stringify(msg)}`,
    );
  }
}
