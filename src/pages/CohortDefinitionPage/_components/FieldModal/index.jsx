import React, { useMemo, useState, useCallback } from 'react';
import LookupField from './fieldTypes/LookupField';
import DateField from './fieldTypes/DateField';
import DateTimeField from './fieldTypes/DateTimeField';
import RangeField from './fieldTypes/RangeField';
import SearchField from './fieldTypes/SearchField';

export default function FieldModal({
  showModal = false,
  fieldData = null, // { fieldName, tableName, fieldType }
  existingData = null, // 기존 선택 데이터
  onApply = () => {},
  onClose = () => {},
}) {
  const [selectedData, setSelectedData] = useState(null);

  // 필드 타입별 width/height
  const { modalWidth, modalHeight } = useMemo(() => {
    if (fieldData?.fieldType === 'lookup') {
      return { modalWidth: '1000px', modalHeight: '90vh' };
    }
    return { modalWidth: 'auto', modalHeight: 'auto' };
  }, [fieldData]);

  const handleClose = useCallback(() => {
    setSelectedData(null);
    onClose();
  }, [onClose]);

  const handleApply = useCallback(() => {
    if (selectedData && !selectedData.hasError) {
      onApply(selectedData);
    }
  }, [onApply, selectedData]);

  const handleSelectionChange = useCallback((data) => {
    setSelectedData(data);
  }, []);

  if (!showModal || !fieldData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="flex flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        style={{
          width: modalWidth,
          height: modalHeight,
          maxWidth: '100vw',
          maxHeight: '95vh',
        }}
      >
        {/* 상단 공통 헤더 */}
        <div className="border-b border-gray-200 px-6 pb-3 pt-6">
          <div className="flex items-center justify-between gap-12">
            <div className="flex gap-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {fieldData.fieldName} 설정
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium text-blue-600">
                  {fieldData.tableName}
                </span>{' '}
                테이블&nbsp;|
                <span className="font-medium text-green-600">
                  {' '}
                  {fieldData.fieldName}
                </span>
                &nbsp;필드
              </p>
            </div>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={handleClose}
              aria-label="닫기"
            >
              <svg
                className="h-5 w-5"
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
        </div>

        {/* 실제 입력 UI */}
        <div className="flex-1 overflow-hidden px-6 py-6">
          {fieldData.fieldType === 'Lookup' ? (
            <LookupField
              fieldName={fieldData.fieldName}
              tableName={fieldData.tableName}
              existingData={existingData}
              onSelectionChange={handleSelectionChange}
            />
          ) : fieldData.fieldType === 'Date' ? (
            <DateField
              fieldName={fieldData.fieldName}
              tableName={fieldData.tableName}
              existingData={existingData}
              onSelectionChange={handleSelectionChange}
            />
          ) : fieldData.fieldType === 'Datetime' ? (
            <DateTimeField
              fieldName={fieldData.fieldName}
              tableName={fieldData.tableName}
              existingData={existingData}
              onSelectionChange={handleSelectionChange}
            />
          ) : fieldData.fieldType === 'Range_Integer' ||
            fieldData.fieldType === 'Range_Float' ? (
            <RangeField
              fieldName={fieldData.fieldName}
              tableName={fieldData.tableName}
              fieldType={fieldData.fieldType}
              existingData={existingData}
              onSelectionChange={handleSelectionChange}
            />
          ) : fieldData.fieldType === 'Search' ? (
            <SearchField
              fieldName={fieldData.fieldName}
              tableName={fieldData.tableName}
              existingData={existingData}
              onSelectionChange={handleSelectionChange}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h4 className="mb-2 text-lg font-medium text-gray-800">
                {fieldData.fieldName}
              </h4>
              <p className="mb-4 text-gray-600">
                이 필드 타입({fieldData.fieldType})에 대한 설정이 준비 중입니다.
              </p>
            </div>
          )}
        </div>

        {/* 하단 공통 버튼 */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            className="rounded bg-gray-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
            onClick={handleClose}
            aria-label="취소"
          >
            취소
          </button>
          <button
            className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            onClick={handleApply}
            disabled={!selectedData || selectedData.hasError}
            aria-label="적용"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  );
}
