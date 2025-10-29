'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Database,
  Pill,
  FlaskConical,
  Stethoscope,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataVisualization } from '../CustomChartPage/_components/data-visualization.jsx';
import { TopChart } from './_components/top-chart.jsx';
import { CohortHeader } from '../../components/Header/DataBrowserHeader.jsx';
import { getDomainSummary } from '@/api/data-browser/domain-summary.js';

// ====== MOCKS ======
const mockSearchResults = {
  conditions: [
    {
      id: 1,
      conceptId: 4865,
      name: 'Pain',
      code: 'R52',
      snuhId: 'SNUH-C001',
      count: 284400,
      percentage: 80.25,
      description:
        'General pain conditions affecting various body systems - Primary source',
    },
    {
      id: 101,
      conceptId: 4865,
      name: 'Pain',
      code: 'R52',
      snuhId: 'SNUH-C002',
      count: 280500,
      percentage: 79.15,
      description:
        'General pain conditions affecting various body systems - Secondary source',
    },
    {
      id: 102,
      conceptId: 4865,
      name: 'Pain',
      code: 'R52',
      snuhId: 'SNUH-C003',
      count: 275600,
      percentage: 77.77,
      description:
        'General pain conditions affecting various body systems - Tertiary source',
    },
    {
      id: 2,
      conceptId: 8889,
      name: 'Metabolic disease',
      code: 'E88.9',
      snuhId: 'SNUH-C004',
      count: 267800,
      percentage: 75.6,
      description:
        'Disorders affecting metabolism and biochemical processes - Primary source',
    },
    {
      id: 201,
      conceptId: 8889,
      name: 'Metabolic disease',
      code: 'E88.9',
      snuhId: 'SNUH-C005',
      count: 265200,
      percentage: 74.87,
      description:
        'Disorders affecting metabolism and biochemical processes - Secondary source',
    },
    {
      id: 3,
      conceptId: 2200,
      name: 'Mass of body structure',
      code: 'R22',
      snuhId: 'SNUH-C006',
      count: 251200,
      percentage: 70.9,
      description:
        'Abnormal masses or growths in body structures - Primary source',
    },
    {
      id: 301,
      conceptId: 2200,
      name: 'Mass of body structure',
      code: 'R22',
      snuhId: 'SNUH-C007',
      count: 248900,
      percentage: 70.25,
      description:
        'Abnormal masses or growths in body structures - Secondary source',
    },
    {
      id: 4,
      conceptId: 9900,
      name: 'Disorder due to infection',
      code: 'B99',
      snuhId: 'SNUH-C008',
      count: 234600,
      percentage: 66.2,
      description:
        'Medical conditions caused by infectious agents - Primary source',
    },
    {
      id: 401,
      conceptId: 9900,
      name: 'Disorder due to infection',
      code: 'B99',
      snuhId: 'SNUH-C009',
      count: 232100,
      percentage: 65.49,
      description:
        'Medical conditions caused by infectious agents - Secondary source',
    },
    {
      id: 402,
      conceptId: 9900,
      name: 'Disorder due to infection',
      code: 'B99',
      snuhId: 'SNUH-C010',
      count: 229800,
      percentage: 64.84,
      description:
        'Medical conditions caused by infectious agents - Tertiary source',
    },
    {
      id: 5,
      conceptId: 1000,
      name: 'Hypertension',
      code: 'I10',
      snuhId: 'SNUH-C011',
      count: 198700,
      percentage: 56.1,
      description: 'High blood pressure affecting cardiovascular system',
    },
    {
      id: 6,
      conceptId: 1100,
      name: 'Type 2 Diabetes',
      code: 'E11',
      snuhId: 'SNUH-C012',
      count: 176500,
      percentage: 49.8,
      description: 'Metabolic disorder affecting glucose regulation',
    },
  ].sort((a, b) => b.percentage - a.percentage),
  'drug-exposures': [
    {
      id: 1,
      conceptId: 6809,
      name: 'Metformin',
      code: 'RxNorm:6809',
      snuhId: 'SNUH-D001',
      count: 187500,
      percentage: 52.95,
      description:
        'First-line medication for type 2 diabetes treatment - 500mg formulation',
    },
    {
      id: 101,
      conceptId: 6809,
      name: 'Metformin',
      code: 'RxNorm:6809',
      snuhId: 'SNUH-D002',
      count: 185200,
      percentage: 52.3,
      description:
        'First-line medication for type 2 diabetes treatment - 1000mg formulation',
    },
    {
      id: 2,
      conceptId: 29046,
      name: 'Lisinopril',
      code: 'RxNorm:29046',
      snuhId: 'SNUH-D003',
      count: 142300,
      percentage: 40.15,
      description:
        'ACE inhibitor used to treat high blood pressure - 10mg tablet',
    },
    {
      id: 201,
      conceptId: 29046,
      name: 'Lisinopril',
      code: 'RxNorm:29046',
      snuhId: 'SNUH-D004',
      count: 140100,
      percentage: 39.53,
      description:
        'ACE inhibitor used to treat high blood pressure - 20mg tablet',
    },
    {
      id: 3,
      conceptId: 83367,
      name: 'Atorvastatin',
      code: 'RxNorm:83367',
      snuhId: 'SNUH-D005',
      count: 118900,
      percentage: 33.55,
      description: 'Statin medication for cholesterol management',
    },
  ].sort((a, b) => b.percentage - a.percentage),
  'labs-measurements': [
    {
      id: 1,
      conceptId: 84806,
      name: 'Systolic Blood Pressure',
      code: 'LOINC:8480-6',
      snuhId: 'SNUH-M001',
      count: 256900,
      percentage: 72.5,
      description:
        'Measurement of blood pressure during heart contraction - Automated method',
    },
    {
      id: 101,
      conceptId: 84806,
      name: 'Systolic Blood Pressure',
      code: 'LOINC:8480-6',
      snuhId: 'SNUH-M002',
      count: 254600,
      percentage: 71.85,
      description:
        'Measurement of blood pressure during heart contraction - Manual method',
    },
    {
      id: 2,
      conceptId: 45484,
      name: 'Hemoglobin A1c',
      code: 'LOINC:4548-4',
      snuhId: 'SNUH-M003',
      count: 223400,
      percentage: 63.05,
      description:
        'Blood test measuring average glucose levels over 2-3 months',
    },
  ].sort((a, b) => b.percentage - a.percentage),
  procedures: [
    {
      id: 1,
      conceptId: 77057,
      name: 'Mammography',
      code: 'CPT:77057',
      snuhId: 'SNUH-P001',
      count: 123400,
      percentage: 34.85,
      description:
        'X-ray examination of the breast for cancer screening - Screening type',
    },
    {
      id: 101,
      conceptId: 77057,
      name: 'Mammography',
      code: 'CPT:77057',
      snuhId: 'SNUH-P002',
      count: 121800,
      percentage: 34.39,
      description:
        'X-ray examination of the breast for cancer screening - Diagnostic type',
    },
    {
      id: 2,
      conceptId: 93306,
      name: 'Echocardiography',
      code: 'CPT:93306',
      snuhId: 'SNUH-P003',
      count: 89200,
      percentage: 25.2,
      description: 'Ultrasound examination of the heart',
    },
  ].sort((a, b) => b.percentage - a.percentage),
};

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

