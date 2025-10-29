import axios from 'axios';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

// 서버 → 탭 키 매핑(유연 매핑: 대소문자/하이픈/복수형 등 보정)
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
  return DOMAIN_KEY_MAP[k] || rawKey; // 모르는 키면 그대로 전달(회피)
}

/**
 * 도메인 요약 가져오기
 * @param {Object} params
 * @param {string=} params.keyword   // 입력 사실상 옵션
 * @param {string[]=} params.cohortIds // 헤더로 보낼 선택 코호트 ID 배열(최대 5)
 * @returns {Promise<Array<{domain_name:string, participant_count:number, concept_count:number}>>}
 */
export async function getDomainSummary({ keyword, cohortIds } = {}) {
  const body = keyword && keyword.trim() ? { keyword: keyword.trim() } : {};
  const headers = {};

  if (Array.isArray(cohortIds) && cohortIds.length) {
    // 요구사항: 헤더에 cohortId를 string 배열로 전송
    // 서버가 배열 헤더를 허용한다는 전제. (ex. Nest/Express에서 배열 파싱)
    headers['cohortId'] = cohortIds.map(String);
  }

  const url = `${API_URI}/api/data-browser/summary`;
  const res = await axios.post(url, body, { headers });
  const list = Array.isArray(res.data) ? res.data : [];

  // 키를 우리 탭 키로 매핑한 형태도 함께 리턴
  return list.map((row) => ({
    ...row,
    _tab_key: normalizeDomainKey(row.domain_name),
  }));
}
