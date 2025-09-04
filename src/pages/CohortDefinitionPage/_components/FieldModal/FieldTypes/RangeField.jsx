import React, { useCallback, useEffect, useMemo, useState } from "react";

export default function RangeField({
                                       fieldName = "",
                                       tableName = "",
                                       existingData = null,
                                       onSelectionChange = () => {},
                                       fieldType = "", // "range_int" | "range_float"
                                   }) {
    const [minValue, setMinValue] = useState("");
    const [maxValue, setMaxValue] = useState("");
    const [minOperator, setMinOperator] = useState("gte"); // gte | gt
    const [maxOperator, setMaxOperator] = useState("lte"); // lte | lt
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const minOperatorOptions = useMemo(
        () => [
            { value: "gte", label: "이상", symbol: "≥" },
            { value: "gt", label: "초과", symbol: ">" },
        ],
        []
    );

    const maxOperatorOptions = useMemo(
        () => [
            { value: "lte", label: "이하", symbol: "≤" },
            { value: "lt", label: "미만", symbol: "<" },
        ],
        []
    );

    // 타입 파생 값
    const isIntType = fieldType === "range_int";
    const isFloatType = fieldType === "range_float";
    const inputStep = isIntType ? "1" : "0.01";
    const inputType = "number";

    // 기존 데이터 복원
    useEffect(() => {
        if (existingData?.operator) {
            const op = existingData.operator;
            if (op.gte !== undefined) {
                setMinValue(String(op.gte));
                setMinOperator("gte");
            } else if (op.gt !== undefined) {
                setMinValue(String(op.gt));
                setMinOperator("gt");
            }
            if (op.lte !== undefined) {
                setMaxValue(String(op.lte));
                setMaxOperator("lte");
            } else if (op.lt !== undefined) {
                setMaxValue(String(op.lt));
                setMaxOperator("lt");
            }
        }
    }, [existingData]);

    // 유효성 검증
    useEffect(() => {
        if (minValue !== "" && maxValue !== "") {
            const min = parseFloat(minValue);
            const max = parseFloat(maxValue);

            if (Number.isNaN(min) || Number.isNaN(max)) {
                setHasError(true);
                setErrorMessage("올바른 숫자를 입력해주세요.");
                return;
            }
            if (isIntType && (!Number.isInteger(min) || !Number.isInteger(max))) {
                setHasError(true);
                setErrorMessage("정수만 입력 가능합니다.");
                return;
            }

            // 연산자 조합에 따른 범위 검증
            let isValidRange = true;
            if (minOperator === "gte" && maxOperator === "lte") {
                isValidRange = min <= max;
            } else if (minOperator === "gt" && maxOperator === "lt") {
                isValidRange = min < max;
            } else if (minOperator === "gte" && maxOperator === "lt") {
                isValidRange = min < max;
            } else if (minOperator === "gt" && maxOperator === "lte") {
                isValidRange = min < max;
            }

            if (!isValidRange) {
                setHasError(true);
                setErrorMessage("범위 조건이 올바르지 않습니다.");
                return;
            }
        }

        // 한쪽만 입력되었거나(또는 둘 다 비어있음) 여기까지 왔다면 에러 없음
        setHasError(false);
        setErrorMessage("");
    }, [minValue, maxValue, minOperator, maxOperator, isIntType]);

    const updateConditions = useCallback(() => {
        if (hasError) {
            onSelectionChange?.({
                fieldName,
                tableName,
                operator: {},
                summary: null,
                displayText: "범위 조건 오류",
                hasError: true,
            });
            return;
        }

        if (minValue === "" && maxValue === "") {
            onSelectionChange?.({
                fieldName,
                tableName,
                operator: {},
                summary: null,
                displayText: "범위 조건 없음",
                hasError: false,
            });
            return;
        }

        const operator = {};
        let summaryText = "";

        if (minValue !== "") {
            const min = isIntType ? parseInt(minValue, 10) : parseFloat(minValue);
            operator[minOperator] = min;
        }
        if (maxValue !== "") {
            const max = isIntType ? parseInt(maxValue, 10) : parseFloat(maxValue);
            operator[maxOperator] = max;
        }

        const minLabel =
            minOperatorOptions.find((o) => o.value === minOperator)?.label || "이상";
        const maxLabel =
            maxOperatorOptions.find((o) => o.value === maxOperator)?.label || "이하";

        if (minValue !== "" && maxValue !== "") {
            summaryText = `${minValue} ${minLabel} ~ ${maxValue} ${maxLabel}`;
        } else if (minValue !== "") {
            summaryText = `${minValue} ${minLabel}`;
        } else if (maxValue !== "") {
            summaryText = `${maxValue} ${maxLabel}`;
        }

        onSelectionChange?.({
            fieldName,
            tableName,
            operator,
            summary: summaryText,
            displayText: summaryText,
            hasError: false,
        });
    }, [
        hasError,
        minValue,
        maxValue,
        minOperator,
        maxOperator,
        isIntType,
        fieldName,
        tableName,
        onSelectionChange,
        minOperatorOptions,
        maxOperatorOptions,
    ]);

    // 값/연산자/에러 상태가 변할 때마다 부모에 알림
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

    const selectClass = inputClass + " text-sm";

    return (
        <div className="px-6 pb-6 space-y-4">
            <div className="space-y-4">
                {/* 타입 표시 */}
                <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                    {isIntType ? "정수 범위 입력" : isFloatType ? "실수 범위 입력" : "숫자 범위 입력"}
                </div>

                {/* 최솟값 입력 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">최솟값 조건</label>
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex-1">
                            <input
                                type={inputType}
                                step={inputStep}
                                value={minValue}
                                onChange={(e) => setMinValue(e.target.value)}
                                className={inputClass}
                                placeholder={isIntType ? "정수 입력" : "숫자 입력"}
                            />
                        </div>
                        <div className="w-20">
                            <select
                                value={minOperator}
                                onChange={(e) => setMinOperator(e.target.value)}
                                className={selectClass}
                            >
                                {minOperatorOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.symbol} {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 최댓값 입력 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">최댓값 조건</label>
                    <div className="flex flex-row items-center gap-2">
                        <div className="flex-1">
                            <input
                                type={inputType}
                                step={inputStep}
                                value={maxValue}
                                onChange={(e) => setMaxValue(e.target.value)}
                                className={inputClass}
                                placeholder={isIntType ? "정수 입력" : "숫자 입력"}
                            />
                        </div>
                        <div className="w-20">
                            <select
                                value={maxOperator}
                                onChange={(e) => setMaxOperator(e.target.value)}
                                className={selectClass}
                            >
                                {maxOperatorOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.symbol} {option.label}
                                    </option>
                                ))}
                            </select>
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
            {(minValue !== "" || maxValue !== "") && !hasError && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                        <span className="font-medium">설정된 조건:</span>
                        <span className="ml-2">
              {minValue !== "" && maxValue !== "" ? (
                  <>
                      <strong>{minValue}</strong>{" "}
                      {minOperatorOptions.find((o) => o.value === minOperator)?.label} ~{" "}
                      <strong>{maxValue}</strong>{" "}
                      {maxOperatorOptions.find((o) => o.value === maxOperator)?.label}
                  </>
              ) : minValue !== "" ? (
                  <>
                      <strong>{minValue}</strong>{" "}
                      {minOperatorOptions.find((o) => o.value === minOperator)?.label}
                  </>
              ) : (
                  <>
                      <strong>{maxValue}</strong>{" "}
                      {maxOperatorOptions.find((o) => o.value === maxOperator)?.label}
                  </>
              )}
            </span>
                    </div>
                </div>
            )}
        </div>
    );
}
