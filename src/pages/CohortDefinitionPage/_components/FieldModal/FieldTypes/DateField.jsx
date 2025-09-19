import React, { useCallback, useEffect, useMemo, useState } from 'react';

export default function DateField({
  fieldName = '',
  tableName = '',
  existingData = null,
  onSelectionChange = () => {},
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 기존 데이터 복원
  const restoreFromExistingData = useCallback((operator) => {
    if (!operator) return;
    if (operator.gte) setStartDate(operator.gte);
    if (operator.lte) setEndDate(operator.lte);
  }, []);

  useEffect(() => {
    if (existingData?.operator) {
      restoreFromExistingData(existingData.operator);
    }
  }, [existingData, restoreFromExistingData]);

  // 날짜 유효성 검증
  useEffect(() => {
    if (startDate && endDate && startDate > endDate) {
      setHasError(true);
      setErrorMessage('시작날짜는 종료날짜보다 늦을 수 없습니다.');
    } else {
      setHasError(false);
      setErrorMessage('');
    }
  }, [startDate, endDate]);

  const updateConditions = useCallback(() => {
    // 에러가 있으면 조건을 업데이트 (에러 상태 전달)
    if (hasError) {
      onSelectionChange?.({
        fieldName,
        tableName,
        operator: {},
        summary: null,
        displayText: '날짜 조건 오류',
        hasError: true,
      });
      return;
    }

    // 둘 다 비었으면 "조건 없음"
    if (!startDate && !endDate) {
      onSelectionChange?.({
        fieldName,
        tableName,
        operator: {},
        summary: null,
        displayText: '날짜 조건 없음',
        hasError: false,
      });
      return;
    }

    const operator = {};
    let summaryText = '';

    if (startDate && endDate) {
      operator.gte = startDate;
      operator.lte = endDate;
      summaryText = `${startDate} ~ ${endDate}`;
    } else if (startDate) {
      operator.gte = startDate;
      summaryText = `${startDate} 이후`;
    } else if (endDate) {
      operator.lte = endDate;
      summaryText = `${endDate} 이전`;
    }

    onSelectionChange?.({
      fieldName,
      tableName,
      operator,
      summary: summaryText,
      hasError: false,
    });
  }, [hasError, startDate, endDate, fieldName, tableName, onSelectionChange]);

  // 날짜 변경/에러 상태 변화 시 조건 업데이트
  useEffect(() => {
    updateConditions();
  }, [updateConditions]);

  // 클래스 조합(에러 상태 반영)
  const inputClass = useMemo(
    () =>
      `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
        hasError
          ? 'border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:ring-blue-500'
      }`,
    [hasError],
  );

  // 초기화 함수
  const handleReset = () => {
    setStartDate('');
    setEndDate('');
  };

  return (
    <div className="space-y-4 px-6 pb-6">
      <div className="flex flex-row items-center gap-4">
        {/* 시작 날짜 */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            시작 일자
          </label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
            max={endDate || undefined}
          />
        </div>

        {/* 종료 날짜 */}
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-gray-700">
            종료 일자
          </label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
            min={startDate || undefined}
          />
        </div>
      </div>

      {/* 에러 메시지 */}
      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <div className="flex items-center">
            <svg
              className="mr-2 h-4 w-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-red-700">
              {errorMessage}
            </span>
          </div>
        </div>
      )}

      {/* 현재 설정된 조건 미리보기 */}
      {(startDate || endDate) && !hasError && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50 p-3">
          <div className="text-sm text-blue-800">
            <span className="font-medium">설정된 조건:</span>
            <span className="ml-2">
              {startDate && endDate ? (
                <>
                  <strong>{startDate}</strong> ~ <strong>{endDate}</strong>
                </>
              ) : startDate ? (
                <>
                  <strong>{startDate}</strong> 이후
                </>
              ) : (
                <>
                  <strong>{endDate}</strong> 이전
                </>
              )}
            </span>
          </div>

          {/* 초기화 버튼 */}
          <button
            onClick={handleReset}
            className="rounded-md border border-blue-300 bg-white px-3 py-1 text-sm text-blue-600 hover:bg-blue-100"
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}
