'use client';

import React, { useState } from 'react';
import { CohortHeader } from '@/components/Header/DataBrowserHeader.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataVisualization } from './_components/data-visualization.jsx';
import { History, Plus, X } from 'lucide-react';

export default function CustomChartPage() {
  const [selectedCohorts, setSelectedCohorts] = useState([
    {
      id: 1,
      name: 'All Participants',
      description: 'Complete dataset of all participants',
      count: 354400,
    },
  ]);

  const [customChartXAxis, setCustomChartXAxis] = useState('');
  const [customChartYAxis, setCustomChartYAxis] = useState('');
  const [currentChart, setCurrentChart] = useState(null);
  const [chartHistory, setChartHistory] = useState([]);

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
    setCustomChartXAxis(chart.xAxis);
    setCustomChartYAxis(chart.yAxis);
  };

  const deleteHistoryChart = (chartId) => {
    setChartHistory((prev) => prev.filter((c) => c.id !== chartId));
    if (currentChart && currentChart.id === chartId) setCurrentChart(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Custom Chart</h1>
        <p className="text-gray-600">
          Define your own data visualization parameters
        </p>
      </div>

      {/* 공통 헤더 (코호트 선택 + 개요) */}
      <CohortHeader
        selectedCohorts={selectedCohorts}
        setSelectedCohorts={setSelectedCohorts}
      />

      {/* 페이지 본문: Custom Chart */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="mb-6 text-2xl font-bold text-foreground">
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
                        {currentChart.cohort} — {currentChart.xAxis} vs{' '}
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
                        count: selectedCohorts.reduce((s, c) => s + c.count, 0),
                        percentage: 100,
                        description: `Custom chart for ${currentChart.cohort}`,
                      }}
                      view="split"
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
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(chart.timestamp).toLocaleString()}
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
    </div>
  );
}
