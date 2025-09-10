import React, { useMemo, useState, useCallback } from "react";
import LookupField from "./fieldTypes/LookupField";
import DateField from "./fieldTypes/DateField";
import DateTimeField from "./fieldTypes/DateTimeField";
import RangeField from "./fieldTypes/RangeField";
import SearchField from "./fieldTypes/SearchField";

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
        if (fieldData?.fieldType === "lookup") {
            return { modalWidth: "1000px", modalHeight: "90vh" };
        }
        return { modalWidth: "auto", modalHeight: "auto" };
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
                className="bg-white rounded-lg shadow-xl overflow-hidden flex flex-col"
                style={{ width: modalWidth, height: modalHeight, maxWidth: "100vw", maxHeight: "95vh" }}
            >
                {/* 상단 공통 헤더 */}
                <div className="px-6 pt-6 pb-3 border-b border-gray-200">
                    <div className="flex justify-between items-center gap-12">
                        <div className="flex gap-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                {fieldData.fieldName} 설정
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium text-blue-600">{fieldData.tableName}</span> 테이블&nbsp;|
                                <span className="font-medium text-green-600"> {fieldData.fieldName}</span>&nbsp;필드
                            </p>
                        </div>
                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={handleClose}
                            aria-label="닫기"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* 실제 입력 UI */}
                <div className="flex-1 overflow-hidden px-6 py-6">
                    {fieldData.fieldType === "Lookup" ? (
                        <LookupField
                            fieldName={fieldData.fieldName}
                            tableName={fieldData.tableName}
                            existingData={existingData}
                            onSelectionChange={handleSelectionChange}
                        />
                    ) : fieldData.fieldType === "Date" ? (
                        <DateField
                            fieldName={fieldData.fieldName}
                            tableName={fieldData.tableName}
                            existingData={existingData}
                            onSelectionChange={handleSelectionChange}
                        />
                    ) : fieldData.fieldType === "Datetime" ? (
                        <DateTimeField
                            fieldName={fieldData.fieldName}
                            tableName={fieldData.tableName}
                            existingData={existingData}
                            onSelectionChange={handleSelectionChange}
                        />
                    ) : fieldData.fieldType === "Range_Integer" || fieldData.fieldType === "Range_Float" ? (
                        <RangeField
                            fieldName={fieldData.fieldName}
                            tableName={fieldData.tableName}
                            fieldType={fieldData.fieldType}
                            existingData={existingData}
                            onSelectionChange={handleSelectionChange}
                        />
                    ) : fieldData.fieldType === "Search" ? (
                        <SearchField
                            fieldName={fieldData.fieldName}
                            tableName={fieldData.tableName}
                            existingData={existingData}
                            onSelectionChange={handleSelectionChange}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                                    />
                                </svg>
                            </div>
                            <h4 className="text-lg font-medium text-gray-800 mb-2">{fieldData.fieldName}</h4>
                            <p className="text-gray-600 mb-4">
                                이 필드 타입({fieldData.fieldType})에 대한 설정이 준비 중입니다.
                            </p>
                        </div>
                    )}
                </div>

                {/* 하단 공통 버튼 */}
                <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
                    <button
                        className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-sm font-medium"
                        onClick={handleClose}
                        aria-label="취소"
                    >
                        취소
                    </button>
                    <button
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
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
