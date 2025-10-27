'use client';

import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';

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

export function CohortHeader({ selectedCohorts, setSelectedCohorts, type }) {
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);
  const [cohortSearchQuery, setCohortSearchQuery] = useState('');
  const [isCohortOverviewExpanded, setIsCohortOverviewExpanded] =
    useState(true);
  const [visibleCohortCards, setVisibleCohortCards] = useState(
    new Set(['age', 'sex', 'enrollment']),
  );

  const filteredCohorts = useMemo(() => {
    const q = cohortSearchQuery.toLowerCase();
    return mockCohorts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q),
    );
  }, [cohortSearchQuery]);

  const totalParticipants = selectedCohorts.reduce((s, c) => s + c.count, 0);

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

  const toggleCohortCard = (cardId) => {
    setVisibleCohortCards((prev) => {
      const n = new Set(prev);
      if (n.has(cardId)) n.delete(cardId);
      else n.add(cardId);
      return n;
    });
  };

  return (
    <section className="border-b border-border bg-gradient-to-b from-primary/5 to-accent/5">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {type === 'DataBrowser' ? 'Data Browser' : 'CustomChart'}
          </h1>
          <p className="text-gray-600">
            {type === 'DataBrowser'
              ? 'Browse aggregate-level data contributed by All of Us research\n' +
                '            participants. Data are derived from multiple data sources. To\n' +
                '            protect participant privacy, we have removed personal identifiers,\n' +
                '            rounded aggregate data to counts of 20, and only included summary\n' +
                '            demographic information. Individual-level data are available for\n' +
                '            analysis in the Researcher Workbench.'
              : 'Define your own data visualization parameters'}
          </p>
        </div>

        {/* Top bar: Cohort picker + total */}
        <div className="mb-6 flex items-center justify-between">
          <Dialog open={isCohortModalOpen} onOpenChange={setIsCohortModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-card px-6 py-6 text-lg">
                <Search className="mr-2 h-5 w-5" />
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
                            onCheckedChange={() => handleCohortToggle(cohort)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {cohort.name}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              {cohort.description}
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
        </div>

        {/* Selected cohort badges */}
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

        {/* Collapsible overview shared on both pages */}
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
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Age card */}
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
                    <div className="space-y-3 p-4">
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
                                      style={{ width: `${item.percentage}%` }}
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
                )}

                {/* Sex card */}
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
                    <div className="space-y-3 p-4">
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
                                      style={{ width: `${item.percentage}%` }}
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
                )}

                {/* Enrollment card */}
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
                    <div className="space-y-3 p-4">
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
                                      style={{ width: `${item.percentage}%` }}
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
