'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Users,
  ChevronDown,
  X,
  BarChart3,
  Activity,
  TrendingUp,
  Stethoscope,
} from 'lucide-react';
import { fetchCohortStatsBatch } from '@/api/data-browser/get-cohort-statistics.js';
import { MOCK_COHORTS } from '@/data/dummy-data.js';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

/** 유틸: 안전한 숫자 */
const n0 = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** 유틸: 색상 클래스 */
const CHART_COLORS = [
  'bg-chart-1',
  'bg-chart-2',
  'bg-chart-3',
  'bg-chart-4',
  'bg-chart-5',
];

/** 유틸: 선택 코호트 공통 age 구간 정렬 */
function getAllAgeRanges(selected) {
  const set = new Set();

  selected.forEach((c) => {
    if (c && c.age) Object.keys(c.age).forEach((k) => set.add(k));
  });

  // 구간 시작값 기준으로 오름차순 정렬
  return Array.from(set).sort((a, b) => {
    const aNum = Math.abs(parseInt(a.split('-')[1], 10));
    const bNum = Math.abs(parseInt(b.split('-')[1], 10));
    return bNum - aNum;
  });
}

/** 유틸: age 구간 reverse */
function prettyAgeLabel(range) {
  const nums = String(range).match(/-?\d+/g);
  if (!nums || nums.length < 2) return range;
  const a = Math.abs(parseInt(nums[0], 10));
  const b = Math.abs(parseInt(nums[1], 10));
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return `${lo}-${hi}`;
}

/** 유틸: visitCount 전체 key */
function getAllVisitCounts(selected) {
  const set = new Set();
  selected.forEach((c) => {
    if (c && c.visitCount) Object.keys(c.visitCount).forEach((k) => set.add(k));
  });
  return Array.from(set).sort((a, b) => Number(a) - Number(b));
}

/** 유틸: 스택 상단에 누적 left% 계산 */
function cumLeft(values, idx) {
  if (idx <= 0) return 0;
  let s = 0;
  for (let i = 0; i < idx; i++) s += values[i] || 0;
  return s;
}

/** 유틸: 날짜 계산 */
const formatDate = (v) => {
  if (!v) return '';
  // "YYYY-MM-DD HH:mm:ss.sss" → "YYYY-MM-DDTHH:mm:ss.sss"
  const iso = v.includes('T') ? v : v.replace(' ', 'T');
  let d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    // Safari 등 호환 위해 수동 파싱
    try {
      const [datePart = '', timePart = ''] = v.split(' ');
      const [yy = '1970', mm = '1', dd = '1'] = datePart.split('-');
      const [HH = '0', MM = '0', SSms = '0'] = timePart.split(':');
      const [SS = '0', MS = '0'] = SSms.split('.');
      d = new Date(
        Number(yy),
        Number(mm) - 1,
        Number(dd),
        Number(HH),
        Number(MM),
        Number(SS),
        Number(MS || 0),
      );
    } catch {
      return v; // 최후 fallback: 원문 표기
    }
  }

  // 로케일 고정 원하면 'ko-KR' 유지
  return d.toLocaleString('ko-KR');
};

