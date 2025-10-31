'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.js';
import { Button } from '@/components/ui/button.js';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge.js';

/* ===============================
   공유 유틸
================================ */
const toNum = (v) => {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = Number(v.replaceAll(',', ''));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

/** vocabulary_counts 객체를 [{name, count}] 배열로 변환 */
const entriesFromVocab = (vocab) => {
  if (!vocab || typeof vocab !== 'object') return [];
  return Object.entries(vocab)
    .map(([name, val]) => ({ name, count: toNum(val) }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count);
};

/** descendent_concept 트리를 {name,count,_vocab,children[]}로 변환 */
const buildTreeFromRow = (row) => {
  if (!row) return null;
  const name = row.concept_name ?? '-';
  const count =
    toNum(row.total_participant_count ?? row.person_count ?? row.count);
  const vocab = row.vocabulary_counts ?? {};
  const childrenRaw = Array.isArray(row.descendent_concept)
    ? row.descendent_concept
    : [];

  return {
    name,
    count,
    _vocab: vocab,
    children: childrenRaw.map(buildTreeFromRow),
  };
};

// --- Values 정규화 유틸 ---
const normalizeValuesResponse = (valuesObj = {}) => {
  const byKey = {};
  const keys = Object.keys(valuesObj || {});
  for (const key of keys) {
    const rows = Array.isArray(valuesObj[key]) ? valuesObj[key] : [];
    const units = new Set();
    const byUnit = {};
    for (const r of rows) {
      const unit = r.unit_name ?? 'No unit';
      const gender = r.gender_name ?? 'Unknown';
      const range = r.range_label ?? '-';
      const cnt = toNum(r.total_participant_count);

      units.add(unit);
      byUnit[unit] = byUnit[unit] || { ranges: new Map() };
      const bucket =
        byUnit[unit].ranges.get(range) || { byGender: new Map(), total: 0 };
      bucket.byGender.set(gender, (bucket.byGender.get(gender) || 0) + cnt);
      bucket.total += cnt;
      byUnit[unit].ranges.set(range, bucket);
    }
    byKey[key] = { units, byUnit };
  }
  return { keys, byKey };
};

// 범위 라벨 오름차순(숫자 시작값 기준 추정) 정렬
const sortRanges = (arr) =>
  [...arr].sort((a, b) => {
    const pa = parseInt(String(a).split(/[^0-9]/)[0], 10);
    const pb = parseInt(String(b).split(/[^0-9]/)[0], 10);
    if (isNaN(pa) && isNaN(pb)) return String(a).localeCompare(String(b));
    if (isNaN(pa)) return 1;
    if (isNaN(pb)) return -1;
    return pa - pb;
  });

/* ===============================
   색상 팔레트
================================ */
const cohortColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function DataVisualization({
                                    selectedItem,
                                    category = 'conditions',
                                    view = 'split',
                                    selectedCohorts = [],
                                    details, // demographics + (measurements values)
                                    loading = false,
                                    error = '',
                                  }) {
  const demographics = details?.demographics;

  /* ===============================
     차트 탭 구성
  ================================= */
  const getChartOptions = () => {
    if (category === 'measurements') {
      return [
        { key: 'values', label: 'Values' },
        { key: 'age', label: 'Age' },
        { key: 'sex', label: 'Sex' },
        { key: 'sources', label: 'Sources' },
      ];
    } else if (category === 'drug-exposures') {
      return [
        { key: 'age', label: 'Age' },
        { key: 'sex', label: 'Sex' },
        { key: 'sources', label: 'Sources' },
      ];
    } else {
      return [
        { key: 'age', label: 'Age' },
        { key: 'sex', label: 'Sex' },
        { key: 'sources', label: 'Sources' },
      ];
    }
  };

  const chartOptions = getChartOptions();
  const defaultChart = category === 'measurements' ? 'values' : 'age';
  const [selectedChart, setSelectedChart] = useState(defaultChart);
  useEffect(() => setSelectedChart(defaultChart), [defaultChart, selectedItem]);

  /* ===============================
     라벨/정렬 유틸
  ================================= */
  const cohortLabel = (key) => {
    if (key === 'all') return 'All';
    const found = selectedCohorts.find((c) => String(c.id) === String(key));
    return found?.name ?? String(key);
  };

  const sortAgeBuckets = (obj = {}) =>
    Object.keys(obj).sort((a, b) => {
      const pa = parseInt(a.split('-')[0], 10);
      const pb = parseInt(b.split('-')[0], 10);
      return (isNaN(pa) ? 9999 : pa) - (isNaN(pb) ? 9999 : pb);
    });

  /* ===============================
     Measurements: Values 탭 상태
     (조건부 훅 금지 → 항상 상단에서 선언)
  ================================= */
  const valuesObj = details?.values || null;
  const normalizedValues = useMemo(
    () => (valuesObj ? normalizeValuesResponse(valuesObj) : { keys: [], byKey: {} }),
    [valuesObj],
  );

  // 코호트 키들
  const cohortKeys = normalizedValues.keys || [];

  // 유닛 목록: 모든 코호트의 유닛 **합집합**
  const units = useMemo(() => {
    if (!valuesObj) return [];
    const set = new Set();
    for (const k of cohortKeys) {
      const node = normalizedValues.byKey?.[k];
      if (!node) continue;
      for (const u of node.units || []) set.add(u);
    }
    const arr = Array.from(set);
    return arr.length ? arr : ['No unit'];
  }, [normalizedValues, cohortKeys, valuesObj]);

  const [selectedUnit, setSelectedUnit] = useState(units[0]);
  useEffect(() => {
    if (!units.includes(selectedUnit)) setSelectedUnit(units[0]);
  }, [units, selectedUnit]);

  // Values: 코호트들을 한 번에 보여주는 데이터(범위=X, 인원수=Y, 코호트=시리즈)
  const valuesCombinedRows = useMemo(() => {
    if (!valuesObj) return [];
    // 모든 코호트에서 선택 유닛의 range 합집합
    const rangesSet = new Set();
    for (const k of cohortKeys) {
      const unitNode = normalizedValues.byKey?.[k]?.byUnit?.[selectedUnit];
      if (!unitNode) continue;
      for (const r of unitNode.ranges.keys()) rangesSet.add(r);
    }
    const ranges = sortRanges(Array.from(rangesSet));

    // 각 range 행에 코호트별 total 채우기
    const rows = ranges.map((range) => {
      const row = { name: range };
      for (let i = 0; i < cohortKeys.length; i++) {
        const k = cohortKeys[i];
        const node = normalizedValues.byKey?.[k]?.byUnit?.[selectedUnit];
        const total = node?.ranges?.get(range)?.total ?? 0;
        row[cohortLabel(k)] = toNum(total);
      }
      return row;
    });
    return rows;
  }, [valuesObj, normalizedValues, cohortKeys, selectedUnit]);

  /* ===============================
     Sources용 트리 상태
  ================================= */
  const [sourceTree, setSourceTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);

  /* ===============================
     로딩/에러
  ================================= */
  if (loading) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-muted-foreground">
        Loading demographics...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-[320px] items-center justify-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  /* ===============================
     Demographics → Recharts 변환
  ================================= */
  const buildSexSeries = () => {
    if (!demographics) return null;
    const groups = Object.keys(demographics);
    const sexCats = new Set();
    groups.forEach((g) => {
      const sexObj = demographics[g]?.sex || {};
      Object.keys(sexObj).forEach((k) => sexCats.add(k));
    });
    const categories = Array.from(sexCats);
    return categories.map((cat) => {
      const row = { name: cat };
      groups.forEach((g) => {
        row[cohortLabel(g)] = Number(demographics[g]?.sex?.[cat] ?? 0);
      });
      return row;
    });
  };

  const buildAgeSeries = () => {
    if (!demographics) return null;
    const groups = Object.keys(demographics);
    const ageKeySet = new Set();
    groups.forEach((g) => {
      const ageObj = demographics[g]?.age || {};
      Object.keys(ageObj).forEach((k) => ageKeySet.add(k));
    });
    const orderedAges = sortAgeBuckets(
      Object.fromEntries(Array.from(ageKeySet).map((k) => [k, 1])),
    );
    return orderedAges.map((bucket) => {
      const row = { name: bucket };
      groups.forEach((g) => {
        row[cohortLabel(g)] = Number(demographics[g]?.age?.[bucket] ?? 0);
      });
      return row;
    });
  };

  /* ===============================
     Sources 트리 만들기 (selectedItem 변경 시)
  ================================= */
  useEffect(() => {
    const raw = selectedItem?._raw;
    if (!raw) {
      setSourceTree(null);
      setSelectedTreeNode(null);
      setExpandedNodes(new Set());
      return;
    }

    const root = buildTreeFromRow({
      concept_name: selectedItem?.name ?? raw?.concept_name ?? '-',
      total_participant_count:
        selectedItem?.omopCount ??
        raw?.total_participant_count ??
        raw?.person_count ??
        raw?.count,
      vocabulary_counts: raw?.vocabulary_counts ?? {},
      descendent_concept: Array.isArray(raw?.descendent_concept)
        ? raw.descendent_concept
        : [],
    });

    setSourceTree(root);
    setSelectedTreeNode(root);
    setExpandedNodes(new Set([root?.name].filter(Boolean)));
  }, [selectedItem]);

  /* ===============================
     Sources 트리 UI (복구)
  ================================= */
  const TreeNodeComponent = ({ node, level = 0 }) => {
    if (!node) return null;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.name);
    const isSelected = selectedTreeNode && selectedTreeNode.name === node.name;

    const toggleExpand = (e) => {
      e.stopPropagation();
      const next = new Set(expandedNodes);
      isExpanded ? next.delete(node.name) : next.add(node.name);
      setExpandedNodes(next);
    };

    return (
      <div>
        <div
          onClick={() => setSelectedTreeNode(node)}
          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-accent/50 ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          {hasChildren ? (
            <button className="flex h-4 w-4 items-center justify-center p-0" onClick={toggleExpand}>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-4" />
          )}
          <span className="flex-1 text-sm text-foreground">{node.name}</span>
          <Badge variant="secondary" className="text-xs">
            {toNum(node.count).toLocaleString()}
          </Badge>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child, idx) => (
              <TreeNodeComponent
                key={`${child.name}-${idx}`}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ===============================
     Sources 차트 데이터
  ================================= */
  const getSourceChartData = () => {
    if (!selectedTreeNode) return [];
    const entries = entriesFromVocab(selectedTreeNode._vocab);
    return entries.length > 0
      ? entries
      : [{ name: 'No source breakdown', count: 0 }];
  };

  /* ===============================
     메인 렌더러
  ================================= */
  const renderChart = () => {
    // --- Values (코호트 다중 시리즈, 범위=X, 인원=Y) ---
    if (selectedChart === 'values' && category === 'measurements') {
      if (!valuesObj || cohortKeys.length === 0) {
        return (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Values</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                No value distribution to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            </CardContent>
          </Card>
        );
      }

      const rows = valuesCombinedRows;

      return (
        <div className="space-y-4">
          {/* 유닛 선택 */}
          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <Button
                key={u}
                variant={selectedUnit === u ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedUnit(u)}
                className="text-xs"
              >
                {u}
              </Button>
            ))}
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-card-foreground">Values</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Cohort-wise distribution ({selectedUnit})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-w-0 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rows}
                    margin={{ top: 10, right: 10, left: 0, bottom: 28 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      label={{
                        value: 'Participant Count',
                        angle: -90,
                        position: 'insideLeft',
                        style: {
                          fontSize: 10,
                          fill: 'hsl(var(--muted-foreground))',
                        },
                      }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                              <p className="mb-2 font-medium text-card-foreground">
                                {label}
                              </p>
                              {payload.map((entry, idx) => (
                                <p key={idx} className="text-sm text-muted-foreground">
                                  {entry.name}: {Number(entry.value).toLocaleString()}
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {cohortKeys.map((k, idx) => (
                      <Bar
                        key={k}
                        dataKey={cohortLabel(k)}
                        fill={cohortColors[idx % cohortColors.length]}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Sex
    if (selectedChart === 'sex') {
      const transformedData = buildSexSeries();
      if (!transformedData || transformedData.length === 0) {
        return (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Sex</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                No demographic data to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            </CardContent>
          </Card>
        );
      }

      const groups = Object.keys(demographics || {});

      return (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Sex</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Gender breakdown across {groups.length} cohort
              {groups.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="mb-2 font-medium text-card-foreground">
                              {payload[0].payload.name}
                            </p>
                            {payload.map((entry, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                {entry.name}:{' '}
                                {Number(entry.value).toLocaleString()}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {(groups.length ? groups : ['All']).map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={cohortLabel(key)}
                      fill={cohortColors[index % cohortColors.length]}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Age
    if (selectedChart === 'age') {
      const transformedData = buildAgeSeries();
      if (!transformedData || transformedData.length === 0) {
        return (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Age</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                No demographic data to display
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            </CardContent>
          </Card>
        );
      }

      const groups = Object.keys(demographics || {});

      return (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Age</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Age groups across {groups.length} cohort
              {groups.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="min-w-0 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={transformedData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="name"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <p className="mb-2 font-medium text-card-foreground">
                              Age {payload[0].payload.name}
                            </p>
                            {payload.map((entry, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                {entry.name}:{' '}
                                {Number(entry.value).toLocaleString()}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  {(groups.length ? groups : ['All']).map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={cohortLabel(key)}
                      fill={cohortColors[index % cohortColors.length]}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Sources
    if (selectedChart === 'sources') {
      if (!sourceTree) {
        return (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Sources</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                No descendent concepts to display.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            </CardContent>
          </Card>
        );
      }

      const chartData = getSourceChartData();

      return (
        <div
          className={view === 'split' ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-4'}
        >
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">Sources</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {selectedTreeNode
                  ? `Distribution for ${selectedTreeNode.name}`
                  : 'Select a concept to view distribution'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-w-0 h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                    />
                    <XAxis
                      dataKey="name"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                              <p className="font-medium text-card-foreground">
                                {data.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {(data.count ?? 0).toLocaleString()} participants
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--chart-1))"
                      radius={[3, 3, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-card-foreground">
                Count Breakdown (Tree)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] overflow-y-auto">
                <TreeNodeComponent node={sourceTree} />
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  /* ===============================
     렌더
  ================================= */
  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-wrap gap-2">
        {chartOptions.map((option) => (
          <Button
            key={option.key}
            variant={selectedChart === option.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedChart(option.key)}
            className={
              selectedChart === option.key
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : ''
            }
          >
            {option.label}
          </Button>
        ))}
      </div>
      {renderChart()}
    </div>
  );
}
