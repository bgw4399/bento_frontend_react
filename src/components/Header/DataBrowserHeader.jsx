'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

export function CohortHeader({ selectedCohorts, setSelectedCohorts, type }) {
  const [isCohortModalOpen, setIsCohortModalOpen] = useState(false);

  // 서버 검색/페이징 상태
  const [cohortSearchQuery, setCohortSearchQuery] = useState('');
  const [serverQuery, setServerQuery] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1); // UI 1-based
  const [totalItems, setTotalItems] = useState(0);
  const [cohortList, setCohortList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [isCohortOverviewExpanded, setIsCohortOverviewExpanded] =
    useState(true);
  const [visibleCohortCards, setVisibleCohortCards] = useState(
    new Set(['age', 'sex', 'enrollment']),
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize],
  );

  // ====== 서버 호출 ======
  async function fetchCohorts({ page = 1, limit = pageSize, query = '' } = {}) {
    setLoading(true);
    setFetchError('');
    try {
      // API는 0-based page 사용
      const apiPage = Math.max(0, Number(page) - 1);
      const params = new URLSearchParams();
      params.set('page', String(apiPage));
      params.set('limit', String(limit));
      if (query?.trim()) params.set('query', query.trim());

      const res = await fetch(`${API_URI}/api/cohort?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();

      // 유연 파싱
      const items =
        data?.cohorts ??
        data?.items ??
        (Array.isArray(data) ? data : (data?.data ?? []));
      const total =
        Number(data?.total) ??
        Number(data?.totalElements) ??
        Number(data?.count) ??
        (Array.isArray(items) ? Number(items.length) : 0);
      const effectiveLimit = Number(data?.limit) || limit || 10;

      setCohortList(Array.isArray(items) ? items : []);
      setTotalItems(Number.isFinite(total) ? total : 0);
      setPageSize(effectiveLimit);
    } catch (e) {
      console.error(e);
      setFetchError('Failed to load cohorts.');
      setCohortList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // 모달 열릴 때 최초 로드
  useEffect(() => {
    if (isCohortModalOpen) {
      fetchCohorts({ page: currentPage, limit: pageSize, query: serverQuery });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCohortModalOpen]);

  // 페이지 변경 시
  useEffect(() => {
    if (!isCohortModalOpen) return;
    fetchCohorts({ page: currentPage, limit: pageSize, query: serverQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // 검색 디바운스(300ms)
  useEffect(() => {
    if (!isCohortModalOpen) return;
    const t = setTimeout(() => {
      setCurrentPage(1);
      setServerQuery(cohortSearchQuery);
      fetchCohorts({ page: 1, limit: pageSize, query: cohortSearchQuery });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cohortSearchQuery, isCohortModalOpen]);

  const normalizeCohort = (raw) => {
    const id = raw?.id ?? raw?.cohort_id ?? raw?._id;
    const name = raw?.name ?? `(no name: ${id})`;
    const description = raw?.description ?? '';
    const count =
      Number(raw?.count ?? raw?.size ?? raw?.participants ?? 0) || 0;
    return { id, name, description, count };
  };

  const handleCohortToggle = (raw) => {
    const cohort = normalizeCohort(raw);
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
      n.has(cardId) ? n.delete(cardId) : n.add(cardId);
      return n;
    });
  };

  const totalParticipants = selectedCohorts.reduce(
    (s, c) => s + (c.count || 0),
    0,
  );
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
  const showingFrom =
    totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const showingTo = Math.min(safeCurrentPage * pageSize, totalItems);

  return (
    <section className="border-b border-border bg-gradient-to-b from-blue-50 to-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {type === 'DataBrowser' ? 'Data Browser' : 'CustomChart'}
          </h1>
          <p className="text-gray-600">
            {type === 'DataBrowser'
              ? 'Browse aggregate-level data contributed by All of Us research participants...'
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

            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Select Research Cohorts
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  Select up to 5 cohorts for comparison
                </p>
              </DialogHeader>

              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search cohorts by name/description/author..."
                    value={cohortSearchQuery}
                    onChange={(e) => setCohortSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* List */}
              <div className="max-h-[460px] space-y-3 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center text-muted-foreground">
                    Loading...
                  </div>
                ) : fetchError ? (
                  <div className="p-8 text-center text-red-500">
                    {fetchError}
                  </div>
                ) : cohortList.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No cohorts found
                  </div>
                ) : (
                  cohortList.map((raw) => {
                    const cohort = normalizeCohort(raw);
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
                            onCheckedChange={() => handleCohortToggle(raw)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-semibold text-foreground">
                                {cohort.name}
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {cohort.count?.toLocaleString?.() ?? 0}
                              </Badge>
                            </div>
                            <div className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {cohort.description || 'No description'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {showingFrom}-{showingTo} of {totalItems}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safeCurrentPage === 1 || loading}
                  >
                    Prev
                  </Button>
                  <div className="text-sm font-medium">
                    Page {safeCurrentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={safeCurrentPage === totalPages || loading}
                  >
                    Next
                  </Button>
                </div>
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

        {/* Collapsible overview (기존 그대로) */}
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
