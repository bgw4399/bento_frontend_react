import React, { useCallback, useEffect, useMemo, useState } from 'react';

const API_BASE = import.meta.env.VITE_PUBLIC_API_URI;

export default function LookupField({
  fieldName = '',
  tableName = '',
  existingData = null, // { selectedItems?: [...] }
  onSelectionChange = () => {}, // 부모로 상태 전달
}) {
  // 선택 상태
  const [selectedItems, setSelectedItems] = useState([]);

  // API 상태
  const [isLoading, setIsLoading] = useState(false);
  const [apiData, setApiData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 100;

  // 검색 폼 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchConceptId, setSearchConceptId] = useState('');
  const [searchConceptName, setSearchConceptName] = useState('');
  const [searchSnuhId, setSearchSnuhId] = useState('');
  const [searchSnuhName, setSearchSnuhName] = useState('');
  const [searchVocabulary, setSearchVocabulary] = useState('');

  // 아코디언 열림 상태
  const [openAccordion, setOpenAccordion] = useState({}); // { [conceptId]: boolean }

  // 기존 데이터 복원
  useEffect(() => {
    if (existingData?.selectedItems) {
      setSelectedItems([...existingData.selectedItems]);
    }
  }, [existingData]);

  // 모달 동안 배경 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // API 호출
  const fetchConceptData = useCallback(
    async (page = 0) => {
      if (!API_BASE) {
        console.warn('NEXT_PUBLIC_API_URI가 설정되지 않았습니다.');
        setApiData([]);
        setTotalCount(0);
        setCurrentPage(0);
        return;
      }

      setIsLoading(true);
      try {
        const body = {
          table: tableName,
          column: fieldName,
          query: searchKeyword || '',
          source_code: searchSnuhId || '',
          source_code_description: searchSnuhName || '',
          target_concept_id: searchConceptId || '',
          target_concept_name: searchConceptName || '',
          vocabulary_id: searchVocabulary || '',
          domain: '',
          page,
          limit: pageSize,
        };

        const res = await fetch(`${API_BASE}/api/concept/search`, {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) throw new Error('API 호출 실패');

        const data = await res.json();
        setApiData(data.concepts || []);
        setTotalCount(data.total ?? 0);
        setCurrentPage(page);
      } catch (e) {
        console.error('API 호출 오류:', e);
        setApiData([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    },
    [
      fieldName,
      tableName,
      searchKeyword,
      searchSnuhId,
      searchSnuhName,
      searchConceptId,
      searchConceptName,
      searchVocabulary,
    ],
  );

  // 초기 데이터 로드
  useEffect(() => {
    fetchConceptData(0);
  }, [fetchConceptData]);

  // 페이지 수
  const totalPages = useMemo(
    () => Math.ceil(totalCount / pageSize),
    [totalCount],
  );

  // 선택 그룹핑 (concept 기준)
  const selectedGrouped = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const key = item.target_concept_id;
      if (!acc[key])
        acc[key] = { conceptName: item.target_concept_name, snuhs: [] };
      acc[key].snuhs.push({
        snuhId: item.source_code,
        snuhName: item.source_code_description,
      });
      return acc;
    }, {});
  }, [selectedItems]);

  // 부모로 상태 전달
  useEffect(() => {
    const conceptCount = Object.keys(selectedGrouped).length;
    const itemCount = selectedItems.length;
    onSelectionChange({
      fieldName,
      tableName,
      selectedItems: [...selectedItems],
      conceptCount,
      itemCount,
      summary: conceptCount > 0 ? `컨셉 ${conceptCount}개 선택됨` : null,
    });
  }, [selectedItems, selectedGrouped, fieldName, tableName, onSelectionChange]);

  // 아코디언 토글
  const toggleAccordion = (conceptId) => {
    setOpenAccordion((prev) => ({ ...prev, [conceptId]: !prev[conceptId] }));
  };

  // 행/체크박스 토글: 같은 target_concept_id를 모두 추가/제거
  const toggleItem = (item) => {
    const sameConceptItems = apiData.filter(
      (d) => d.target_concept_id === item.target_concept_id,
    );
    const isCurrentlySelected = selectedItems.some(
      (s) => s.target_concept_id === item.target_concept_id,
    );

    if (isCurrentlySelected) {
      setSelectedItems((prev) =>
        prev.filter((s) => s.target_concept_id !== item.target_concept_id),
      );
    } else {
      setSelectedItems((prev) => [...prev, ...sameConceptItems]);
    }
  };

  const removeSelected = (item) => {
    setSelectedItems((prev) =>
      prev.filter((s) => s.target_concept_id !== item.target_concept_id),
    );
  };

  const isSelected = (item) =>
    selectedItems.some((s) => s.target_concept_id === item.target_concept_id);

  // 검색
  const handleSearch = () => fetchConceptData(0);
  const handlePageChange = (page) => fetchConceptData(page);

  // 페이지 버튼 목록 (최대 5개)
  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];
    const windowSize = Math.min(5, totalPages);
    const start = Math.max(
      0,
      Math.min(currentPage - 2, totalPages - windowSize),
    );
    return Array.from({ length: windowSize }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  // input 공통 핸들러(Enter로 검색)
  const onEnterSearch = (e, fn = handleSearch) => {
    if (e.key === 'Enter') fn();
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex h-full w-full px-4">
        {/* 좌측 테이블 */}
        <div className="mr-4 flex min-h-0 min-w-0 shrink-0 basis-2/3 flex-col rounded-lg border border-gray-200">
          {/* 검색 영역 */}
          <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 px-4 pb-0 pt-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">
                {apiData.length} / {totalCount} 건
              </span>
              <div className="flex items-center gap-2">
                <p>
                  <span className="text-xs text-red-600">*</span>
                  <span className="text-xs text-gray-600">
                    검색 후 엔터를 눌러주세요
                  </span>
                </p>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="통합 검색"
                    className="h-8 w-48 rounded border border-gray-300 py-2 pl-8 pr-4 text-sm placeholder:text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                    onKeyDown={(e) => onEnterSearch(e)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 테이블 헤더 */}
          <div className="flex items-center border-b border-gray-200 bg-gray-100 px-2 py-2 text-center text-xs font-medium text-gray-700">
            <div className="w-[5%] text-center">□</div>
            <div className="w-[15%]">Concept ID</div>
            <div className="w-[25%]">Concept Name</div>
            <div className="w-[15%]">SNUH ID</div>
            <div className="w-[25%]">SNUH Name</div>
            <div className="w-[15%]">Vocabulary</div>
          </div>

          {/* 열별 검색창 */}
          <div className="flex items-center border-b border-gray-200 bg-white px-2 py-2 text-center text-xs text-gray-700">
            <div className="w-[5%]" />
            <div className="w-[15%] px-0.5">
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="concept id"
                value={searchConceptId}
                onChange={(e) => setSearchConceptId(e.target.value)}
                onKeyDown={(e) => onEnterSearch(e)}
              />
            </div>
            <div className="w-[25%] px-0.5">
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="concept name"
                value={searchConceptName}
                onChange={(e) => setSearchConceptName(e.target.value)}
                onKeyDown={(e) => onEnterSearch(e)}
              />
            </div>
            <div className="w-[15%] px-0.5">
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="snuh id"
                value={searchSnuhId}
                onChange={(e) => setSearchSnuhId(e.target.value)}
                onKeyDown={(e) => onEnterSearch(e)}
              />
            </div>
            <div className="w-[25%] px-0.5">
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="snuh name"
                value={searchSnuhName}
                onChange={(e) => setSearchSnuhName(e.target.value)}
                onKeyDown={(e) => onEnterSearch(e)}
              />
            </div>
            <div className="w-[15%] px-0.5">
              <input
                type="text"
                className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="vocabulary"
                value={searchVocabulary}
                onChange={(e) => setSearchVocabulary(e.target.value)}
                onKeyDown={(e) => onEnterSearch(e)}
              />
            </div>
          </div>

          {/* 테이블 본문 */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500">
                    데이터를 불러오는 중...
                  </p>
                </div>
              </div>
            ) : apiData.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-2 h-12 w-12 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z"
                    />
                  </svg>
                  <p className="text-sm">검색 결과가 없습니다</p>
                </div>
              </div>
            ) : (
              apiData.map((item) => (
                <div
                  key={`${item.target_concept_id}-${item.source_code}`}
                  className="flex cursor-pointer items-start border-b border-gray-100 px-2 py-2 text-center text-sm transition-colors hover:bg-gray-50"
                  onClick={() => toggleItem(item)}
                  onKeyDown={(e) =>
                    (e.key === 'Enter' || e.key === ' ') && toggleItem(item)
                  }
                  role="button"
                  tabIndex={0}
                >
                  <div className="w-[5%] self-center">
                    <input
                      type="checkbox"
                      checked={isSelected(item)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleItem(item);
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div
                    className="line-clamp-3 w-[15%] self-center whitespace-normal break-words px-1.5 font-medium text-gray-900"
                    title={item.target_concept_id}
                  >
                    {item.target_concept_id}
                  </div>
                  <div
                    className="w-[25%] self-center px-1.5 text-left text-gray-700"
                    title={item.target_concept_name}
                  >
                    {item.target_concept_name}
                  </div>
                  <div
                    className="line-clamp-3 w-[15%] self-center whitespace-normal break-words px-1.5 font-medium text-gray-900"
                    title={item.source_code}
                  >
                    {item.source_code}
                  </div>
                  <div
                    className="w-[25%] self-center px-1.5 text-left text-gray-700"
                    title={item.source_code_description}
                  >
                    {item.source_code_description}
                  </div>
                  <div
                    className="line-clamp-3 w-[15%] self-center whitespace-normal break-words px-1.5 text-gray-700"
                    title={item.vocabulary_id}
                  >
                    {item.vocabulary_id}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-sm text-gray-700">
                페이지 {currentPage + 1} / {totalPages} (총 {totalCount}건)
              </div>
              <div className="flex items-center gap-1">
                {/* 첫 페이지 */}
                <button
                  aria-label="첫 페이지"
                  className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePageChange(0)}
                  disabled={currentPage === 0 || isLoading}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* 이전 */}
                <button
                  aria-label="이전 페이지"
                  className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0 || isLoading}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* 번호 */}
                {pageNumbers.map((pageNum) => (
                  <button
                    key={pageNum}
                    className={`rounded border px-3 py-1 text-sm ${
                      pageNum === currentPage
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                    onClick={() => handlePageChange(pageNum)}
                    disabled={isLoading}
                  >
                    {pageNum + 1}
                  </button>
                ))}

                {/* 다음 */}
                <button
                  aria-label="다음 페이지"
                  className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1 || isLoading}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>

                {/* 마지막 */}
                <button
                  aria-label="마지막 페이지"
                  className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={currentPage === totalPages - 1 || isLoading}
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 우측 선택 영역 */}
        <div className="flex min-w-0 shrink-0 basis-1/3 flex-col overflow-hidden rounded-lg border border-gray-200">
          <div className="flex flex-col rounded-t-lg border-b border-gray-200 bg-gray-50 px-4 pb-1 pt-3">
            <div className="flex flex-row items-center justify-between">
              <h5 className="text-sm font-medium text-gray-800">선택된 항목</h5>
              <div className="flex flex-col text-right">
                <p className="text-xs text-gray-600">
                  Concept ID {Object.keys(selectedGrouped).length}개
                </p>
                <p className="text-xs text-gray-600">
                  SNUH ID {selectedItems.length}개
                </p>
              </div>
            </div>
            <p>
              <span className="text-xs text-red-600">*</span>
              <span className="text-[11px] text-gray-600">
                SNUH ID가 아닌 Concept ID를 기준으로 적용됩니다.
              </span>
            </p>
          </div>

          <div className="min-h-[300px] flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2">
            {selectedItems.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                <div className="text-center">
                  <p className="text-sm">선택된 항목이 없습니다</p>
                </div>
              </div>
            ) : (
              Object.entries(selectedGrouped).map(([conceptId, group]) => (
                <div
                  key={conceptId}
                  className="space-y-2 rounded border border-blue-200 bg-blue-50 p-2 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* 토글 */}
                      <button
                        className="flex-shrink-0 text-xs text-blue-500 hover:text-blue-700"
                        onClick={() => toggleAccordion(conceptId)}
                        aria-label="토글"
                        style={{ padding: '0 4px' }}
                      >
                        {openAccordion[conceptId] ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </button>
                      <div
                        className="min-w-[25px] max-w-[50px] truncate text-xs text-blue-600"
                        title={conceptId}
                      >
                        {conceptId}
                      </div>
                      <div
                        className="max-w-[200px] truncate pr-1 font-medium text-blue-800"
                        title={group.conceptName}
                      >
                        {group.conceptName}
                      </div>
                    </div>
                    <button
                      aria-label="선택 항목 제거"
                      className="text-blue-500 hover:text-red-500"
                      onClick={() =>
                        removeSelected({ target_concept_id: conceptId })
                      }
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {openAccordion[conceptId] && (
                    <div className="px-4">
                      <ul className="list-disc pl-4">
                        {group.snuhs.map((snuh, idx) => (
                          <div key={idx} className="flex items-center">
                            <li
                              className="w-[50px] truncate text-xs text-blue-900"
                              title={`${snuh.snuhId}`}
                            >
                              • {snuh.snuhId}
                            </li>
                            <li
                              className="w-[200px] truncate text-xs text-blue-900"
                              title={`${snuh.snuhName}`}
                            >
                              {snuh.snuhName}
                            </li>
                          </div>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
