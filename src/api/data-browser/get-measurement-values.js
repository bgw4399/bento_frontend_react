import axios from 'axios';

/**
 * Values 분포 조회
 * - additionalProp 키: "all" 또는 cohortId (문자열)
 * - 값: [{ unit_name, gender_name, range_label, sort_order, total_participant_count }, ...]
 *
 * @param {Object} params
 * @param {string|number} params.conceptId
 * @param {Array<string|number>} [params.cohortIds]  // 최대 5개
 * @returns {Promise<Object>} 원본 응답 객체 (키=코호트)
 */
export async function getMeasurementValues({ conceptId, cohortIds = [] }) {
  const baseURL = import.meta.env.VITE_PUBLIC_API_URI || '';
  if (!conceptId && conceptId !== 0) throw new Error('conceptId is required');

  const url = `${baseURL}/data-browser/measurements/${encodeURIComponent(
    String(conceptId)
  )}/values`;

  const params = {};
  const ids = (cohortIds || []).slice(0, 5).map(String).filter(Boolean);
  if (ids.length) params.cohortIds = ids.join(',');

  const { data } = await axios.get(url, {
    params,
    headers: { Accept: 'application/json' },
  });
  return data || {};
}
