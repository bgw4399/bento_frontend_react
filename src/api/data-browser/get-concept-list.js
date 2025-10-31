import axios from 'axios';

// 탭 키 → 실제 API 도메인 매핑
const TAB_TO_DOMAIN = {
  conditions: 'conditions',
  'drug-exposures': 'drugs',
  'labs-measurements': 'measurements',
  procedures: 'procedures',
};

/**
 * GET /data-browser/domains/{domain}/concepts
 * @param {Object} params
 * @param {'conditions'|'drug-exposures'|'labs-measurements'|'procedures'} params.tabKey
 * @param {string} [params.keyword]
 * @param {Array<string|number>} [params.cohortIds]
 */
export async function getDomainConcepts({
  tabKey,
  keyword = '',
  cohortIds = [],
  page = 1
}) {
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';

  // ✅ Swagger 명세에 맞는 domain 값으로 변환
  const domain = TAB_TO_DOMAIN[tabKey] || tabKey;

  const url = `${baseURL}/data-browser/domains/${domain}/concepts`;

  // ✅ query string 구성
  const params = {};
  if (Array.isArray(cohortIds) && cohortIds.length > 0) {
    params.cohortIds = cohortIds.join(',');
  }
  if (keyword && keyword.trim()) {
    params.keyword = keyword.trim();
  }

  params.page = Math.max(0, Number(page) - 1);

  try {
    const { data } = await axios.get(url, {
      params,
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
