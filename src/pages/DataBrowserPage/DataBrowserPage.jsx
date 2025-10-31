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

const tabConfig = [
  {
    key: 'conditions',
    label: 'Conditions',
    icon: Stethoscope,
    color: 'text-primary',
  },
  {
    key: 'drug-exposures',
    label: 'Drug Exposures',
    icon: Pill,
    color: 'text-accent',
  },
  {
    key: 'labs-measurements',
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
      const toNum = (v) => {
        if (v == null) return 0;
        const n = typeof v === 'string' ? Number(v.replaceAll(',', '')) : v;
        return Number.isFinite(n) ? n : 0;
      };

      const mapped = (raw || []).map((row, idx) => {
        const count = toNum(
          row.total_participant_count ?? row.person_count ?? row.count
        );

        const pct =
          participants && participants > 0 ? (count / participants) * 100 : null;

        const snuhList = Array.isArray(row.mapped_source_codes)
          ? row.mapped_source_codes.filter(Boolean)
          : [];

        return {
          id: row.concept_id || `row-${idx}`,
          conceptId: row.concept_id,
          code: row.concept_id ?? '-',
          name: row.concept_name ?? '-',
          snuhId: snuhList[0] ?? '-',
          allSnuhIds: snuhList,
          count,
          percentage: pct,
          mapped_source_codes: snuhList,
          descendent_concept: row.descendent_concept || [],
          source: row.descendent_concept || [],
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  // 리스트 데이터 가공
  const currentData = (() => {
    const data = concepts;

    // 클라이언트 추가 필터: 이름/SNUH 코드 포함 검색 (description 제거)
    let filteredData = data;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredData = data.filter(
        (item) =>
          (item.name ?? '-').toLowerCase().includes(q) ||
          (item.allSnuhIds || []).some((code) =>
            (code || '').toLowerCase().includes(q),
          ),
      );
    }

    if (sortBy === 'snuh') {
      const flattened = [];
      const sortedParents = [...filteredData].sort((a, b) => {
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
          const children = (parent.allSnuhIds || []).map((code, idx) => ({
            isChild: true,
            parentId: parent.id,
            childId: `${parent.id}-${idx}`,
            snuhId: code,
            count: '-', // 데이터 없음 → 렌더 가드
          }));
          flattened.push(...children);
        }
      }
      return flattened;
    }

    const sorted = [...filteredData].sort((a, b) => {
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
                <div className="rounded-xl border border-border bg-card p-6">
                  {(() => {
                    const chartData = concepts
                      .filter((d) => typeof d.count === 'number' && d.name)
                      .sort((a, b) => (b.count ?? 0) - (a.count ?? 0))
                      .slice(0, 10)
                      .map((d) => ({
                        name: d.name ?? '-',
                        count: d.count,
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
                                onClick={() => setSelectedItem(item)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-start justify-between">
                                      <div>
                                        <h4 className="mb-1 text-lg font-bold text-foreground">
                                          {item.isParent
                                            ? startIndex + index + 1
                                            : ''}
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
                              <DataVisualization
                                selectedItem={selectedItem}
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