export function CohortHeader({ selectedCohorts, setSelectedCohorts, type }) {
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortSearchQuery, setCohortSearchQuery] = useState('');
  const [serverQuery, setServerQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); // UI 1-based
  const [totalItems, setTotalItems] = useState(0);
  const [cohortList, setCohortList] = useState([]); // 모달 리스트
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [isCohortOverviewExpanded, setIsCohortOverviewExpanded] =
    useState(true);
  const [visibleCohortCards, setVisibleCohortCards] = useState(
    new Set([
      'age',
      'sex',
      'mortality',
      'visitType',
      'visitCount',
      'topDrugs',
      'topConditions',
      'topProcedures',
      'topMeasurements',
    ]),
  );

  const hasStats = (c) =>
    !!(c && (c.gender || c.mortality || c.age || c.visitType || c.visitCount));

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  /** 유틸: API 통계 → UI 스키마 정규화 */
  function normalizeStats(raw) {
    if (!raw || typeof raw !== 'object') return {};

    // 1) age 키 변환: "-80--71"  ->  "80-71"
    const normAge = {};
    if (raw.age && typeof raw.age === 'object') {
      for (const [k, v] of Object.entries(raw.age)) {
        // 숫자 2개 뽑아서 "A-B"로
        const nums = String(k).match(/-?\d+/g); // 예: ["-80","-71"]
        if (nums && nums.length >= 2) {
          const a = Math.abs(parseInt(nums[0], 10));
          const b = Math.abs(parseInt(nums[1], 10));
          normAge[`${a}-${b}`] = Number(v) || 0;
        } else {
          // 포맷 예외는 원문 유지
          normAge[k] = Number(v) || 0;
        }
      }
    }

    // 2) top10 키 이름 매핑 (단수 → 복수)
    const topTenDrugs = raw.topTenDrug || null;
    const topTenConditions = raw.topTenCondition || null;
    const topTenProcedures = raw.topTenProcedure || null;
    const topTenMeasurements = raw.topTenMeasurement || null;

    // 3) count 계산: gender의 MALE+FEMALE 합
    let derivedCount = undefined;
    if (raw.gender && (Number(raw.gender.MALE) || Number(raw.gender.FEMALE))) {
      derivedCount =
        (Number(raw.gender.MALE) || 0) + (Number(raw.gender.FEMALE) || 0);
    }

    return {
      gender: raw.gender ?? null,
      mortality: raw.mortality ?? null,
      age: Object.keys(normAge).length ? normAge : (raw.age ?? null),
      visitType: raw.visitType ?? null,
      visitCount: raw.visitCount ?? null,
      topTenDrugs: topTenDrugs ?? null,
      topTenConditions: topTenConditions ?? null,
      topTenProcedures: topTenProcedures ?? null,
      topTenMeasurements: topTenMeasurements ?? null,
      __derivedCount: derivedCount, // 내부 용도
    };
  }

  /** ====== 코호트 목록 호출 (실패/빈결과 시 MOCK 폴백) ====== */
  async function fetchCohorts({ page = 1, limit = pageSize, query = '' } = {}) {
    setLoading(true);
    setFetchError('');
    try {
      const apiPage = Math.max(0, Number(page) - 1);
      const params = new URLSearchParams();
      params.set('page', String(apiPage));
      params.set('limit', String(limit));
      if (query && query.trim()) params.set('query', query.trim());

      const res = await fetch(`${API_URI}/api/cohort?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();
      const items =
        data && data.cohorts
          ? data.cohorts
          : data && data.items
            ? data.items
            : Array.isArray(data)
              ? data
              : (data && data.data) || [];

      const total =
        Number(data && data.total) ||
        Number(data && data.totalElements) ||
        Number(data && data.count) ||
        (Array.isArray(items) ? Number(items.length) : 0);

      const effectiveLimit = Number((data && data.limit) || limit || 10);

      if (!Array.isArray(items) || items.length === 0) {
        // 폴백: 비어있다면 목업
        setCohortList(MOCK_COHORTS);
        setTotalItems(MOCK_COHORTS.length);
        setPageSize(effectiveLimit);
        return;
      }

      setCohortList(items);
      setTotalItems(Number.isFinite(total) ? total : items.length);
      setPageSize(effectiveLimit);
    } catch (e) {
      console.error(e);
      setFetchError('Failed to load cohorts.');
      setCohortList(MOCK_COHORTS);
      setTotalItems(MOCK_COHORTS.length);
    } finally {
      setLoading(false);
    }
  }

  // 모달 열릴 때 최초 로드
  useEffect(() => {
    if (isCohortModalOpen) {
      // 열릴 때는 목록 로드
      fetchCohorts({ page: currentPage, limit: pageSize, query: serverQuery });
    } else {
      // 닫혔을 때: 선택된 코호트 중 아직 통계 없는 항목만 조회
      const needs = (Array.isArray(selectedCohorts) ? selectedCohorts : [])
        .filter((c) => !hasStats(c))
        .map((c) => c.id);
      if (needs.length === 0) return;

      const abort = new AbortController();
      (async () => {
        try {
          const statsMap = await fetchCohortStatsBatch(needs, {
            signal: abort.signal,
          });
          if (statsMap.size === 0) return;
          // 성공 건만 병합
          setSelectedCohorts((prev) => {
            const arr = Array.isArray(prev) ? prev : [];
            return arr.map((c) => {
              if (!statsMap.has(c.id)) return c;

              // API 통계 정규화
              const sRaw = statsMap.get(c.id) || {};
              const s = normalizeStats(sRaw);

              // count: 원래 c.count가 없거나 0이면, gender 합으로 세팅
              const newCount =
                c.count && Number(c.count) > 0
                  ? c.count
                  : (s.__derivedCount ?? c.count ?? 0);

              return {
                ...c,
                count: newCount,
                gender: s.gender ?? c.gender ?? null,
                mortality: s.mortality ?? c.mortality ?? null,
                age: s.age ?? c.age ?? null,
                visitType: s.visitType ?? c.visitType ?? null,
                visitCount: s.visitCount ?? c.visitCount ?? null,
                topTenDrugs: s.topTenDrugs ?? c.topTenDrugs ?? null,
                topTenConditions:
                  s.topTenConditions ?? c.topTenConditions ?? null,
                topTenProcedures:
                  s.topTenProcedures ?? c.topTenProcedures ?? null,
                topTenMeasurements:
                  s.topTenMeasurements ?? c.topTenMeasurements ?? null,
              };
            });
          });
        } catch (e) {
          console.error(e);
        }
      })();

      return () => abort.abort();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCohortModalOpen]);

  // 페이지 변경 시
  useEffect(() => {
    if (!isCohortModalOpen) return;
    fetchCohorts({ page: currentPage, limit: pageSize, query: serverQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // 검색 디바운스(300ms)
  useEffect(() => {
    if (!isCohortModalOpen) return;
    const t = setTimeout(() => {
      setCurrentPage(1);
      setServerQuery(cohortSearchQuery);
      fetchCohorts({ page: 1, limit: pageSize, query: cohortSearchQuery });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortSearchQuery, isCohortModalOpen]);

  const normalizeCohort = (raw) => {
    const id = (raw && (raw.id ?? raw.cohort_id ?? raw._id)) || undefined;
    const name = (raw && raw.name) || `(no name: ${id})`;
    const description = (raw && raw.description) || '';
    const count = n0(raw && (raw.count ?? raw.size ?? raw.participants));

    const author = raw?.author ?? null;
    const created_at = raw?.created_at ?? null;
    const updated_at = raw?.updated_at ?? null;

    return {
      id,
      name,
      description,
      count,
      author,
      created_at,
      updated_at,
      gender: raw?.gender ?? null,
      mortality: raw?.mortality ?? null,
      age: raw?.age ?? null,
      visitType: raw?.visitType ?? null,
      visitCount: raw?.visitCount ?? null,
      topTenDrugs: raw?.topTenDrugs ?? null,
      topTenConditions: raw?.topTenConditions ?? null,
      topTenProcedures: raw?.topTenProcedures ?? null,
      topTenMeasurements: raw?.topTenMeasurements ?? null,
    };
  };

  const handleCohortToggle = (raw) => {
    const cohort = normalizeCohort(raw);
    setSelectedCohorts((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const isSelected = safePrev.some((c) => c.id === cohort.id);
      if (isSelected) return safePrev.filter((c) => c.id !== cohort.id);
      if (safePrev.length >= 5) return safePrev;
      return [...safePrev, cohort];
    });
  };

  const handleCohortRemove = (cohortId) => {
    setSelectedCohorts((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      return safePrev.filter((c) => c.id !== cohortId);
    });
  };

  const toggleCohortCard = (cardId) => {
    setVisibleCohortCards((prev) => {
      const n = new Set(prev);
      if (n.has(cardId)) n.delete(cardId);
      else n.add(cardId);
      return n;
    });
  };

  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const showingFrom =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const showingTo = Math.min(safeCurrentPage * pageSize, totalItems);

  // 선택 코호트(정규화) — 기본 0개 유지
  const normalizedSelected = useMemo(() => {
    return Array.isArray(selectedCohorts)
      ? selectedCohorts.map(normalizeCohort)
      : [];
  }, [selectedCohorts]);

  // ====== 카드용 데이터 계산 ======

  // 1) Age Distribution
  const ageRanges = getAllAgeRanges(normalizedSelected);
  const ageTotalsByRange = ageRanges.map((range) =>
    normalizedSelected.reduce((s, c) => s + n0(c && c.age && c.age[range]), 0),
  );

  // 2) Sex Distribution
  const sexKeys = ['Female', 'Male'];
  const sexCountsPerCohort = normalizedSelected.map((c) => {
    if (c && c.gender) {
      const f = n0(c.gender.FEMALE);
      const m = n0(c.gender.MALE);
      return { Female: f, Male: m };
    }
    const F = Math.floor(c.count * 0.52);
    const M = Math.floor(c.count * 0.46);
    return { Female: F, Male: M };
  });

  // 3) Mortality
  const mortalityKeys = ['Alive', 'Deceased'];
  const mortalityCountsPerCohort = normalizedSelected.map((c) => {
    if (c && c.mortality) {
      return {
        Alive: n0(c.mortality.alive),
        Deceased: n0(c.mortality.deceased),
      };
    }
    const alive = Math.floor(c.count * 0.95);
    const deceased = Math.max(0, c.count - alive);
    return { Alive: alive, Deceased: deceased };
  });

  // 4) Visit Type
  const visitTypeKeys = [
    'Outpatient Visit',
    'Inpatient Visit',
    'Emergency Room Visit',
  ];
  const visitTypeCountsPerCohort = normalizedSelected.map((c) => {
    if (c && c.visitType) {
      return {
        'Outpatient Visit': n0(c.visitType['Outpatient Visit']),
        'Inpatient Visit': n0(c.visitType['Inpatient Visit']),
        'Emergency Room Visit': n0(c.visitType['Emergency Room Visit']),
      };
    }
    return {
      'Outpatient Visit': Math.floor(c.count * 0.7),
      'Inpatient Visit': Math.floor(c.count * 0.2),
      'Emergency Room Visit': Math.max(0, c.count - Math.floor(c.count * 0.9)),
    };
  });

  // 5) Visit Count Distribution
  const visitCountKeys = getAllVisitCounts(normalizedSelected);
  const visitCountMax = Math.max(
    1,
    ...visitCountKeys.map((k) =>
      Math.max(
        ...normalizedSelected.map((c) =>
          n0(c && c.visitCount && c.visitCount[k]),
        ),
      ),
    ),
  );

  // 6~9) Top 10
  function buildTop10(titleKey) {
    const map = new Map();
    normalizedSelected.forEach((c) => {
      const bag = c && c[titleKey];
      if (!bag) return;
      Object.entries(bag).forEach(([name, cnt]) => {
        if (!map.has(name)) map.set(name, new Map());
        const inner = map.get(name);
        if (inner && inner.set) inner.set(c.id, n0(cnt));
      });
    });
    const items = Array.from(map.entries())
      .map(([name, byCohort]) => {
        const total = Array.from(byCohort.values()).reduce((s, v) => s + v, 0);
        return { name, byCohort, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    return items;
  }

  const top10Drugs = buildTop10('topTenDrugs');
  const top10Conditions = buildTop10('topTenConditions');
  const top10Procedures = buildTop10('topTenProcedures');
  const top10Measurements = buildTop10('topTenMeasurements');

  return (
    <section className="border-b border-border bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {type === 'DataBrowser' ? 'Data Browser' : 'CustomChart'}
          </h1>
          <p className="text-gray-600">
            {type === 'DataBrowser'
              ? 'Browse aggregate-level data contributed by All of Us research participants.'
              : 'Define your own data visualization parameters.'}
          </p>
        </div>

        {/* Top bar: Cohort picker + total */}
        <div className="mb-6 flex items-center justify-between">
          <Dialog open={isCohortModalOpen} onOpenChange={setIsCohortModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-card px-6 py-6 text-lg">
                <Search className="mr-2 h-5 w-5" />
                {normalizedSelected.length === 0
                  ? 'Select cohorts'
                  : normalizedSelected.length === 1
                    ? normalizedSelected[0].name
                    : `${normalizedSelected.length} Cohorts Selected`}
                <ChevronDown className="ml-2 h-5 w-5" />
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">Select Cohorts</DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Select up to 5 cohorts for comparison
                </p>
              </DialogHeader>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search cohorts by name/description/author..."
                    value={cohortSearchQuery}
                    onChange={(e) => setCohortSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[460px] space-y-3 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : cohortList.length > 0 ? (
                  <>
                    {fetchError && (
                      <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        {fetchError}
                      </div>
                    )}
                    {cohortList.map((raw) => {
                      const cohort = normalizeCohort(raw);
                      const isSelected = normalizedSelected.some(
                        (c) => c.id === cohort.id,
                      );
                      const isDisabled =
                        !isSelected && normalizedSelected.length >= 5;
                      return (
                        <div
                          key={cohort.id}
                          className={`rounded-lg border-2 p-4 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : isDisabled
                                ? 'border-border bg-muted/30 opacity-50'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              disabled={isDisabled}
                              onCheckedChange={() => handleCohortToggle(raw)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <div className="font-semibold text-foreground">
                                  {cohort.name}
                                </div>
                                <div className="mt-1 text-right text-xs leading-tight text-muted-foreground">
                                  {/*{cohort.author && (*/}
                                  {/*  <div>Author: {shortId(cohort.author)}</div>*/}
                                  {/*)}*/}
                                  {cohort.created_at && (
                                    <div>{formatDate(cohort.created_at)}</div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {cohort.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : fetchError ? (
                  <div className="p-8 text-center text-red-500">
                    {fetchError}
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No cohorts found
                  </div>
                )}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {showingFrom}-{showingTo} of {totalItems}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1 || loading}
                  >
                    Prev
                  </Button>
                  <div className="text-sm font-medium">
                    Page {safeCurrentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safeCurrentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected cohort badges */}
        {normalizedSelected.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {normalizedSelected.map((cohort) => (
              <Badge
                key={cohort.id}
                variant="secondary"
                className="flex items-center gap-2"
              >
                {cohort.name}
                <button
                  onClick={() => handleCohortRemove(cohort.id)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Collapsible overview */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() =>
              setIsCohortOverviewExpanded(!isCohortOverviewExpanded)
            }
            className="flex w-full items-center justify-between bg-card py-6 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold">
                Cohort Overview & Statistics
              </span>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${isCohortOverviewExpanded ? 'rotate-180' : ''}`}
            />
          </Button>

          {isCohortOverviewExpanded && (
            <div className="mt-4 space-y-4">
              {/* 빈 선택 안내 */}
              {normalizedSelected.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  No cohorts selected. Use the picker above to select up to 5
                  cohorts.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Age Distribution */}
                  {visibleCohortCards.has('age') && (
                    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Activity className="h-4 w-4 text-primary" />
                          Age Distribution
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCohortCard('age')}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                        {ageRanges.map((range) => {
                          const total = normalizedSelected.reduce(
                            (s, c) => s + n0(c && c.age && c.age[range]),
                            0,
                          );
                          return (
                            <div key={range}>
                              <div className="mb-1 flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {prettyAgeLabel(range)} years
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Total: {total.toLocaleString()}
                                </span>
                              </div>
                              <div className="space-y-1">
                                {normalizedSelected.map((cohort, idx) => {
                                  const cval = n0(
                                    cohort && cohort.age && cohort.age[range],
                                  );
                                  const pct =
                                    total > 0 ? (cval / total) * 100 : 0;
                                  return (
                                    <div
                                      key={cohort.id}
                                      className="flex items-center gap-2"
                                    >
                                      <span className="w-32 truncate text-xs text-muted-foreground">
                                        {cohort.name}
                                      </span>
                                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                        <div
                                          className={`h-full ${CHART_COLORS[idx % CHART_COLORS.length]} rounded-full transition-all`}
                                          style={{ width: `${pct}%` }}
                                        />
                                      </div>
                                      <span className="w-20 text-right text-xs text-muted-foreground">
                                        {cval.toLocaleString()}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Sex Distribution */}
                  {visibleCohortCards.has('sex') && (
                    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Users className="h-4 w-4 text-primary" />
                          Sex Distribution
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCohortCard('sex')}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                        {sexKeys.map((label) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {normalizedSelected.map((cohort, idx) => {
                                const counts = sexCountsPerCohort[idx];
                                const cval = n0(counts[label]);
                                const pct =
                                  cohort.count > 0
                                    ? (cval / cohort.count) * 100
                                    : 0;
                                return (
                                  <div
                                    key={cohort.id}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-32 truncate text-xs text-muted-foreground">
                                      {cohort.name}
                                    </span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className={`h-full ${CHART_COLORS[idx % CHART_COLORS.length]} rounded-full transition-all`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-20 text-right text-xs text-muted-foreground">
                                      {cval.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mortality */}
                  {visibleCohortCards.has('mortality') && (
                    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Activity className="h-4 w-4 text-primary" />
                          Mortality
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCohortCard('mortality')}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                        {mortalityKeys.map((label) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {normalizedSelected.map((cohort, idx) => {
                                const counts = mortalityCountsPerCohort[idx];
                                const cval = n0(counts[label]);
                                const pct =
                                  cohort.count > 0
                                    ? (cval / cohort.count) * 100
                                    : 0;
                                return (
                                  <div
                                    key={cohort.id}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-32 truncate text-xs text-muted-foreground">
                                      {cohort.name}
                                    </span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className={`h-full ${CHART_COLORS[idx % CHART_COLORS.length]} rounded-full transition-all`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-24 text-right text-xs text-muted-foreground">
                                      {cval.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visit Type */}
                  {visibleCohortCards.has('visitType') && (
                    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <Stethoscope className="h-4 w-4 text-primary" />
                          Visit Type
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCohortCard('visitType')}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                        {visitTypeKeys.map((label) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {label}
                              </span>
                            </div>
                            <div className="space-y-1">
                              {normalizedSelected.map((cohort, idx) => {
                                const counts = visitTypeCountsPerCohort[idx];
                                const cval = n0(counts[label]);
                                const totalVT = visitTypeKeys.reduce(
                                  (s, k) => s + n0(counts[k]),
                                  0,
                                );
                                const pct =
                                  totalVT > 0 ? (cval / totalVT) * 100 : 0;
                                return (
                                  <div
                                    key={cohort.id}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-32 truncate text-xs text-muted-foreground">
                                      {cohort.name}
                                    </span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className={`h-full ${CHART_COLORS[idx % CHART_COLORS.length]} rounded-full transition-all`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-20 text-right text-xs text-muted-foreground">
                                      {cval.toLocaleString()}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Visit Count Distribution */}
                  {visibleCohortCards.has('visitCount') && (
                    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                      <div className="flex items-center justify-between border-b border-border p-4">
                        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Visit Count Distribution
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCohortCard('visitCount')}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
                        {visitCountKeys.map((k) => (
                          <div key={k}>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {k} visits
                              </span>
                            </div>
                            <div className="space-y-1">
                              {normalizedSelected.map((cohort, idx) => {
                                const cval = n0(
                                  cohort &&
                                    cohort.visitCount &&
                                    cohort.visitCount[k],
                                );
                                const pct =
                                  visitCountMax > 0
                                    ? (cval / visitCountMax) * 100
                                    : 0;
                                return (
                                  <div
                                    key={cohort.id}
                                    className="flex items-center gap-2"
                                  >
                                    <span className="w-32 truncate text-xs text-muted-foreground">
                                      {cohort.name}
                                    </span>
                                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                      <div
                                        className={`h-full ${CHART_COLORS[idx % CHART_COLORS.length]} rounded-full transition-all`}
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                    <span className="w-28 text-right text-xs text-muted-foreground">
                                      {cval.toLocaleString()} people
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top 10 카드들 */}
                  {visibleCohortCards.has('topDrugs') && (
                    <TopStackedCard
                      title="Top 10 Drugs"
                      icon={<Activity className="h-4 w-4 text-primary" />}
                      items={top10Drugs}
                      cohorts={normalizedSelected}
                      onClose={() => toggleCohortCard('topDrugs')}
                    />
                  )}
                  {visibleCohortCards.has('topConditions') && (
                    <TopStackedCard
                      title="Top 10 Conditions"
                      icon={<Stethoscope className="h-4 w-4 text-primary" />}
                      items={top10Conditions}
                      cohorts={normalizedSelected}
                      onClose={() => toggleCohortCard('topConditions')}
                    />
                  )}
                  {visibleCohortCards.has('topProcedures') && (
                    <TopStackedCard
                      title="Top 10 Procedures"
                      icon={<Activity className="h-4 w-4 text-primary" />}
                      items={top10Procedures}
                      cohorts={normalizedSelected}
                      onClose={() => toggleCohortCard('topProcedures')}
                    />
                  )}
                  {visibleCohortCards.has('topMeasurements') && (
                    <TopStackedCard
                      title="Top 10 Measurements"
                      icon={<TrendingUp className="h-4 w-4 text-primary" />}
                      items={top10Measurements}
                      cohorts={normalizedSelected}
                      onClose={() => toggleCohortCard('topMeasurements')}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 공통 스택 바 카드 컴포넌트 (Top 10 *) */
function TopStackedCard({ title, icon, items, cohorts, onClose }) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeCohorts = Array.isArray(cohorts) ? cohorts : [];

  return (
    <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 w-7 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="max-h-96 space-y-3 overflow-y-auto p-4">
        {safeItems.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No data
          </div>
        ) : (
          safeItems.map((item) => {
            const by = item && item.byCohort;
            const values = safeCohorts.map(
              (c) => (by && by.get ? by.get(c.id) : 0) || 0,
            );
            return (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="flex-1 truncate text-xs font-medium">
                    {item.name}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {item.total.toLocaleString()}
                  </span>
                </div>
                <div className="relative h-6 overflow-hidden rounded-full bg-muted">
                  {safeCohorts.map((c, idx) => {
                    const val = values[idx];
                    if (val <= 0) return null;
                    const left =
                      (cumLeft(values, idx) / Math.max(1, item.total)) * 100;
                    const width = (val / Math.max(1, item.total)) * 100;
                    return (
                      <div
                        key={c.id}
                        className={`absolute top-0 h-full ${CHART_COLORS[idx % CHART_COLORS.length]} transition-all`}
                        style={{ left: `${left}%`, width: `${width}%` }}
                        title={`${c.name}: ${val}`}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {safeCohorts.map((c, idx) => {
                    const val = values[idx];
                    if (val <= 0) return null;
                    return (
                      <div key={c.id} className="flex items-center gap-1">
                        <div
                          className={`h-2 w-2 rounded-full ${CHART_COLORS[idx % CHART_COLORS.length]}`}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {c.name}: {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
