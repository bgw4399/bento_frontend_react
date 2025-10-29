'use client';

import { useState } from 'react';
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

const sexData = [
  { name: 'Female', value: 52, count: 8240, color: 'hsl(var(--chart-1))' },
  { name: 'Male', value: 46, count: 7290, color: 'hsl(var(--chart-2))' },
  { name: 'Other/Unknown', value: 2, count: 320, color: 'hsl(var(--chart-3))' },
];

const ageData = [
  { name: '18-30', value: 15, count: 2378 },
  { name: '31-45', value: 28, count: 4438 },
  { name: '46-60', value: 32, count: 5072 },
  { name: '61-75', value: 20, count: 3170 },
  { name: '76+', value: 5, count: 793 },
];

const sourceData = [
  { name: 'Electronic Health Records', value: 45, count: 7137 },
  { name: 'Claims Data', value: 30, count: 4755 },
  { name: 'Patient Surveys', value: 15, count: 2378 },
  { name: 'Clinical Trials', value: 7, count: 1109 },
  { name: 'Wearable Devices', value: 3, count: 475 },
];

const sourceSubconcepts = {
  'Electronic Health Records': [
    { name: 'Inpatient Records', count: 3212, percentage: 45 },
    { name: 'Outpatient Records', count: 2498, percentage: 35 },
    { name: 'Emergency Department', count: 1427, percentage: 20 },
  ],
  'Claims Data': [
    { name: 'Medicare Claims', count: 2377, percentage: 50 },
    { name: 'Private Insurance', count: 1902, percentage: 40 },
    { name: 'Medicaid Claims', count: 476, percentage: 10 },
  ],
  'Patient Surveys': [
    { name: 'Quality of Life', count: 1189, percentage: 50 },
    { name: 'Symptom Tracking', count: 832, percentage: 35 },
    { name: 'Satisfaction Surveys', count: 357, percentage: 15 },
  ],
};

const measurementValuesData = [
  { range: '< 100', male: 1200, female: 1400, other: 100, total: 2700 },
  { range: '100-120', male: 2100, female: 2300, other: 200, total: 4600 },
  { range: '120-140', male: 1800, female: 2000, other: 150, total: 3950 },
  { range: '140-160', male: 1400, female: 1600, other: 120, total: 3120 },
  { range: '> 160', male: 900, female: 1100, other: 80, total: 2080 },
];

