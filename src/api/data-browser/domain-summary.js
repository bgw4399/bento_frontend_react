import axios from 'axios';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

// 서버 → UI 탭 키 매핑 (정규화)
const DOMAIN_KEY_MAP = {
  // Conditions
  'conditions': 'conditions',
  'condition': 'conditions',
  'condition-occurrence': 'conditions',
  'condition_occurrence': 'conditions',

  // Drugs
  'drugs': 'drugs',
  'drug': 'drugs',
  'drug-exposures': 'drugs',
  'drug_exposures': 'drugs',
  'drug-exposure': 'drugs',
  'drug_exposure': 'drugs',

  // Measurements
  'measurements': 'measurements',
  'measurement': 'measurements',
  'labs-measurements': 'measurements',
  'labs_measurements': 'measurements',
  'measurement-occurrence': 'measurements',
  'measurement_occurrence': 'measurements',

  // Procedures
  'procedures': 'procedures',
  'procedure': 'procedures',
  'procedure-occurrence': 'procedures',
  'procedure_occurrence': 'procedures',
};

function normalizeDomainKey(rawKey) {
  if (!rawKey) return rawKey;
  // 공백/언더스코어를 하이픈으로 통일하고 소문자화
  const k = String(rawKey).toLowerCase().replace(/[\s_]+/g, '-');
  return DOMAIN_KEY_MAP[k] || k;
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
