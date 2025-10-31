import axios from 'axios';

/**
 * GET /data-browser/domains/{domain}/concepts/{conceptId}/details
 * @param {Object} p
 * @param {string} p.domain       // 'conditions' | 'drug-exposures' | ...
 * @param {string|number} p.conceptId
 * @param {string[]} [p.cohortIds] // 최대 5개
 */
export async function getConceptDetails({ domain, conceptId, cohortIds = [] }) {
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';
  const url = `${baseURL}/data-browser/domains/${domain}/concepts/${conceptId}/details`;

  const params = {};
  if (Array.isArray(cohortIds) && cohortIds.length > 0) {
    params.cohortIds = cohortIds.slice(0, 5).join(','); // 쿼리스트링
  }

  const { data } = await axios.get(url, {
    params,
    headers: { accept: 'application/json' },
  });
  return data; // { conceptId, conceptName, demographics: {...} }
}
