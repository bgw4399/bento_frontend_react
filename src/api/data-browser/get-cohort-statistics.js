import axios from 'axios';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

// 공용 axios 인스턴스
export const api = axios.create({
  baseURL: API_URI,
  timeout: 30_000,
});

// 개별 코호트 통계 조회
export async function getCohortStatistics(cohortId, options = {}) {
  if (!cohortId) throw new Error('cohortId is required');
  const { signal, headers } = options;
  const res = await api.get(`/api/cohort/${cohortId}/statistics`, {
    signal,
    headers,
  });
  // 서버 응답 형태를 그대로 반환(필요시 여기서 shape 변환)
  return res.data;
}

/**
 * 여러 코호트 통계를 병렬 조회 (실패는 건너뛰고 성공만 반환)
 * @param {Array<string|number>} cohortIds
 * @param {{ concurrency?: number, signal?: AbortSignal }} options
 * @returns {Promise<Map<id, stats>>}
 */
export async function fetchCohortStatsBatch(cohortIds = [], options = {}) {
  const { signal } = options || {};
  const tasks = cohortIds.map((id) =>
    getCohortStatistics(id, { signal })
      .then((data) => ({ id, ok: true, data }))
      .catch((err) => ({ id, ok: false, error: err })),
  );

  const results = await Promise.allSettled(tasks);
  const map = new Map();
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) {
      map.set(r.value.id, r.value.data);
    }
    // 실패는 무시(로그만 남기고 싶으면 여기서 처리)
  }
  return map;
}