const sourceTreeData = {
  name: 'Pain',
  count: 284400,
  code: 'SNOMED: 22253000',
  children: [
    {
      name: 'Pain finding at anatomical site',
      count: 280580,
      children: [
        {
          name: 'Pain of truncal structure',
          count: 236600,
          children: [
            {
              name: 'Abdominal pain',
              count: 143080,
              children: [
                {
                  name: 'Upper abdominal pain',
                  count: 64100,
                  children: [
                    {
                      name: 'Epigastric pain',
                      count: 41960,
                      children: [
                        { name: 'Burning epigastric pain', count: 40 },
                        { name: 'Right upper quadrant pain', count: 27000 },
                        { name: 'Left upper quadrant pain', count: 11200 },
                      ],
                    },
                  ],
                },
                { name: 'Lower abdominal pain', count: 52160 },
                { name: 'Right sided abdominal pain', count: 45120 },
                { name: 'Abdominal wall pain', count: 44960 },
                { name: 'Central abdominal pain', count: 44920 },
                { name: 'Left sided abdominal pain', count: 31740 },
                { name: 'Generalized abdominal pain', count: 29960 },
                { name: 'Abdominal wind pain', count: 11460 },
                { name: 'Pain of uterus', count: 10320 },
                { name: 'Renal pain', count: 3460 },
                { name: 'Abdominal colic', count: 420 },
                { name: 'Ovarian pain', count: 380 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

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
}) {
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
      // conditions and procedures
      return [
        { key: 'age', label: 'Age' },
        { key: 'sex', label: 'Sex' },
        { key: 'sources', label: 'Sources' },
      ];
    }
  };

  const chartOptions = getChartOptions();
  const [selectedChart, setSelectedChart] = useState('sex');
  const [selectedSourceSubconcept, setSelectedSourceSubconcept] =
    useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set(['Pain']));
  const [selectedTreeNode, setSelectedTreeNode] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('inch (US)');

  const hasSourceSubconcepts =
    category === 'conditions' || category === 'procedures';

  const TreeNodeComponent = ({ node, level = 0 }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.name);
    const isSelected = selectedTreeNode && selectedTreeNode.name === node.name;

    const toggleExpand = () => {
      const newExpanded = new Set(expandedNodes);
      if (isExpanded) {
        newExpanded.delete(node.name);
      } else {
        newExpanded.add(node.name);
      }
      setExpandedNodes(newExpanded);
    };

    const handleSelect = () => {
      setSelectedTreeNode(node);
    };

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
            {node.count.toLocaleString()}
          </Badge>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children.map((child, index) => (
              <TreeNodeComponent
                key={`${child.name}-${index}`}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getSourceChartData = () => {
    if (!selectedTreeNode) return [];
    const sources = [
      { name: 'SNOMED', count: Math.floor(selectedTreeNode.count * 0.45) },
      { name: 'ICD10CM-1', count: Math.floor(selectedTreeNode.count * 0.25) },
      { name: 'ICD9CM-1', count: Math.floor(selectedTreeNode.count * 0.2) },
      { name: 'ICD10CM-2', count: Math.floor(selectedTreeNode.count * 0.08) },
      { name: 'CIEL-1144', count: Math.floor(selectedTreeNode.count * 0.02) },
    ];
    return sources;
  };

  const renderChart = () => {
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

      const totalMale = maleData.reduce((sum, d) => sum + d.count, 0);
      const totalFemale = femaleData.reduce((sum, d) => sum + d.count, 0);
      const totalOther = otherData.reduce((sum, d) => sum + d.count, 0);

      return (
        <div className="space-y-4">
          {/* Unit selection buttons */}
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

          {/* Three separate graphs */}
          <div
            className={
              view === 'split'
                ? 'flex w-full flex-col gap-4'
                : 'flex w-full gap-4'
            }
          >
            {/* Male Graph */}
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

            {/* Female Graph */}
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

            {/* Other Graph */}
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

    if (selectedChart === 'sex') {
      const transformedData = sexData.map((sexItem) => {
        const dataPoint = { name: sexItem.name };
        selectedCohorts.forEach((cohort, index) => {
          const cohortCount = Math.floor((cohort.count * sexItem.value) / 100);
          dataPoint[cohort.name] = cohortCount;
        });
        return dataPoint;
      });

      return (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Sex</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Gender breakdown across {selectedCohorts.length} cohort
              {selectedCohorts.length > 1 ? 's' : ''}
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
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                className="text-sm text-muted-foreground"
                              >
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
                  {selectedCohorts.map((cohort, index) => (
                    <Bar
                      key={cohort.id}
                      dataKey={cohort.name}
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

    if (selectedChart === 'age') {
      const transformedData = ageData.map((ageItem) => {
        const dataPoint = { name: ageItem.name };
        selectedCohorts.forEach((cohort, index) => {
          const cohortCount = Math.floor((cohort.count * ageItem.value) / 100);
          dataPoint[cohort.name] = cohortCount;
        });
        return dataPoint;
      });

      return (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Age</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Age groups across {selectedCohorts.length} cohort
              {selectedCohorts.length > 1 ? 's' : ''}
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
                            {payload.map((entry, index) => (
                              <p
                                key={index}
                                className="text-sm text-muted-foreground"
                              >
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
                  {selectedCohorts.map((cohort, index) => (
                    <Bar
                      key={cohort.id}
                      dataKey={cohort.name}
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

    if (selectedChart === 'sources') {
      if (hasSourceSubconcepts) {
        const chartData = getSourceChartData();

        return (
          <div
            className={
              view === 'split'
                ? 'flex flex-col gap-4'
                : 'grid grid-cols-2 gap-4'
            }
          >
            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground">
                  Sources
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {selectedTreeNode
                    ? `Distribution for ${selectedTreeNode.name}`
                    : 'Select a concept to view distribution'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedTreeNode ? (
                  <div className="h-[300px]">
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
                          label={{
                            value: 'Participant Count',
                            angle: -90,
                            position: 'insideLeft',
                            style: {
                              fontSize: 11,
                              fill: 'hsl(var(--muted-foreground))',
                            },
                          }}
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
                                    {data.count.toLocaleString()} participants
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
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                    Select a concept from the tree to view its source
                    distribution
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground">
                  Count Breakdown (SNOMED)
                </CardTitle>
                {selectedTreeNode && selectedTreeNode.code && (
                  <CardDescription className="text-xs text-muted-foreground">
                    {selectedTreeNode.code}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[300px] overflow-y-auto">
                  <TreeNodeComponent node={sourceTreeData} />
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">
              Sources
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Individual health records often contain medical information that
              means the same thing but may be recorded in many different ways.
              The sources represent the many different ways that the standard
              medical concept returned in the search results has been recorded
              in patient records. The sources bar chart provides the top 10
              source concepts from the All of Us data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sourceData}
                  layout="horizontal"
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    type="number"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    width={150}
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
                              {data.value}% ({data.count.toLocaleString()}{' '}
                              records)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-4))"
                    radius={[0, 3, 3, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {chartOptions.map((option) => (
          <Button
            key={option.key}
            variant={selectedChart === option.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setSelectedChart(option.key);
              setSelectedSourceSubconcept(null);
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
