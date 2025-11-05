'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Database,
  Pill,
  FlaskConical,
  Stethoscope,
  Activity,
  TrendingUp,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  User,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataVisualization } from '../CustomChartPage/_components/data-visualization.jsx';
import { TopChart } from './_components/top-chart.jsx';
import { CohortHeader } from '../../components/Header/DataBrowserHeader.jsx';
import { getDomainSummary } from '@/api/data-browser/domain-summary.js';
import { getDomainConcepts } from '@/api/data-browser/get-concept-list.js';
import { getConceptDetails } from '@/api/data-browser/get-concept-detail.js';
import { getMeasurementValues } from '@/api/data-browser/get-measurement-values.js';

const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replaceAll(',', ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

const getSnuhCount = (vocab, code) => {
  if (!vocab || !code) return 0;

  if (typeof vocab === 'object' && !Array.isArray(vocab)) {
    const val = vocab[code];
    if (val != null) return toNum(val);
  }
  if (Array.isArray(vocab)) {
    for (const item of vocab) {
      if (!item) continue;
      const k = item.code ?? item.snuhId ?? item.id;
      if (k === code) {
        const c =
          item.count ??
          item.value ??
          item.person_count ??
          item.total_participant_count;
        return toNum(c);
      }
    }
  }
  return 0;
};

const tabConfig = [
  {
    key: 'conditions',
    label: 'Conditions',
    icon: Stethoscope,
    color: 'text-primary',
  },
  {
    key: 'drugs',
    label: 'Drug Exposures',
    icon: Pill,
    color: 'text-accent',
  },
  {
    key: 'measurements',
    label: 'Measurements',
    icon: FlaskConical,
    color: 'text-primary',
  },
  {
    key: 'procedures',
    label: 'Procedures',
    icon: Database,
    color: 'text-accent',
  },
];

export default function MedicalDataBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLimit, setSearchLimit] = useState(50);
  const [hasSearched, setHasSearched] = useState(true);
  const [activeTab, setActiveTab] = useState('conditions');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCohorts, setSelectedCohorts] = useState([]);
  const [layoutMode, setLayoutMode] = useState('split'); // "split" | "traditional"
  const [selectedItem, setSelectedItem] = useState(null);

  const [sortBy, setSortBy] = useState('default'); // "default" | "snuh"
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSnuhGroups, setExpandedSnuhGroups] = useState(new Set());

  const [summary, setSummary] = useState([]); // API 결과 원본
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const [concepts, setConcepts] = useState([]);
  const [conceptsLoading, setConceptsLoading] = useState(false);
  const [conceptsError, setConceptsError] = useState('');

  const [detailsByKey, setDetailsByKey] = useState({}); // API 결과 캐시
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');

  const [conceptsPage, setConceptsPage] = useState(1); // 1-based
  const [conceptsTotal, setConceptsTotal] = useState(0); // 전체 개수

  const normalizeConceptsResponse = (res) => {
    // concepts 래퍼를 먼저 벗긴다
    const box =
      res && typeof res === 'object' && 'concepts' in res ? res.concepts : res;

    if (Array.isArray(box)) return { list: box, page: 0, total: box.length };

    if (box && typeof box === 'object') {
      const list = Array.isArray(box.items)
        ? box.items
        : Array.isArray(box.content)
          ? box.content
          : Array.isArray(box.data)
            ? box.data
            : Array.isArray(box.results)
              ? box.results
              : Array.isArray(box.list)
                ? box.list
                : [];

      const page0 =
        typeof box.page === 'number'
          ? box.page
          : typeof box.pageNumber === 'number'
            ? box.pageNumber
            : typeof box.page_index === 'number'
              ? box.page_index
              : 0;

      const total =
        typeof box.total === 'number'
          ? box.total
          : typeof box.totalElements === 'number'
            ? box.totalElements
            : typeof box.total_count === 'number'
              ? box.total_count
              : list.length;

      return { list, page: page0, total };
    }

    return { list: [], page: 0, total: 0 };
  };

  // 탭 키를 API domain 형태로 매핑 (labs-measurements → measurements)
  const apiDomainOf = (tabKey) =>
    tabKey === 'labs-measurements' ? 'measurements' : tabKey;

  // 도메인 + conceptId + cohortIds 조합으로 캐시 키 만들기
  const detailsKeyOf = (domain, conceptId, cohortIds) =>
    `${domain}:${conceptId}:${(cohortIds || []).slice(0, 5).join('|')}`;

  // 탭 키 → summary row 매핑
  const summaryByKey = useMemo(() => {
    const map = {};
    for (const row of summary) {
      if (row && row._tab_key) map[row._tab_key] = row;
    }
    return map;
  }, [summary]);

  // 탭 요약 갱신
  async function refreshSummary(optionalKeyword) {
    try {
      setSummaryLoading(true);
      setSummaryError('');
      const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);
      const data = await getDomainSummary({
        keyword: optionalKeyword,
        cohortIds,
      });

      setSummary((prev) => {
        const nextByKey = new Map();
        for (const row of data || []) {
          if (!row || !row._tab_key) continue;
          nextByKey.set(row._tab_key, row);
        }
        const merged = [];
        for (const oldRow of prev || []) {
          const key = oldRow?._tab_key;
          if (!key) continue;
          const fresh = nextByKey.get(key);
          if (fresh) {
            merged.push({
              ...fresh,
              participant_count:
                typeof oldRow.participant_count === 'number'
                  ? oldRow.participant_count
                  : fresh.participant_count,
              concept_count:
                typeof fresh.concept_count === 'number'
                  ? fresh.concept_count
                  : oldRow.concept_count,
            });
            nextByKey.delete(key);
          } else {
            merged.push(oldRow);
          }
        }
        for (const [, fresh] of nextByKey) merged.push(fresh);
        return merged;
      });
    } catch (e) {
      console.error(e);
      setSummary([]);
      setSummaryError('Failed to load domain summary');
    } finally {
      setSummaryLoading(false);
    }
  }

  // 컨셉 리스트 갱신
  async function refreshConcepts() {
    try {
      setConceptsLoading(true);
      setConceptsError('');

      const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);

      const res = await getDomainConcepts({
        tabKey: activeTab, // e.g. 'conditions'
        keyword: searchQuery, // 검색창 입력값
        cohortIds,
        page: currentPage,
      });

      const { list: raw, page: page0, total } = normalizeConceptsResponse(res);

      // vocabulary_counts에서 "첫 번째 숫자"를 안전하게 꺼내는 헬퍼
      const firstNumber = (input) => {
        if (input == null) return 0;
        if (typeof input === 'number') return toNum(input);
        if (typeof input === 'string') return toNum(input);
        if (Array.isArray(input)) {
          for (const el of input) {
            const n = firstNumber(el);
            if (n) return n;
          }
          return 0;
        }
        if (typeof input === 'object') {
          for (const v of Object.values(input)) {
            const n = firstNumber(v);
            if (n) return n;
          }
          return 0;
        }
        return 0;
      };

      const mapped = (raw || []).map((row, idx) => {
        // OMOP 기준에서 쓸 원본 카운트
        const omopCount = toNum(
          row.total_participant_count ?? row.person_count ?? row.count,
        );

        // SNUH 기준에서 쓸 카운트 (vocabulary_counts의 첫 숫자)
        const snuhCount = firstNumber(row.vocabulary_counts);

        const snuhList = Array.isArray(row.mapped_source_codes)
          ? row.mapped_source_codes.filter(Boolean)
          : [];

        return {
          id: row.concept_id || `row-${idx}`,
          conceptId: row.concept_id,
          code: row.concept_id ?? '-',
          name: row.concept_name ?? '-',

          // SNUH 매핑 정보
          snuhId: snuhList[0] ?? '-',
          allSnuhIds: snuhList,
          snuhIdCount: row.vocabulary_counts ?? {},

          // 두 기준의 원천 카운트 모두 보관
          omopCount,
          snuhCount,

          _raw: row,
        };
      });

      setConcepts(mapped);
      setConceptsTotal(Number(total) || 0);
    } catch (e) {
      console.error(e);
      setConcepts([]);
      setConceptsError('Failed to load concepts');
    } finally {
      setConceptsLoading(false);
    }
  }

  // concept 항목 클릭시 상세 그래프 불러오는 api (age, sex)
  async function fetchConceptDetailsFor(item) {
    try {
      setDetailsLoading(true);
      setDetailsError('');

      const domain = apiDomainOf(activeTab);
      const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);
      const key = detailsKeyOf(domain, item.conceptId ?? item.id, cohortIds);

      // 이미 불러온 적 있으면 다시 안 불러옴 (캐시)
      if (detailsByKey[key]) return;

      const conceptId = item.conceptId ?? item.id;
      if (domain === 'measurements') {
        // demographics + values 병렬 호출
        const [demo, values] = await Promise.all([
          getConceptDetails({ domain, conceptId, cohortIds }),
          getMeasurementValues({ conceptId, cohortIds }),
        ]);
        setDetailsByKey((prev) => ({ ...prev, [key]: { ...demo, values } }));
      } else {
        const demo = await getConceptDetails({ domain, conceptId, cohortIds });
        setDetailsByKey((prev) => ({ ...prev, [key]: demo }));
      }
    } catch (e) {
      console.error(e);
      setDetailsError('Failed to load concept details');
    } finally {
      setDetailsLoading(false);
    }
  }

  // 최상단 훅 근처에 추가
  const lastConceptsFetchKeyRef = React.useRef(null);

  // 1) 마운트 시 초기 표시 상태만
  useEffect(() => {
    setHasSearched(true);
  }, []);

  // 2) 코호트 변경 → 요약 갱신 + 페이지 1로 리셋 (컨셉은 여기서 호출하지 않음)
  useEffect(() => {
    setCurrentPage(1);
    refreshSummary(searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohorts]);

  // 3) 탭/페이지/코호트 변경 → 컨셉 리스트 갱신 (중복 가드)
  useEffect(() => {
    const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);
    const fetchKey = JSON.stringify({
      tab: activeTab,
      page: currentPage,
      cohorts: cohortIds,
      // 검색은 버튼(핸들러)에서 직접 호출하므로 키에서 제외
    });

    if (lastConceptsFetchKeyRef.current === fetchKey) return;
    lastConceptsFetchKeyRef.current = fetchKey;

    refreshConcepts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, selectedCohorts]);

  // 4) 선택 아이템/탭/코호트 변경 → 상세 데이터 로드
  useEffect(() => {
    if (!selectedItem) return;
    fetchConceptDetailsFor(selectedItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem, activeTab, selectedCohorts]);

  // 5) 탭 전환 시 리스트 선택/펼침 초기화
  useEffect(() => {
    setSelectedItem(null);
    setExpandedItems(new Set());
  }, [activeTab]);

  // 검색 버튼
  const handleSearch = () => {
    setHasSearched(true);
    setExpandedItems(new Set());
    setCurrentPage(1);
    refreshSummary(searchQuery);
    refreshConcepts();
  };

  const toggleSnuhGroup = (itemId) => {
    setExpandedSnuhGroups((prev) => {
      const n = new Set(prev);
      n.has(itemId) ? n.delete(itemId) : n.add(itemId);
      return n;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 리스트 데이터 가공
  const currentData = (() => {
    const participants = summaryByKey[activeTab]?.participant_count ?? 0;

    // 1) 필터
    let filteredData = concepts;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredData = concepts.filter(
        (item) =>
          (item.name ?? '-').toLowerCase().includes(q) ||
          (item.allSnuhIds || []).some((code) =>
            (code || '').toLowerCase().includes(q),
          ),
      );
    }

    // 2) sortBy 기준으로 count/percentage를 주입
    const enriched = filteredData.map((item) => {
      const count = sortBy === 'snuh' ? item.snuhCount : item.omopCount;
      const percentage =
        participants > 0 && typeof count === 'number'
          ? (count / participants) * 100
          : null;
      return { ...item, count, percentage };
    });

    if (sortBy === 'snuh') {
      // 1) SNUH ID별 "부모 행"을 평평하게 만든다
      const parents = [];
      for (const item of enriched) {
        const allSnuhIds =
          Array.isArray(item.allSnuhIds) && item.allSnuhIds.length
            ? item.allSnuhIds
            : item.snuhId
              ? [item.snuhId]
              : ['-'];

        for (const code of allSnuhIds) {
          const cnt =
            getSnuhCount(item.snuhIdCount, code) || item.snuhCount || 0;
          const perc =
            participants > 0 && typeof cnt === 'number'
              ? (cnt / participants) * 100
              : null;

          parents.push({
            ...item,
            id: `${item.id}::${code}`, // 고유 ID (conceptId + SNUH ID)
            snuhId: code ?? '-',
            allSnuhIds, // related 토글용 전체 묶음 유지
            relatedCount: Math.max(0, allSnuhIds.length - 1),
            count: cnt,
            percentage: perc,
            isParent: true,
            isChild: false,
          });
        }
      }

      // 2) 정렬: % ↓, count ↓, 이름 ↑, snuhId ↑
      parents.sort((a, b) => {
        const ap = a.percentage ?? -1;
        const bp = b.percentage ?? -1;
        if (bp !== ap) return bp - ap;
        if ((b.count ?? -1) !== (a.count ?? -1))
          return (b.count ?? 0) - (a.count ?? 0);
        const nameCmp = (a.name ?? '').localeCompare(b.name ?? '');
        if (nameCmp !== 0) return nameCmp;
        return (a.snuhId ?? '').localeCompare(b.snuhId ?? '');
      });

      // 3) 펼침 상태에 따라 "자식 행"을 바로 뒤에 삽입
      const flattened = [];
      for (const parent of parents) {
        flattened.push(parent);

        const expandKey = `${activeTab}-${parent.id}`;
        const isExpanded = expandedSnuhGroups.has(expandKey);
        if (!isExpanded) continue;

        const childrenCodes = (parent.allSnuhIds || []).filter(
          (c) => c !== parent.snuhId,
        );

        for (let i = 0; i < childrenCodes.length; i++) {
          const code = childrenCodes[i];
          const childCount =
            getSnuhCount(parent.snuhIdCount, code) || parent.count;

          flattened.push({
            isChild: true,
            isParent: false,
            parentId: parent.id,
            childId: `${parent.id}--${code}`,
            id: `${parent.id}--child--${code}`, // 렌더 키 안정화
            name: parent.name,
            code: parent.code,
            snuhId: code,
            allSnuhIds: parent.allSnuhIds, // 정보 유지
            count: childCount, // 요구사항: 부모 분모 그대로/또는 개별 카운트
            percentage:
              participants > 0 && typeof childCount === 'number'
                ? (childCount / participants) * 100
                : null,
            _raw: parent._raw,
          });
        }
      }

      return flattened;
    }

    // OMOP 기본 정렬
    const sorted = [...enriched].sort((a, b) => {
      const ap = a.percentage ?? -1;
      const bp = b.percentage ?? -1;
      if (bp !== ap) return bp - ap;
      if (b.count !== a.count) return b.count - a.count;
      return (a.name ?? '').localeCompare(b.name ?? '');
    });

    return sorted;
  })();

  const totalPages = Math.max(1, Math.ceil((conceptsTotal ?? 0) / searchLimit));
  const startIndex = (currentPage - 1) * searchLimit; // 0-based 시작 인덱스
  const endIndex = startIndex + currentData.length; // 서버가 준 현재 페이지 개수만큼
  const paginatedData = currentData;
  const activeCategory = tabConfig.find((t) => t.key === activeTab);

  return (
    <div className="min-h-screen bg-background">
      <main>
        <CohortHeader
          selectedCohorts={selectedCohorts}
          setSelectedCohorts={setSelectedCohorts}
          type={'DataBrowser'}
        />

        {/* 🔎 검색바 */}
        <section className="">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="mx-auto mb-8 flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search medical concepts, conditions, procedures or SNUH code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="h-12 pl-12"
                  />
                </div>
                <Button onClick={handleSearch} className="h-12 px-8">
                  Search
                </Button>
              </div>

              {/* 탭 */}
              <div className="flex w-full items-center justify-center">
                <div className="grid w-full grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {tabConfig.map((category) => {
                    const Icon = category.icon;
                    const isActive = activeTab === category.key;
                    const sumRow = summaryByKey[category.key];
                    const concepts = sumRow?.concept_count;
                    const participants = sumRow?.participant_count;

                    return (
                      <button
                        key={category.key}
                        onClick={() => {
                          setActiveTab(category.key);
                          setCurrentPage(1);
                        }}
                        className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-lg'
                            : 'border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5 shrink-0" />
                        <div className="text-left">
                          <div className="font-semibold">{category.label}</div>
                          <div className="text-xs opacity-70">
                            {typeof concepts === 'number'
                              ? concepts.toLocaleString()
                              : 0}{' '}
                            concepts
                          </div>
                          <div className="text-xs opacity-70">
                            {typeof participants === 'number'
                              ? participants.toLocaleString()
                              : 0}{' '}
                            participants
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Analytics 섹션 */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8">
              {/* 상단 차트 */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-3 text-2xl font-bold text-foreground">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    {activeCategory?.label} Analytics
                  </h2>
                  <div className="flex items-center gap-3" />
                </div>
                {/* 상단 차트 */}
                <div className="min-w-0 rounded-xl border border-border bg-card p-6">
                  {(() => {
                    const chartData = currentData
                      .filter(
                        (d) =>
                          !d.isChild && typeof d.count === 'number' && d.name,
                      )
                      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
                      .slice(0, 10)
                      .map((d) => ({
                        name: d.name ?? '-',
                        count: d.count, // ← sortBy 반영된 count
                      }));
                    return <TopChart data={chartData} />;
                  })()}
                </div>
              </div>

              {/* 정렬/레이아웃 */}
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2 border-r border-border pr-4">
                  <Button
                    variant={sortBy === 'default' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortBy('default');
                      setCurrentPage(1);
                    }}
                  >
                    OMOP CDM 기준
                  </Button>
                  <Button
                    variant={sortBy === 'snuh' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSortBy('snuh');
                      setCurrentPage(1);
                    }}
                  >
                    SNUH ID 기준
                  </Button>
                </div>
                <div className="flex items-center gap-2 pl-4">
                  <Button
                    variant={layoutMode === 'split' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLayoutMode('split')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                    Split
                  </Button>
                  <Button
                    variant={
                      layoutMode === 'traditional' ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setLayoutMode('traditional')}
                  >
                    <List className="h-4 w-4" />
                    List
                  </Button>
                </div>
              </div>

              {/* 본문 리스트/상세 */}
              {layoutMode === 'split' ? (
                <div className="grid grid-cols-12 gap-6">
                  {/* 리스트 */}
                  <div className="col-span-6">
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                      <div className="border-b border-border bg-muted/30 px-6 py-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          {activeCategory?.label} List
                        </div>
                      </div>

                      {/* split, snuh id 기준 열리는 토글*/}
                      <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
                        {paginatedData.map((item, index) => {
                          if (item.isChild) {
                            return (
                              <div
                                key={item.childId}
                                className="px-6 py-3 transition-colors hover:bg-muted/10"
                              >
                                <div className="box-border flex w-full items-center gap-3">
                                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex min-w-0 items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="flex-shrink-0 text-xs"
                                        >
                                          {item.snuhId}
                                        </Badge>
                                      </div>
                                      <span className="shrink-0 text-right text-sm font-medium text-muted-foreground">
                                        {typeof item.count === 'number'
                                          ? item.count.toLocaleString()
                                          : '-'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const isExpanded = expandedSnuhGroups.has(
                            `${activeTab}-${item.id}`,
                          );
                          const hasRelatedSnuhIds =
                            Array.isArray(item.allSnuhIds) &&
                            item.allSnuhIds.length > 1;

                          return (
                            <div key={item.id}>
                              <div
                                className={`cursor-pointer px-6 py-4 transition-colors ${
                                  selectedItem?.id === item.id
                                    ? 'border-r-4 border-primary bg-primary/10'
                                    : 'hover:bg-muted/20'
                                }`}
                                onClick={() => {
                                  setSelectedItem(item);
                                  fetchConceptDetailsFor(item);
                                }}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-start justify-between">
                                      <div>
                                        <h4 className="mb-1 text-lg font-bold text-foreground">
                                          {startIndex + index + 1}. {item.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {item.code}
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {item.snuhId}
                                          </Badge>
                                          {sortBy === 'snuh' &&
                                            hasRelatedSnuhIds && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleSnuhGroup(
                                                    `${activeTab}-${item.id}`,
                                                  );
                                                }}
                                                className="h-6 px-2"
                                              >
                                                {isExpanded ? (
                                                  <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                  <ChevronRight className="h-3 w-3" />
                                                )}
                                                <span className="ml-1 text-xs">
                                                  {(item.allSnuhIds?.length ||
                                                    1) - 1}{' '}
                                                  related
                                                </span>
                                              </Button>
                                            )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xl font-bold text-primary">
                                          {typeof item.percentage === 'number'
                                            ? item.percentage.toFixed(1)
                                            : '-'}
                                          %
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {typeof item.count === 'number'
                                            ? item.count.toLocaleString()
                                            : '-'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t border-border bg-muted/20 px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-muted-foreground">
                            Showing {currentPage === 0 ? 0 : startIndex + 1}-
                            {Math.min(endIndex, conceptsTotal || 0)} of{' '}
                            {conceptsTotal || 0} items
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="text-sm font-medium">
                              Page {currentPage} of {totalPages}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1),
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 상세 */}
                  <div className="col-span-6">
                    <div className="h-full overflow-hidden rounded-xl border border-border bg-card">
                      {selectedItem ? (
                        <>
                          <div className="border-b border-border bg-muted/30 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-lg font-semibold text-foreground">
                                  {selectedItem.name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Detailed Analytics & Visualization
                                </p>
                              </div>
                              <Badge variant="outline">
                                {selectedItem.code}
                              </Badge>
                            </div>
                          </div>

                          <div
                            className="overflow-y-auto p-6"
                            style={{ maxHeight: 'calc(100vh - 300px)' }}
                          >
                            <div
                              className="rounded-lg bg-muted/10 p-4"
                              style={{ height: '500px' }}
                            >
                              {(() => {
                                const domain = apiDomainOf(activeTab);
                                const cohortIds = selectedCohorts
                                  .map((c) => String(c.id))
                                  .slice(0, 5);
                                const key = detailsKeyOf(
                                  domain,
                                  selectedItem.conceptId ?? selectedItem.id,
                                  cohortIds,
                                );
                                const details = detailsByKey[key];

                                return (
                                  <>
                                    {detailsLoading && !details && (
                                      <div className="mb-3 text-sm text-muted-foreground">
                                        Loading details…
                                      </div>
                                    )}
                                    {detailsError && !details && (
                                      <div className="mb-3 text-sm text-destructive">
                                        {detailsError}
                                      </div>
                                    )}
                                    <DataVisualization
                                      selectedItem={selectedItem}
                                      category={domain}
                                      view={layoutMode}
                                      selectedCohorts={selectedCohorts}
                                      // getDomainConcepts row의 원본을 함께 내려준다
                                      details={
                                        details
                                          ? {
                                              ...details,
                                              concept: selectedItem?._raw,
                                            }
                                          : { concept: selectedItem?._raw }
                                      }
                                    />
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex h-full items-center justify-center p-8">
                          <div className="text-center">
                            <Activity className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold text-foreground">
                              Select an Item
                            </h3>
                            <p className="text-muted-foreground">
                              Click on any item from the list to view detailed
                              analytics and visualizations
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // === List Layout ===
                <div className="space-y-4">
                  {paginatedData.map((item, index) => {
                    if (item.isChild) {
                      return (
                        <div
                          key={item.childId}
                          className="ml-12 overflow-hidden rounded-xl border border-border bg-card"
                        >
                          <div className="p-4">
                            <div className="flex items-center gap-3">
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline">
                                      {item.snuhId}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">
                                      {typeof item.count === 'number'
                                        ? item.count.toLocaleString()
                                        : '-'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (sortBy === 'default' && item.isGrouped) {
                      return (
                        <div
                          className="overflow-hidden rounded-xl border border-border bg-card"
                          key={item.conceptId}
                        >
                          <div className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                                <span className="text-lg font-bold text-primary-foreground">
                                  {startIndex + index + 1}
                                </span>
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="mb-2 flex items-start justify-between">
                                  <div>
                                    <h4 className="mb-2 text-xl font-bold text-foreground">
                                      {item.name}
                                    </h4>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-sm"
                                      >
                                        {item.code}
                                      </Badge>
                                      {item.allSnuhIds.map((snuhId) => (
                                        <Badge
                                          key={snuhId}
                                          variant="secondary"
                                          className="text-sm"
                                        >
                                          {snuhId}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-primary">
                                      {typeof item.percentage === 'number'
                                        ? item.percentage.toFixed(1)
                                        : '-'}
                                      %
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      {typeof item.count === 'number'
                                        ? item.count.toLocaleString()
                                        : '-'}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-6" />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // ✅ 클릭 시 선택된 아이템 상태 변경
                                      setSelectedItem(item);

                                      // ✅ 클릭과 동시에 상세 API 호출 (Age/Sex 그래프용)
                                      fetchConceptDetailsFor(item);

                                      // ✅ 펼침/접힘 상태 토글
                                      setExpandedItems((prev) => {
                                        const n = new Set(prev);
                                        const key = `${activeTab}-${item.id}`;
                                        n.has(key) ? n.delete(key) : n.add(key);
                                        return n;
                                      });
                                    }}
                                    className="flex items-center gap-2"
                                  >
                                    View Analytics
                                    <ChevronDown
                                      className={`h-4 w-4 transition-transform ${
                                        expandedItems.has(
                                          `${activeTab}-${item.conceptId}`,
                                        )
                                          ? 'rotate-180'
                                          : ''
                                      }`}
                                    />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {expandedItems.has(
                              `${activeTab}-${item.conceptId}`,
                            ) && (
                              <div className="mt-6 border-t border-border pt-6">
                                <div className="flex w-full">
                                  <div className="w-full">
                                    <div
                                      className="w-full rounded-lg bg-muted/10 p-4"
                                      style={{ height: '500px' }}
                                    >
                                      <DataVisualization
                                        selectedItem={item}
                                        category={apiDomainOf(activeTab)}
                                        view={layoutMode}
                                        selectedCohorts={selectedCohorts}
                                        details={(() => {
                                          const domain =
                                            activeTab === 'labs-measurements'
                                              ? 'measurements'
                                              : activeTab;
                                          const cohortIds = selectedCohorts
                                            .map((c) => String(c.id))
                                            .slice(0, 5);
                                          const key = `${domain}:${item.conceptId ?? item.id}:${cohortIds.join('|')}`;
                                          const det = detailsByKey[key];
                                          return det
                                            ? { ...det, concept: item?._raw }
                                            : { concept: item?._raw };
                                        })()}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }

                    const isExpanded = expandedSnuhGroups.has(
                      `${activeTab}-${item.id}`,
                    );
                    const hasRelatedSnuhIds =
                      Array.isArray(item.allSnuhIds) &&
                      item.allSnuhIds.length > 1;

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border border-border bg-card"
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                              <span className="text-lg font-bold text-primary-foreground">
                                {startIndex + index + 1}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex items-start justify-between">
                                <div>
                                  <h4 className="mb-2 text-xl font-bold text-foreground">
                                    {item.name}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className="text-sm"
                                    >
                                      {item.code}
                                    </Badge>
                                    <Badge
                                      variant="secondary"
                                      className="text-sm"
                                    >
                                      {item.snuhId}
                                    </Badge>
                                    {sortBy === 'snuh' && hasRelatedSnuhIds && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                          toggleSnuhGroup(
                                            `${activeTab}-${item.id}`,
                                          )
                                        }
                                        className="h-7 px-3"
                                      >
                                        {isExpanded ? (
                                          <ChevronDown className="h-4 w-4" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4" />
                                        )}
                                        <span className="ml-1 text-sm">
                                          {(item.allSnuhIds?.length || 1) - 1}{' '}
                                          related
                                        </span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-primary">
                                    {typeof item.percentage === 'number'
                                      ? item.percentage.toFixed(1)
                                      : '-'}
                                    %
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {typeof item.count === 'number'
                                      ? item.count.toLocaleString()
                                      : '-'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6" />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // 클릭 시 선택된 아이템 상태 변경
                                    setSelectedItem(item);

                                    // 클릭과 동시에 상세 API 호출 (Age/Sex 그래프용)
                                    fetchConceptDetailsFor(item);

                                    // 펼침/접힘 상태 토글
                                    setExpandedItems((prev) => {
                                      const n = new Set(prev);
                                      const key = `${activeTab}-${item.id}`;
                                      n.has(key) ? n.delete(key) : n.add(key);
                                      return n;
                                    });
                                  }}
                                  className="flex items-center gap-2"
                                >
                                  View Analytics
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      expandedItems.has(
                                        `${activeTab}-${item.conceptId}`,
                                      )
                                        ? 'rotate-180'
                                        : ''
                                    }`}
                                  />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {expandedItems.has(`${activeTab}-${item.id}`) && (
                            <div className="mt-6 border-t border-border pt-6">
                              <div className="flex w-full">
                                <div className="w-full">
                                  <div
                                    className="w-full rounded-lg bg-muted/10 p-4"
                                    style={{ height: '500px' }}
                                  >
                                    <DataVisualization
                                      selectedItem={item}
                                      category={apiDomainOf(activeTab)}
                                      view={layoutMode}
                                      selectedCohorts={selectedCohorts}
                                      details={(() => {
                                        const domain =
                                          activeTab === 'labs-measurements'
                                            ? 'measurements'
                                            : activeTab;
                                        const cohortIds = selectedCohorts
                                          .map((c) => String(c.id))
                                          .slice(0, 5);
                                        const key = `${domain}:${item.conceptId ?? item.id}:${cohortIds.join('|')}`;
                                        const det = detailsByKey[key];
                                        return det
                                          ? { ...det, concept: item?._raw }
                                          : { concept: item?._raw };
                                      })()}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {currentPage === 0 ? 0 : startIndex + 1}-
                      {Math.min(endIndex, conceptsTotal || 0)} of{' '}
                      {conceptsTotal || 0} items
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
