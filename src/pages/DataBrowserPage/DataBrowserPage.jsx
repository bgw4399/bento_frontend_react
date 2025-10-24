'use client';

import { useState, useEffect } from 'react';
import {
  Search,
  Database,
  Pill,
  FlaskConical,
  Stethoscope,
  ChevronDown,
  Users,
  Info,
  Activity,
  TrendingUp,
  Filter,
  Zap,
  Grid3X3,
  List,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Plus,
  History,
  Trash2,
  ChevronUp,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DataVisualization } from '../CustomChartPage/_components/data-visualization.jsx';
import { TopChart } from './_components/top-chart.jsx';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const tabConfig = [
  {
    key: 'conditions',
    label: 'Conditions',
    icon: Stethoscope,
    color: 'text-primary',
    concepts: 28475,
    participants: 354400,
    tooltip:
      'Medical conditions, diseases, and diagnoses recorded in patient records',
  },
  {
    key: 'drug-exposures',
    label: 'Drug Exposures',
    icon: Pill,
    color: 'text-accent',
    concepts: 33233,
    participants: 334180,
    tooltip:
      'Medications, prescriptions, and pharmaceutical treatments administered to patients',
  },
  {
    key: 'labs-measurements',
    label: 'Measurements',
    icon: FlaskConical,
    color: 'text-primary',
    concepts: 22457,
    participants: 356320,
    tooltip: 'Laboratory test results, vital signs, and clinical measurements',
  },
  {
    key: 'procedures',
    label: 'Procedures',
    icon: Database,
    color: 'text-accent',
    concepts: 34220,
    participants: 332320,
    tooltip:
      'Medical procedures, surgeries, and clinical interventions performed',
  },
];

const mockDataOptions = [
  { value: 'age', label: 'Age Distribution' },
  { value: 'sex', label: 'Sex Distribution' },
  { value: 'bmi', label: 'BMI' },
  { value: 'blood_pressure', label: 'Blood Pressure' },
  { value: 'cholesterol', label: 'Cholesterol Levels' },
  { value: 'glucose', label: 'Glucose Levels' },
  { value: 'heart_rate', label: 'Heart Rate' },
  { value: 'weight', label: 'Weight' },
];