// 초기 선택(부모에서 상태만 필요)
const mockCohorts = [
  {
    id: 1,
    name: 'All Participants',
    description: 'Complete dataset of all participants',
    count: 354400,
  },
  {
    id: 2,
    name: 'Adult Cohort (18-65)',
    description: 'Participants aged 18 to 65 years',
    count: 287500,
  },
  {
    id: 3,
    name: 'Senior Cohort (65+)',
    description: 'Participants aged 65 and older',
    count: 89200,
  },
  {
    id: 4,
    name: 'Pediatric Cohort (<18)',
    description: 'Participants under 18 years old',
    count: 12300,
  },
  {
    id: 5,
    name: 'Diabetes Cohort',
    description: 'Participants with diabetes diagnosis',
    count: 45600,
  },
  {
    id: 6,
    name: 'Cardiovascular Cohort',
    description: 'Participants with heart conditions',
    count: 67800,
  },
];

// ====== PAGE ======
export default function MedicalDataBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('target'); // "target" | "source"
  const [searchLimit, setSearchLimit] = useState(50);
  const [hasSearched, setHasSearched] = useState(true);
  const [activeTab, setActiveTab] = useState('conditions');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCohorts, setSelectedCohorts] = useState([mockCohorts[0]]);
  const [layoutMode, setLayoutMode] = useState('split'); // "split" | "traditional"
  const [selectedItem, setSelectedItem] = useState(null);

  const [sortBy, setSortBy] = useState('default'); // "default" | "snuh"
  const [currentPage, setCurrentPage] = useState(1);

  const [expandedSnuhGroups, setExpandedSnuhGroups] = useState(new Set());

  const [summary, setSummary] = useState([]); // API 결과 원본
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // 탭 키 → summary row 매핑
  const summaryByKey = useMemo(() => {
    const map = {};
    for (const row of summary) {
      if (row && row._tab_key) map[row._tab_key] = row;
    }
    return map;
  }, [summary]);

  async function refreshSummary(optionalKeyword) {
    try {
      setSummaryLoading(true);
      setSummaryError('');
      const cohortIds = selectedCohorts.map((c) => String(c.id)).slice(0, 5);
      const data = await getDomainSummary({
        keyword: optionalKeyword,
        cohortIds,
      });
      setSummary(data);
    } catch (e) {
      console.error(e);
      setSummary([]);
      setSummaryError('Failed to load domain summary');
    } finally {
      setSummaryLoading(false);
    }
  }

  // 최초 로드 & 코호트 변경 시 갱신
  useEffect(() => {
    refreshSummary(searchQuery); // keyword는 사실상 옵션이지만 붙여줌
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCohorts]);

  // Search 버튼 누를 때 요약도 갱신
  const handleSearch = () => {
    setHasSearched(true);
    setExpandedItems(new Set());
    setCurrentPage(1);
    refreshSummary(searchQuery);
  };

  const toggleSnuhGroup = (itemId) => {
    setExpandedSnuhGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  useEffect(() => {
    setHasSearched(true);
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const currentData = (() => {
    const data = mockSearchResults[activeTab];

    let filteredData = data;
    if (searchQuery.trim()) {
      filteredData = data.filter((item) => {
        if (searchTarget === 'target') {
          return (
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
        } else {
          return item.snuhId.toLowerCase().includes(searchQuery.toLowerCase());
        }
      });
    }

    if (sortBy === 'snuh') {
      const flattenedData = [];
      const sortedData = [...filteredData].sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.description.localeCompare(b.description);
      });

      sortedData.forEach((item) => {
        flattenedData.push({ ...item, isParent: true });

        if (expandedSnuhGroups.has(`${activeTab}-${item.id}`)) {
          const relatedItems = filteredData.filter(
            (relatedItem) =>
              relatedItem.conceptId === item.conceptId &&
              relatedItem.id !== item.id,
          );

          relatedItems.forEach((relatedItem) => {
            flattenedData.push({
              ...relatedItem,
              isChild: true,
              parentId: item.id,
              childId: `${item.id}-${relatedItem.id}`,
            });
          });
        }
      });
      return flattenedData;
    }

    // default: OMOP 그룹화
    const groupedByConceptId = new Map();
    filteredData.forEach((item) => {
      if (!groupedByConceptId.has(item.conceptId))
        groupedByConceptId.set(item.conceptId, []);
      groupedByConceptId.get(item.conceptId).push(item);
    });

    const groupedData = Array.from(groupedByConceptId.values()).map((items) => {
      const totalCount = items.reduce((sum, item) => sum + item.count, 0);
      const avgPercentage =
        items.reduce((sum, item) => sum + item.percentage, 0) / items.length;
      const allSnuhIds = items.map((item) => item.snuhId);

      return {
        ...items[0],
        count: totalCount,
        percentage: avgPercentage,
        allSnuhIds,
        groupedItems: items,
        isGrouped: true,
      };
    });

    return groupedData.sort((a, b) => b.percentage - a.percentage);
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

        {/* 🔎 검색바 + Analyze */}
        <section className="">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <div className="mx-auto mb-8 flex gap-4">
                <div className="flex items-center gap-2">
                  <Select
                    value={searchTarget}
                    onValueChange={(v) => setSearchTarget(v)}
                  >
                    <SelectTrigger className="h-full w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="target">OMOP CDM</SelectItem>
                      <SelectItem value="source">SNUH ID</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder={
                      searchTarget === 'target'
                        ? 'Search medical concepts, conditions, procedures...'
                        : 'Search by SNUH ID...'
                    }
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

                    // 값이 없으면 그대로 '-' 출력
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
                  <div className="flex items-center gap-3"></div>
                </div>
                <div className="rounded-xl border border-border bg-card p-6">
                  <TopChart data={mockSearchResults[activeTab]} />
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

                                  {/* 가운데 영역: 폭 제한 + 수축 허용 */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                      {/* 왼쪽(배지 + 텍스트) */}
                                      <div className="flex min-w-0 items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="flex-shrink-0 text-xs"
                                        >
                                          {item.snuhId}
                                        </Badge>

                                        <span className="block truncate text-sm text-foreground">
                                          {item.description}
                                        </span>
                                      </div>

                                      {/* 오른쪽 숫자: 줄어들지 않게 */}
                                      <span className="shrink-0 text-right text-sm font-medium text-muted-foreground">
                                        {item.count.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (sortBy === 'default' && item.isGrouped) {
                            return (
                              <div key={item.conceptId}>
                                <div
                                  className={`cursor-pointer px-6 py-4 transition-colors ${
                                    selectedItem?.conceptId === item.conceptId
                                      ? 'border-r-4 border-primary bg-primary/10'
                                      : 'hover:bg-muted/20'
                                  }`}
                                  onClick={() => setSelectedItem(item)}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 flex items-start justify-between">
                                      <div>
                                        <h4 className="mb-1 text-lg font-bold text-foreground">
                                          {startIndex + index + 1}. {item.name}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {item.code}
                                          </Badge>
                                          {item.allSnuhIds.map((snuhId) => (
                                            <Badge
                                              key={snuhId}
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              {snuhId}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xl font-bold text-primary">
                                          {item.percentage.toFixed(1)}%
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {item.count.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>

                                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const isExpanded = expandedSnuhGroups.has(
                            `${activeTab}-${item.id}`,
                          );
                          const relatedSnuhIds = mockSearchResults[
                            activeTab
                          ].filter(
                            (relatedItem) =>
                              relatedItem.conceptId === item.conceptId &&
                              relatedItem.id !== item.id,
                          );
                          const hasRelatedSnuhIds = relatedSnuhIds.length > 0;

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
                                                  {relatedSnuhIds.length}{' '}
                                                  related
                                                </span>
                                              </Button>
                                            )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xl font-bold text-primary">
                                          {item.percentage}%
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {item.count.toLocaleString()}
                                        </div>
                                      </div>
                                    </div>

                                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                      {item.description}
                                    </p>
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
                                    <span className="font-medium text-foreground">
                                      {item.description}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">
                                      {item.count.toLocaleString()}
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
                                    <div className="text-2xl font-bold text-primary">
                                      {item.percentage.toFixed(1)}%
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground">
                                      {item.count.toLocaleString()}
                                    </div>
                                  </div>
                                </div>

                                <p className="mb-4 leading-relaxed text-muted-foreground">
                                  {item.description}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-6"></div>

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
                                      className={`h-4 w-4 transition-transform ${expandedItems.has(`${activeTab}-${item.conceptId}`) ? 'rotate-180' : ''}`}
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
                    const relatedSnuhIds = mockSearchResults[activeTab].filter(
                      (relatedItem) =>
                        relatedItem.conceptId === item.conceptId &&
                        relatedItem.id !== item.id,
                    );
                    const hasRelatedSnuhIds = relatedSnuhIds.length > 0;

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
                                          {relatedSnuhIds.length} related
                                        </span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-primary">
                                    {item.percentage}%
                                  </div>
                                  <div className="mt-1 text-sm text-muted-foreground">
                                    {item.count.toLocaleString()}
                                  </div>
                                </div>
                              </div>

                              <p className="mb-4 leading-relaxed text-muted-foreground">
                                {item.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6"></div>

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
                                    className={`h-4 w-4 transition-transform ${expandedItems.has(`${activeTab}-${item.id}`) ? 'rotate-180' : ''}`}
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
