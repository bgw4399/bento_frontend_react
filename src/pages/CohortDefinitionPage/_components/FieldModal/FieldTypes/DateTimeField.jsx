import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function DateTimeField({
                                          fieldName = "",
                                          tableName = "",
                                          existingData = null,
                                          onSelectionChange = () => {},
                                      }) {
    const [startDate, setStartDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endDate, setEndDate] = useState("");
    const [endTime, setEndTime] = useState("");
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // 기존 데이터 복원
    const restoreFromExistingData = useCallback((operator) => {
        if (!operator) return;
        if (operator.gte) {
            const dt = new Date(operator.gte);
            // 날짜는 ISO(UTC) 기준, 시간은 로컬 기준 — Svelte 코드와 동일한 방식 유지
            const dateIso = dt.toISOString().split("T")[0];
            const timeLocal = dt.toTimeString().slice(0, 5);
            setStartDate(dateIso);
            setStartTime(timeLocal);
        }
        if (operator.lte) {
            const dt = new Date(operator.lte);
            const dateIso = dt.toISOString().split("T")[0];
            const timeLocal = dt.toTimeString().slice(0, 5);
            setEndDate(dateIso);
            setEndTime(timeLocal);
        }
    }, []);

    useEffect(() => {
        if (existingData?.operator) {
            restoreFromExistingData(existingData.operator);
        }
    }, [existingData, restoreFromExistingData]);

    // 날짜/시간 유효성 검증 (모든 필드가 있을 때만 비교)
    useEffect(() => {
        if ((startDate || startTime) && (endDate || endTime)) {
            const s = new Date(`${startDate || "1900-01-01"}T${startTime || "00:00"}`);
            const e = new Date(`${endDate || "9999-12-31"}T${endTime || "23:59"}`);

            if (startDate && endDate && startTime && endTime && s > e) {
                setHasError(true);
                setErrorMessage("시작일시는 종료일시보다 늦을 수 없습니다.");
            } else {
                setHasError(false);
                setErrorMessage("");
            }
        } else {
            setHasError(false);
            setErrorMessage("");
        }
    }, [startDate, startTime, endDate, endTime]);

    const updateConditions = useCallback(() => {
        if (hasError) {
            onSelectionChange?.({
                fieldName,
                tableName,
                operator: {},
                summary: null,
                displayText: "날짜시간 조건 오류",
                hasError: true,
            });
            return;
        }

        if (!startDate && !startTime && !endDate && !endTime) {
            onSelectionChange?.({
                fieldName,
                tableName,
                operator: {},
                summary: null,
                displayText: "날짜시간 조건 없음",
                hasError: false,
            });
            return;
        }

        const operator = {};
        let summaryText = "";

        if (startDate || startTime) {
            const d = startDate || "1900-01-01";
            const t = startTime || "00:00";
            operator.gte = `${d}T${t}:00`;
        }
        if (endDate || endTime) {
            const d = endDate || "9999-12-31";
            const t = endTime || "23:59";
            operator.lte = `${d}T${t}:59`;
        }

        if (startDate && startTime && endDate && endTime) {
            summaryText = `${startDate} ${startTime} ~ ${endDate} ${endTime}`;
        } else if (startDate || startTime) {
            const d = startDate || "";
            const t = startTime || "";
            summaryText = `${d} ${t} 이후`.trim();
        } else if (endDate || endTime) {
            const d = endDate || "";
            const t = endTime || "";
            summaryText = `${d} ${t} 이전`.trim();
        }

        onSelectionChange?.({
            fieldName,
            tableName,
            operator,
            summary: summaryText,
            displayText: summaryText,
            hasError: false,
        });
    }, [hasError, startDate, startTime, endDate, endTime, fieldName, tableName, onSelectionChange]);

    // 값 변경/에러 상태 변경 시 조건 업데이트
    useEffect(() => {
        updateConditions();
    }, [updateConditions]);

    const inputClass = useMemo(
        () =>
            `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                hasError ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
            }`,
        [hasError]
    );

    // 초기화 함수
    const handleReset = () => {
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
    };

    return (
        <div className="px-6 pb-6 space-y-4">
            <div className="space-y-4">
                {/* 시작 날짜시간 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시작 일시</label>
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex-1">
                            <input
                                type="date"
                                value={startDate || ""}
                                onChange={(e) => setStartDate(e.target.value)}
                                className={inputClass}
                                max={endDate || undefined}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="time"
                                value={startTime || ""}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>

                {/* 종료 날짜시간 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">종료 일시</label>
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex-1">
                            <input
                                type="date"
                                value={endDate || ""}
                                onChange={(e) => setEndDate(e.target.value)}
                                className={inputClass}
                                min={startDate || undefined}
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                type="time"
                                value={endTime || ""}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 에러 메시지 */}
            {hasError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-red-700 font-medium">{errorMessage}</span>
                    </div>
                </div>
            )}

            {/* 현재 설정된 조건 미리보기 */}
            {(startDate || startTime || endDate || endTime) && !hasError && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">설정된 조건:</span>
                        <span className="ml-2">
                          {startDate && startTime && endDate && endTime ? (
                              <>
                                  <strong>{startDate} {startTime}</strong> ~ <strong>{endDate} {endTime}</strong>
                              </>
                          ) : startDate || startTime ? (
                              <>
                                  <strong>{startDate || ""} {startTime || ""}</strong> 이후
                              </>
                          ) : (
                              <>
                                  <strong>{endDate || ""} {endTime || ""}</strong> 이전
                              </>
                          )}
                        </span>
                    </div>
                    {/* 초기화 버튼 */}
                    <button
                        onClick={handleReset}
                        className="px-3 py-1 text-sm text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-100"
                    >
                        초기화
                    </button>

                </div>
            )}
        </div>
    );
}
