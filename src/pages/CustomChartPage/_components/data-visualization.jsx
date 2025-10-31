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

/* ===============================
   더미(measurements values) – 기존 그대로 유지
================================ */
const measurementValuesData = [
  { range: '< 100', male: 1200, female: 1400, other: 100, total: 2700 },
  { range: '100-120', male: 2100, female: 2300, other: 200, total: 4600 },
  { range: '120-140', male: 1800, female: 2000, other: 150, total: 3950 },
  { range: '140-160', male: 1400, female: 1600, other: 120, total: 3120 },
  { range: '> 160', male: 900, female: 1100, other: 80, total: 2080 },
];

const measurementUnits = [
  'inch (US)',
  'centimeter',
  'Inches',
  'per minute',
  'pound (US)',
  'times',
  'meter',
  'inch (international)',
  'no value',
  'foot (international)',
  'kilogram',
  'No unit',
];

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
                                    details, // ← 상위에서 내려주는 demographics
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
  const [selectedChart, setSelectedChart] = useState('sex');

  /* ===============================
     Sources용 트리 상태
  ================================= */
  const [sourceTree, setSourceTree] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);

  // measurements values 탭용
  const [selectedUnit, setSelectedUnit] = useState('inch (US)');

  // category 제한: 주로 conditions/procedures에서 유효(요구사항 기반)
  const hasSourceSubconcepts = true;

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
    // selectedItem._raw 에서 루트/트리 생성
    const raw = selectedItem?._raw;
    if (!raw) {
      setSourceTree(null);
      setSelectedTreeNode(null);
      setExpandedNodes(new Set());
      return;
    }

    // 루트는 선택된 컨셉(현재 행) 자체
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
     Sources 트리 UI
  ================================= */
  const TreeNodeComponent = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.name);
    const isSelected = selectedTreeNode && selectedTreeNode.name === node.name;

    const toggleExpand = () => {
      const next = new Set(expandedNodes);
      isExpanded ? next.delete(node.name) : next.add(node.name);
      setExpandedNodes(next);
    };

    const handleSelect = () => setSelectedTreeNode(node);

    return (
      <div>
        <div
          className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-accent/50 ${
            isSelected ? 'bg-accent' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={handleSelect}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              className="flex h-4 w-4 items-center justify-center p-0"
            >
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
    // measurements 값 분포 (더미)
    if (selectedChart === 'values' && category === 'measurements') {
      const maleData = measurementValuesData.map((d) => ({
        range: d.range,
        count: d.male,
      }));
      const femaleData = measurementValuesData.map((d) => ({
        range: d.range,
        count: d.female,
      }));
      const otherData = measurementValuesData.map((d) => ({
        range: d.range,
        count: d.other,
      }));

      const totalMale = maleData.reduce((s, d) => s + d.count, 0);
      const totalFemale = femaleData.reduce((s, d) => s + d.count, 0);
      const totalOther = otherData.reduce((s, d) => s + d.count, 0);

      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 border-b-0 border-t border-border pb-0 pt-4">
            {measurementUnits.map((unit) => (
              <Button
                key={unit}
                variant={selectedUnit === unit ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedUnit(unit)}
                className="text-xs"
              >
                {unit}
              </Button>
            ))}
          </div>

          <div
            className={
              view === 'split'
                ? 'flex w-full flex-col gap-4'
                : 'flex w-full gap-4'
            }
          >
            {/* Male */}
            <Card className="w-full border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">
                  Male - {totalMale.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={maleData}
                      layout="horizontal"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: 'Participant Count',
                          position: 'insideBottom',
                          offset: -5,
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="range"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: selectedUnit,
                          angle: -90,
                          position: 'insideLeft',
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                                <p className="text-xs font-medium text-card-foreground">
                                  {data.range}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.count.toLocaleString()}
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
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Female */}
            <Card className="w-full border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">
                  Female - {totalFemale.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={femaleData}
                      layout="horizontal"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: 'Participant Count',
                          position: 'insideBottom',
                          offset: -5,
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="range"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: selectedUnit,
                          angle: -90,
                          position: 'insideLeft',
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                                <p className="text-xs font-medium text-card-foreground">
                                  {data.range}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.count.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-2))"
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Other */}
            <Card className="w-full border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-card-foreground">
                  Other - {totalOther.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={otherData}
                      layout="horizontal"
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                      />
                      <XAxis
                        type="number"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: 'Participant Count',
                          position: 'insideBottom',
                          offset: -5,
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="range"
                        fontSize={9}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        label={{
                          value: selectedUnit,
                          angle: -90,
                          position: 'insideLeft',
                          style: {
                            fontSize: 10,
                            fill: 'hsl(var(--muted-foreground))',
                          },
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                                <p className="text-xs font-medium text-card-foreground">
                                  {data.range}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {data.count.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="count"
                        fill="hsl(var(--chart-3))"
                        radius={[0, 3, 3, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
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
            <div className="h-[300px]">
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
            <div className="h-[300px]">
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

    // Sources (← 여기 실제 데이터 연동)
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
        <div className={view === 'split' ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-4'}>
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
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                              <p className="font-medium text-card-foreground">{data.name}</p>
                              <p className="text-sm text-muted-foreground">{(data.count ?? 0).toLocaleString()} participants</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} />
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
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {getChartOptions().map((option) => (
          <Button
            key={option.key}
            variant={selectedChart === option.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedChart(option.key);
            }}
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
