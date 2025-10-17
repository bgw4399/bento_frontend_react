import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer.jsx';
import LoadingComponent from '../../components/LoadingComponent.jsx';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

export default function CohortListPage() {
  // 서버 페이징 상태
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);      // UI는 1-based
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [cohortList, setCohortList] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});

  const navigate = useNavigate();

  // 총 페이지
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  // 서버에서 목록/검색 불러오기
  async function fetchCohorts({ page = 1, limit = pageSize, query = '' } = {}) {
    setLoading(true);
    setErrorMessage('');
    try {
      // API는 0-based page로 보임(스웨거 기본값 0)
      const apiPage = Math.max(0, Number(page) - 1);
      const params = new URLSearchParams();
      params.set('page', String(apiPage));
      params.set('limit', String(limit));
      if (query?.trim()) params.set('query', query.trim());

      const res = await fetch(`${API_URI}/api/cohort?${params.toString()}`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

      const data = await res.json();

      // 응답 유연 파싱 (배열/객체 모두 지원)
      // 가능한 키 후보:
      // - { cohorts: [], total, page, limit }
      // - { items: [], total, page, limit }
      // - [] (그냥 배열)
      const items =
        data?.cohorts ??
        data?.items ??
        (Array.isArray(data) ? data : data?.data ?? []);

      // 총 개수 추정 (없으면 현재 페이지 길이로)
      const total =
        Number(data?.total) ??
        Number(data?.totalElements) ??
        Number(data?.count) ??
        (Array.isArray(items) ? Number(data?.length ?? 0) : 0);

      // limit 보정
      const effectiveLimit = Number(data?.limit) || limit || 10;

      setCohortList(Array.isArray(items) ? items : []);
      setTotalItems(Number.isFinite(total) && total > 0 ? total : (Array.isArray(items) ? items.length : 0));
      setPageSize(effectiveLimit);
    } catch (e) {
      console.error(e);
      setErrorMessage('An error occurred while fetching data.');
      setTimeout(() => setErrorMessage(''), 5000);
      setCohortList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  }

  // 최초 + 페이지/검색 변경 시 서버 호출
  useEffect(() => {
    fetchCohorts({ page: currentPage, limit: pageSize, query: searchQuery });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery]);

  // 선택 토글
  const handleCheckboxChange = (id) => {
    setSelectedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    setErrorMessage('');
  };

  // 검색 실행
  const handleSearch = () => {
    setCurrentPage(1);
    setSearchQuery(searchInput);
  };

  // 삭제
  const handleDelete = async () => {
    const selectedIds = Object.entries(selectedItems)
      .filter(([_, isSelected]) => isSelected)
      .map(([id]) => id);

    if (selectedIds.length === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete the selected ${selectedIds.length} cohorts?`,
      )
    ) {
      return;
    }

    setLoading(true);
    let deleteError = false;
    for (const id of selectedIds) {
      try {
        await fetch(`${API_URI}/api/cohort/${id}`, { method: 'DELETE' });
      } catch {
        deleteError = true;
      }
    }

    await fetchCohorts({ page: currentPage, limit: pageSize, query: searchQuery });
    setSelectedItems({});

    if (deleteError) {
      setErrorMessage('Failed to delete some cohorts.');
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  if (loading) {
    return <LoadingComponent message="Loading cohort data..." />;
  }

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;

  let compareButtonStyles = '';
  if (selectedCount > 5) {
    compareButtonStyles =
      'border-red-600 bg-red-50 text-red-600 hover:bg-red-100';
  } else if (selectedCount >= 2) {
    compareButtonStyles =
      'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-100';
  } else {
    compareButtonStyles =
      'border-gray-300 bg-white text-gray-500 hover:bg-gray-50';
  }

  let iconStyles = '';
  if (selectedCount > 5) {
    iconStyles = 'bg-red-600 text-white';
  } else if (selectedCount >= 2) {
    iconStyles = 'bg-blue-600 text-white';
  } else {
    iconStyles = 'bg-blue-100 text-blue-400';
  }

  // 1페이지가 0개가 되지 않도록 보정
  const safeCurrentPage = Math.min(currentPage, Math.max(1, totalPages));

  return (
    <>
      <title>Cohort List - Bento</title>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              Cohort List
            </h1>
            <p className="text-gray-600">
              You can create and manage cohorts and access a cohort page by
              clicking its name. By selecting up to five cohorts and clicking
              the Compare button, you can simultaneously compare and analyze the
              selected cohorts.
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSearch();
                  }}
                  placeholder="Search cohorts by name, description, or author"
                  className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute left-3 top-2.5 text-gray-400">
                  🔍
                </span>
                <button
                  className="absolute right-0 top-0 h-full border-l px-4 text-sm font-medium text-blue-600 hover:text-blue-800"
                  onClick={handleSearch}
                >
                  Search
                </button>
              </div>

              <Link
                to="/cohort-definition"
                className="rounded-md border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                New Cohort
              </Link>

              <button
                aria-label="Delete Cohorts"
                onClick={handleDelete}
                disabled={selectedCount === 0}
                className={`inline-flex items-center justify-center rounded-md border p-2 text-sm font-medium transition-colors ${selectedCount > 0 ? 'border-red-600 bg-red-50 text-red-600 hover:bg-red-100' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>

            {/* 목록 */}
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="w-[5%] px-4 py-3">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="w-[5%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    No.
                  </th>
                  <th className="w-[25%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Name
                  </th>
                  <th className="w-[35%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Description
                  </th>
                  <th className="w-[10%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Author
                  </th>
                  <th className="w-[10%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="w-[10%] px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated
                  </th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                {cohortList.map((item, index) => {
                  const id = item.id ?? item.cohort_id ?? item._id;
                  const isSelected = !!selectedItems[id];
                  // 서버 페이징이므로 역순 번호는 전체 기준으로 계산
                  const rowNumber =
                    totalItems - ((safeCurrentPage - 1) * pageSize + index);

                  return (
                    <tr
                      key={id}
                      className={`group cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onClick={() => handleCheckboxChange(id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div
                            className={`flex h-4 w-4 items-center justify-center border-2 transition-colors ${isSelected ? 'border-blue-600' : 'border-gray-300'}`}
                          >
                            {isSelected && (
                              <div className="h-2 w-2 bg-blue-600"></div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {rowNumber > 0 ? rowNumber : index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/cohort/${id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="line-clamp-2 whitespace-pre-line">
                          {item.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.author ?? 'anonymous'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-500">
                        {item.updated_at ? new Date(item.updated_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>

            {/* 서버 페이징 네비게이션 */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <button
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                  className={`rounded-md p-2 text-sm font-medium transition-colors ${safeCurrentPage === 1 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  ‹
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${safeCurrentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-100'}`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                  className={`rounded-md p-2 text-sm font-medium transition-colors ${safeCurrentPage === totalPages ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 transform">
          <div className="flex items-center rounded-md border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-600 shadow-lg">
            <span>{errorMessage}</span>
            <button
              className="ml-4 text-red-400 hover:text-red-600"
              onClick={() => setErrorMessage('')}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