export default function MedicalDataBrowser() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTarget, setSearchTarget] = useState('target'); // "target" | "source"
  const [searchLimit, setSearchLimit] = useState(50);
  const [hasSearched, setHasSearched] = useState(true);
  const [activeTab, setActiveTab] = useState('conditions');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [selectedCohorts, setSelectedCohorts] = useState([mockCohorts[0]]);
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortSearchQuery, setCohortSearchQuery] = useState('');
  const [layoutMode, setLayoutMode] = useState('split'); // "split" | "traditional"
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [sortBy, setSortBy] = useState('default'); // "default" | "snuh"
  const [currentPage, setCurrentPage] = useState(1);

  const [customChartCohort, setCustomChartCohort] = useState('');
  const [customChartXAxis, setCustomChartXAxis] = useState('');
  const [customChartYAxis, setCustomChartYAxis] = useState('');
  const [currentChart, setCurrentChart] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);

  const [mainTab, setMainTab] = useState('content'); // "content" | "custom"

  const [isCohortOverviewExpanded, setIsCohortOverviewExpanded] =
    useState(true);
  const [visibleCohortCards, setVisibleCohortCards] = useState(
    new Set(['age', 'sex', 'enrollment']),
  );

  const [expandedSnuhGroups, setExpandedSnuhGroups] = useState(new Set());

  const toggleCohortCard = (cardId) => {
    setVisibleCohortCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) newSet.delete(cardId);
      else newSet.add(cardId);
      return newSet;
    });
  };

  useEffect(() => {
    setHasSearched(true);
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setExpandedItems(new Set());
    setCurrentPage(1);
  };

  const toggleItemExpansion = (itemId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) newExpanded.delete(itemId);
    else newExpanded.add(itemId);
    setExpandedItems(newExpanded);
  };

  const toggleSnuhGroup = (itemId) => {
    setExpandedSnuhGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) newSet.delete(itemId);
      else newSet.add(itemId);
      return newSet;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleCohortToggle = (cohort) => {
    setSelectedCohorts((prev) => {
      const isSelected = prev.some((c) => c.id === cohort.id);
      if (isSelected) return prev.filter((c) => c.id !== cohort.id);
      if (prev.length >= 5) return prev;
      return [...prev, cohort];
    });
  };

  const handleCohortRemove = (cohortId) => {
    setSelectedCohorts((prev) => prev.filter((c) => c.id !== cohortId));
  };

  const filteredCohorts = mockCohorts.filter(
    (cohort) =>
      cohort.name.toLowerCase().includes(cohortSearchQuery.toLowerCase()) ||
      cohort.description
        .toLowerCase()
        .includes(cohortSearchQuery.toLowerCase()),
  );

  const totalParticipants = selectedCohorts.reduce(
    (sum, cohort) => sum + cohort.count,
    0,
  );
  const activeCategory = tabConfig.find((t) => t.key === activeTab);

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

  const handleGenerateCustomChart = () => {
    if (selectedCohorts.length > 0 && customChartXAxis && customChartYAxis) {
      const cohortNames = selectedCohorts.map((c) => c.name).join(', ');
      const newChart = {
        id: Date.now().toString(),
        cohort: cohortNames,
        xAxis: customChartXAxis,
        yAxis: customChartYAxis,
        timestamp: new Date(),
      };
      setCurrentChart(newChart);
      setChartHistory((prev) => [newChart, ...prev]);
    }
  };

  const loadHistoryChart = (chart) => {
    setCurrentChart(chart);
    setCustomChartCohort(chart.cohort);
    setCustomChartXAxis(chart.xAxis);
    setCustomChartYAxis(chart.yAxis);
  };

  const deleteHistoryChart = (chartId) => {
    setChartHistory((prev) => prev.filter((c) => c.id !== chartId));
    if (currentChart && currentChart.id === chartId) setCurrentChart(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Data Disclaimer
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              This medical research platform contains synthetic data for
              demonstration purposes only. The data presented here is not
              derived from real patient records and should not be used for
              clinical decision-making or medical research.
            </p>
            <p>
              All participant counts, medical codes, and statistical information
              are simulated to showcase the platform's capabilities. Real-world
              implementation would require proper data governance, privacy
              controls, and regulatory compliance.
            </p>
            <p className="font-medium text-foreground">
              For actual medical research, please consult with qualified
              healthcare professionals and use validated datasets from
              authorized sources.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <main>
        <section className="border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-center justify-between">
              <Dialog
                open={isCohortModalOpen}
                onOpenChange={setIsCohortModalOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-card px-6 py-6 text-lg"
                  >
                    <Filter className="mr-2 h-5 w-5" />
                    {selectedCohorts.length === 1
                      ? selectedCohorts[0].name
                      : `${selectedCohorts.length} Cohorts Selected`}
                    <ChevronDown className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      Select Research Cohorts
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      Select up to 5 cohorts for comparison
                    </p>
                  </DialogHeader>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                      <Input
                        placeholder="Search cohorts..."
                        value={cohortSearchQuery}
                        onChange={(e) => setCohortSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="max-h-96 space-y-3 overflow-y-auto">
                    {filteredCohorts.length > 0 ? (
                      filteredCohorts.map((cohort) => {
                        const isSelected = selectedCohorts.some(
                          (c) => c.id === cohort.id,
                        );
                        const isDisabled =
                          !isSelected && selectedCohorts.length >= 5;
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
                                onCheckedChange={() =>
                                  handleCohortToggle(cohort)
                                }
                                className="mt-1"
                              />
                              <div className="flex-1">
                                <div className="font-semibold text-foreground">
                                  {cohort.name}
                                </div>
                                <div className="mt-1 text-sm text-muted-foreground">
                                  {cohort.description}
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-sm font-medium text-primary">
                                  <Users className="h-3 w-3" />
                                  {cohort.count.toLocaleString()} participants
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                        No cohorts found matching "{cohortSearchQuery}"
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {totalParticipants.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedCohorts.length > 1 && (
              <div className="mb-6 flex flex-wrap gap-2">
                {selectedCohorts.map((cohort) => (
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
                {isCohortOverviewExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>

              {isCohortOverviewExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        <div className="p-4">
                          <div className="space-y-3">
                            {[
                              { range: '18-30', percentage: 15 },
                              { range: '31-45', percentage: 28 },
                              { range: '46-60', percentage: 32 },
                              { range: '61-75', percentage: 20 },
                              { range: '76+', percentage: 5 },
                            ].map((item) => (
                              <div key={item.range}>
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {item.range} years
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {selectedCohorts.map((cohort, index) => {
                                    const cohortCount = Math.floor(
                                      (cohort.count * item.percentage) / 100,
                                    );
                                    const cohortPercentage = item.percentage;
                                    const colors = [
                                      'bg-chart-1',
                                      'bg-chart-2',
                                      'bg-chart-3',
                                      'bg-chart-4',
                                      'bg-chart-5',
                                    ];
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
                                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                            style={{
                                              width: `${cohortPercentage}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="w-20 text-right text-xs text-muted-foreground">
                                          {cohortCount.toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

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
                        <div className="p-4">
                          <div className="space-y-3">
                            {[
                              { sex: 'Female', percentage: 52 },
                              { sex: 'Male', percentage: 46 },
                              { sex: 'Other/Unknown', percentage: 2 },
                            ].map((item) => (
                              <div key={item.sex}>
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {item.sex}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {selectedCohorts.map((cohort, index) => {
                                    const cohortCount = Math.floor(
                                      (cohort.count * item.percentage) / 100,
                                    );
                                    const cohortPercentage = item.percentage;
                                    const colors = [
                                      'bg-chart-1',
                                      'bg-chart-2',
                                      'bg-chart-3',
                                      'bg-chart-4',
                                      'bg-chart-5',
                                    ];
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
                                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                            style={{
                                              width: `${cohortPercentage}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="w-20 text-right text-xs text-muted-foreground">
                                          {cohortCount.toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {visibleCohortCards.has('enrollment') && (
                      <div className="rounded-xl border-2 border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                        <div className="flex items-center justify-between border-b border-border p-4">
                          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Enrollment Timeline
                          </h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleCohortCard('enrollment')}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="p-4">
                          <div className="space-y-3">
                            {[
                              { year: '2020', percentage: 15 },
                              { year: '2021', percentage: 25 },
                              { year: '2022', percentage: 30 },
                              { year: '2023', percentage: 20 },
                              { year: '2024', percentage: 10 },
                            ].map((item) => (
                              <div key={item.year}>
                                <div className="mb-1 flex items-center justify-between">
                                  <span className="text-sm font-medium">
                                    {item.year}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  {selectedCohorts.map((cohort, index) => {
                                    const cohortCount = Math.floor(
                                      (cohort.count * item.percentage) / 100,
                                    );
                                    const cohortPercentage = item.percentage;
                                    const colors = [
                                      'bg-chart-1',
                                      'bg-chart-2',
                                      'bg-chart-3',
                                      'bg-chart-4',
                                      'bg-chart-5',
                                    ];
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
                                            className={`h-full ${colors[index % colors.length]} rounded-full transition-all`}
                                            style={{
                                              width: `${cohortPercentage}%`,
                                            }}
                                          />
                                        </div>
                                        <span className="w-20 text-right text-xs text-muted-foreground">
                                          {cohortCount.toLocaleString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <Tabs
                value={mainTab}
                onValueChange={(v) => setMainTab(v)}
                className="w-full"
              >
                <TabsList className="mx-auto grid h-16 w-full max-w-2xl grid-cols-2">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-3 text-lg font-semibold"
                  >
                    <BarChart3 className="h-6 w-6" />
                    Data Browser
                  </TabsTrigger>
                  <TabsTrigger
                    value="custom"
                    className="flex items-center gap-3 text-lg font-semibold"
                  >
                    <Plus className="h-6 w-6" />
                    Custom Chart
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {mainTab === 'content' && (
              <>
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                    Data Browser
                  </h1>
                  <p className="text-muted-foreground">
                    {activeCategory?.concepts.toLocaleString()} concepts for
                    this domain
                  </p>
                </div>

                <div className="mx-auto mb-4 flex max-w-4xl gap-4">
                  <div className="flex items-center gap-2">
                    <Select
                      value={searchTarget}
                      onValueChange={(v) => setSearchTarget(v)}
                    >
                      <SelectTrigger className="h-full w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="target">기본 (Target)</SelectItem>
                        <SelectItem value="source">SNUH ID (Source)</SelectItem>
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
                    <Zap className="mr-2 h-5 w-5" />
                    Analyze
                  </Button>
                </div>
              </>
            )}

            {mainTab === 'custom' && (
              <div className="mx-auto max-w-4xl">
                <div className="mb-8 text-center">
                  <h1 className="mb-2 text-3xl font-bold text-foreground lg:text-4xl">
                    Create Custom Chart
                  </h1>
                  <p className="text-muted-foreground">
                    Define your own data visualization parameters
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {mainTab === 'content' && (
          <section className="border-b border-border">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <div className="mb-4 flex items-center justify-center">
                  <div className="flex items-center space-x-8 overflow-x-auto">
                    {tabConfig.map((category) => {
                      const Icon = category.icon;
                      const isActive = activeTab === category.key;
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
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <div className="text-left">
                            <div className="font-semibold">
                              {category.label}
                            </div>
                            <div className="text-xs opacity-70">
                              {category.concepts.toLocaleString()} concepts
                            </div>
                            <div className="text-xs opacity-70">
                              {category.participants.toLocaleString()}{' '}
                              participants
                            </div>
                          </div>
                          <div className="group relative">
                            <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-xs -translate-x-1/2 transform whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                              {category.tooltip}
                              <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 border-r border-border pr-4">
                    <Button
                      variant={sortBy === 'default' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSortBy('default');
                        setCurrentPage(1);
                      }}
                    >
                      기본
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
            </div>
          </section>
        )}

        {mainTab === 'content' && (
          <section className="py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="space-y-8">
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

                {layoutMode === 'split' ? (
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-6">
                      <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <div className="border-b border-border bg-muted/30 px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            {activeCategory?.label} List
                            <div className="group relative">
                              <Info className="h-4 w-4 opacity-50 hover:opacity-100" />
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 max-w-xs -translate-x-1/2 transform whitespace-nowrap rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                                Click any item to view detailed analytics
                                <div className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2 transform border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="max-h-[600px] divide-y divide-border overflow-y-auto">
                          {paginatedData.map((item, index) => {
                            if (item.isChild) {
                              return (
                                <div
                                  key={item.childId}
                                  className="px-6 py-3 pl-16 transition-colors hover:bg-muted/10"
                                >
                                  <div className="flex items-center gap-3">
                                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {item.snuhId}
                                          </Badge>
                                          <span className="truncate text-sm text-foreground">
                                            {item.description}
                                          </span>
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">
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
                                    <div className="flex items-center gap-4">
                                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                                        <span className="text-sm font-bold text-primary-foreground">
                                          {startIndex + index + 1}
                                        </span>
                                      </div>

                                      <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-start justify-between">
                                          <div>
                                            <h4 className="mb-1 text-lg font-bold text-foreground">
                                              {item.name}
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

                                        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                                          {item.description}
                                        </p>
                                      </div>
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
                                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
                                      <span className="text-sm font-bold text-primary-foreground">
                                        {item.isParent
                                          ? startIndex + index + 1
                                          : ''}
                                      </span>
                                    </div>

                                    <div className="min-w-0 flex-1">
                                      <div className="mb-2 flex items-start justify-between">
                                        <div>
                                          <h4 className="mb-1 text-lg font-bold text-foreground">
                                            {item.name}
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

                                      <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
                                    <span className="text-lg font-bold text-muted-foreground">
                                      {item.count.toLocaleString()} participants
                                    </span>
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
                                        toggleItemExpansion(
                                          `${activeTab}-${item.conceptId}`,
                                        )
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
                                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    <div className="lg:col-span-2">
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
                      const relatedSnuhIds = mockSearchResults[
                        activeTab
                      ].filter(
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
                                      {sortBy === 'snuh' &&
                                        hasRelatedSnuhIds && (
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
                                      toggleItemExpansion(
                                        `${activeTab}-${item.id}`,
                                      )
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
        )}
      </main>

      {mainTab === 'custom' && (
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="mb-6 flex items-center gap-3 text-2xl font-bold text-foreground">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Chart Configuration
                  </h2>

                  <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="x-axis-input">X-Axis Data</Label>
                      <Input
                        id="x-axis-input"
                        placeholder="Enter X-axis data..."
                        value={customChartXAxis}
                        onChange={(e) => setCustomChartXAxis(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="y-axis-input">Y-Axis Data</Label>
                      <Input
                        id="y-axis-input"
                        placeholder="Enter Y-axis data..."
                        value={customChartYAxis}
                        onChange={(e) => setCustomChartYAxis(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateCustomChart}
                    disabled={
                      selectedCohorts.length === 0 ||
                      !customChartXAxis ||
                      !customChartYAxis
                    }
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Chart
                  </Button>
                </div>

                {currentChart && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          Current Chart
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {currentChart.cohort} - {currentChart.xAxis} vs{' '}
                          {currentChart.yAxis}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentChart(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div
                      className="rounded-lg bg-muted/10 p-6"
                      style={{ height: '500px' }}
                    >
                      <DataVisualization
                        selectedItem={{
                          name: `${currentChart.xAxis} vs ${currentChart.yAxis}`,
                          code: 'CUSTOM',
                          count: 354400,
                          percentage: 100,
                          description: `Custom chart for ${currentChart.cohort}`,
                        }}
                        view={layoutMode}
                        selectedCohorts={selectedCohorts}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-6 rounded-xl border border-border bg-card p-6">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                    <History className="h-5 w-5 text-primary" />
                    Chart History
                  </h3>

                  {chartHistory.length > 0 ? (
                    <div className="max-h-[600px] space-y-3 overflow-y-auto">
                      {chartHistory.map((chart) => (
                        <div
                          key={chart.id}
                          className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                            currentChart && currentChart.id === chart.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                          onClick={() => loadHistoryChart(chart)}
                        >
                          <div className="mb-2 flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-semibold text-foreground">
                                {chart.cohort}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {chart.xAxis} vs {chart.yAxis}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteHistoryChart(chart.id);
                              }}
                              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {chart.timestamp.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <History className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-50" />
                      <p className="text-sm text-muted-foreground">
                        No chart history yet
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Generate charts to see them here
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
