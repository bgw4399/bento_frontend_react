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

      const participants = summaryByKey[activeTab]?.participant_count ?? null;
      const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);

      const raw = await getDomainConcepts({
        tabKey: activeTab, // e.g. 'conditions'
        keyword: searchQuery, // 검색창 입력값
        cohortIds,
      });

      // refreshConcepts() 내부 매핑 부분
      // refreshConcepts() 내부
      const toNum = (v) => {
        if (v == null) return 0;
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        if (typeof v === 'string') {
          const n = Number(v.replaceAll(',', ''));
          return Number.isFinite(n) ? n : 0;
        }
        return 0;
      };

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
          row.total_participant_count ?? row.person_count ?? row.count
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

          // 아래 둘은 currentData 단계에서 sortBy에 맞춰 계산할 거라 여기선 채우지 않아도 됨
          // count: (렌더 단계에서 세팅)
          // percentage: (렌더 단계에서 세팅)

          _raw: row,
        };
      });




      setConcepts(mapped);
      setCurrentPage(1);
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

      const data = await getConceptDetails({
        domain,
        conceptId: item.conceptId ?? item.id,
        cohortIds,
      });

      setDetailsByKey((prev) => ({ ...prev, [key]: data }));
    } catch (e) {
      console.error(e);
      setDetailsError('Failed to load concept details');
    } finally {
      setDetailsLoading(false);
    }
  }


  // 최초 + 코호트 변경 시 summary 갱신 후 concepts 동기화
  useEffect(() => {
    refreshSummary(searchQuery);
    setTimeout(() => refreshConcepts(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohorts]);

  // 탭 변경 시 개념 갱신
  useEffect(() => {
    refreshConcepts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 요약 분모가 바뀌면 다시 계산
  const activeParticipants = summaryByKey[activeTab]?.participant_count ?? null;
  useEffect(() => {
    if (activeParticipants !== null) {
      refreshConcepts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeParticipants, activeTab]);

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

  useEffect(() => {
    setHasSearched(true);
  }, []);

  useEffect(() => {
    if (!selectedItem) return;
    fetchConceptDetailsFor(selectedItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCohorts])

  useEffect(() => {
    setSelectedItem(null);
    setExpandedItems(new Set());
  }, [activeTab]);

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
      const flattened = [];
      const sortedParents = [...enriched].sort((a, b) => {
        const ap = a.percentage ?? -1;
        const bp = b.percentage ?? -1;
        if (bp !== ap) return bp - ap;
        if (b.count !== a.count) return b.count - a.count;
        return (a.name ?? '').localeCompare(b.name ?? '');
      });

      for (const parent of sortedParents) {
        const parentKey = `${activeTab}-${parent.id}`;
        const expanded = expandedSnuhGroups.has(parentKey);
        flattened.push({ ...parent, isParent: true, _expanded: expanded });

        if (expanded) {
          // 자식들도 동일 분모로 계산: 여기선 부모의 snuhCount를 그대로 노출(요구사항)
          const children = (parent.allSnuhIds || []).map((code, idx) => ({
            isChild: true,
            parentId: parent.id,
            childId: `${parent.id}-${idx}`,
            snuhId: code,
            count: parent.snuhCount ?? 0, // ← vocabulary_counts 첫 숫자
          }));
          flattened.push(...children);
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

  const totalPages = Math.ceil(currentData.length / searchLimit);
  const startIndex = (currentPage - 1) * searchLimit;
  const endIndex = startIndex + searchLimit;
  const paginatedData = currentData.slice(startIndex, endIndex);
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
                <div className="rounded-xl border border-border bg-card p-6">
                  {(() => {
                    const chartData = currentData
                      .filter((d) => !d.isChild && typeof d.count === 'number' && d.name)
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
                                          {startIndex + index + 1}
                                          . {item.name}
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
                            Showing {startIndex + 1}-
                            {Math.min(endIndex, currentData.length)} of{' '}
                            {currentData.length} items
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
                                const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);
                                const key = detailsKeyOf(domain, selectedItem.conceptId ?? selectedItem.id, cohortIds);
                                const details = detailsByKey[key];

                                return (
                                  <>
                                    {detailsLoading && !details && (
                                      <div className="mb-3 text-sm text-muted-foreground">
                                        Loading details…
                                      </div>
                                    )}
                                    {detailsError && !details && (
                                      <div className="mb-3 text-sm text-destructive">{detailsError}</div>
                                    )}
                                    <DataVisualization
                                      selectedItem={selectedItem}
                                      category={domain}
                                      view={layoutMode}
                                      selectedCohorts={selectedCohorts}
                                      // getDomainConcepts row의 원본을 함께 내려준다
                                      details={details ? { ...details, concept: selectedItem?._raw } : { concept: selectedItem?._raw }}
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
                                    onClick={() =>
                                      setSelectedItem(item) ||
                                      setExpandedItems((prev) => {
                                        const n = new Set(prev);
                                        const key = `${activeTab}-${item.conceptId}`;
                                        n.has(key) ? n.delete(key) : n.add(key);
                                        return n;
                                      })
                                    }
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
                                        category={activeTab === 'labs-measurements' ? 'measurements' : activeTab}
                                        view={layoutMode}
                                        selectedCohorts={selectedCohorts}
                                        // [ADD] 트리 소스: 리스트 행의 원본 row를 내려준다
                                        details={{ concept: item?._raw }}
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
                                {item.isParent ? startIndex + index + 1 : ''}
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
                                  onClick={() =>
                                    setSelectedItem(item) ||
                                    setExpandedItems((prev) => {
                                      const n = new Set(prev);
                                      const key = `${activeTab}-${item.id}`;
                                      n.has(key) ? n.delete(key) : n.add(key);
                                      return n;
                                    })
                                  }
                                  className="flex items-center gap-2"
                                >
                                  View Analytics
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${
                                      expandedItems.has(
                                        `${activeTab}-${item.id}`,
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
                                      category={
                                        activeTab === 'labs-measurements'
                                          ? 'measurements'
                                          : activeTab
                                      }
                                      view={layoutMode}
                                      selectedCohorts={selectedCohorts}
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
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, currentData.length)} of{' '}
                      {currentData.length} items
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
                        disabled={currentPage === totalPages}
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
