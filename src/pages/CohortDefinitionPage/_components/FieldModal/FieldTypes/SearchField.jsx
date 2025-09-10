// /src/pages/CohortDefinitionPage/_components/FieldModal/FieldTypes/SearchField.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";

const PUBLIC_API_URI = import.meta.env.VITE_PUBLIC_API_URI;

export default function SearchField({
                                        fieldName = "",
                                        tableName = "",
                                        existingData = null,
                                        onSelectionChange = () => {},
                                    }) {
    const [keyword, setKeyword] = useState("");
    const [selectedOperator, setSelectedOperator] = useState("contains"); // 기본값
    const [selectedKeyword, setSelectedKeyword] = useState(null); // { keyword, operator, operatorLabel }
    const [isLoading, setIsLoading] = useState(false);
    const [keywordCount, setKeywordCount] = useState(null); // { count, total } | { error, message } | null

    // 연산자 옵션
    const operatorOptions = useMemo(
        () => [
            { value: "contains", label: "포함된 문자열 추가" },
            { value: "not_contains", label: "포함되지 않은 문자열 추가" },
            { value: "starts_with", label: "시작하는 문자열 추가" },
        ],
        []
    );

    // API: 문자열별 데이터 건수 확인
    const checkKeywordCount = useCallback(async (keywordItem) => {
        if (!PUBLIC_API_URI) return;

        setIsLoading(true);
        try {
            const requestBody = {
                table_name: tableName,
                column_name: fieldName,
                query: {
                    [keywordItem.operator]: keywordItem.keyword,
                },
            };

            const res = await fetch(`${PUBLIC_API_URI}/api/text-search`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    accept: "application/json",
                },
                body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
                throw new Error(`API 호출 실패: ${res.status}`);
            }

            const data = await res.json();
            setKeywordCount({
                count: data.queryCount || 0,
                total: data.totalCount || 0,
            });
        } catch (err) {
            console.error("API 호출 오류:", err);
            setKeywordCount({
                error: true,
                message: "건수 확인에 실패했습니다.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [fieldName, tableName]);

    // 문자열 추가/교체
    const addKeyword = useCallback(async () => {
        const k = keyword.trim();
        if (!k) return;

        const op = selectedOperator;
        const opLabel =
            operatorOptions.find((opt) => opt.value === op)?.label || "";

        const newKeyword = {
            keyword: k,
            operator: op,
            operatorLabel: opLabel,
        };

        setSelectedKeyword(newKeyword);
        setKeywordCount(null); // 기존 건수 초기화
        await checkKeywordCount(newKeyword);
        setKeyword("");
    }, [keyword, selectedOperator, operatorOptions, checkKeywordCount]);

    // 문자열 제거
    const removeKeyword = useCallback(() => {
        setSelectedKeyword(null);
        setKeywordCount(null);
    }, []);

    // 부모로 조건 반영
    const updateConditions = useCallback(() => {
        if (!onSelectionChange) return;

        if (!selectedKeyword) {
            onSelectionChange({
                fieldName,
                tableName,
                operator: {},
                summary: "문자열 없음",
                displayText: "문자열 없음",
            });
            return;
        }

        let operatorPrefix = "포함: ";
        switch (selectedKeyword.operator) {
            case "contains":
                operatorPrefix = "포함: ";
                break;
            case "not_contains":
                operatorPrefix = "제외: ";
                break;
            case "starts_with":
                operatorPrefix = "시작: ";
                break;
            default:
                operatorPrefix = "포함: ";
        }

        const summaryText = `${operatorPrefix}${selectedKeyword.keyword}`;

        onSelectionChange({
            fieldName,
            tableName,
            operator: {
                keywords: [
                    {
                        keyword: selectedKeyword.keyword,
                        operator: selectedKeyword.operator,
                    },
                ],
            },
            summary: summaryText,
            displayText: summaryText,
        });
    }, [fieldName, tableName, selectedKeyword, onSelectionChange]);

    // selectedKeyword가 바뀌면 조건 업데이트
    useEffect(() => {
        updateConditions();
    }, [updateConditions]);

    // 초기 렌더 시 기존 데이터 복원 & 조건 업데이트
    useEffect(() => {
        document.body.style.overflow = "hidden";

        if (
            existingData?.operator?.keywords &&
            existingData.operator.keywords.length > 0
        ) {
            const existingItem = existingData.operator.keywords[0];
            const op = existingItem.operator || "contains";
            const opLabel =
                operatorOptions.find((opt) => opt.value === op)?.label || "";

            const restored = {
                keyword: existingItem.keyword || "",
                operator: op,
                operatorLabel: opLabel,
            };

            setSelectedKeyword(restored);
            setSelectedOperator(op);

            if (restored.keyword) {
                setKeywordCount(null);
                checkKeywordCount(restored);
            }
        } else {
            // 기존 데이터가 없어도 부모 쪽에 "문자열 없음" 반영
            updateConditions();
        }

        return () => {
            document.body.style.overflow = "";
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 최초 1회

    const inputBase =
        "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

    return (
        <div className="px-6 pb-6 space-y-4">
            <div className="space-y-4">
                {/* 문자열 등록 섹션 */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <label className="block text-m font-medium text-gray-800">
                            문자열 추가
                        </label>
                        <div className="group relative">
                            <span className="text-sm text-gray-400 cursor-pointer">ⓘ</span>
                            <div className="absolute top-1/2 -translate-y-1/2 left-full ml-2 w-80 bg-gray-800 text-white text-xs font-extralight rounded-lg px-2.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] shadow-lg border border-gray-600">
                                <div className="relative">
                                    현재 설정창에서 문자열은 1개만 추가할 수 있습니다. <br />
                                    더 많은 문자열을 추가하려면 현재 설정창을 닫고, <br />
                                    필드를 컨테이너에 드래그한 후 새로운 설정창을 열어 추가해주세요.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {/* 추가 연산자 선택 */}
                        <select
                            value={selectedOperator}
                            onChange={(e) => setSelectedOperator(e.target.value)}
                            className={`${inputBase} text-sm`}
                        >
                            {operatorOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        {/* 문자열 입력 + 버튼 */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    value={keyword}
                                    onChange={(e) => setKeyword(e.target.value)}
                                    placeholder="추가할 문자열을 입력하세요"
                                    className={`${inputBase} pl-10`}
                                    onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                        />
                                    </svg>
                                </div>
                            </div>

                            <button
                                onClick={addKeyword}
                                disabled={!keyword.trim() || isLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {selectedKeyword ? (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                        교체
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                            />
                                        </svg>
                                        추가
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* 등록된 문자열 */}
                {selectedKeyword ? (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {selectedKeyword.keyword}
                </span>
                                <span className="text-xs text-gray-600 border border-gray-400 px-1.5 py-0.5 rounded-xl">
                  {selectedKeyword.operatorLabel}
                </span>
                            </div>

                            {/* 데이터 건수 표시 */}
                            {keywordCount ? (
                                keywordCount.error ? (
                                    <div className="text-xs text-red-600">건수 확인 실패</div>
                                ) : (
                                    <div className="text-xs text-gray-600">
                                        해당 조건 만족 데이터:{" "}
                                        <span className="font-medium text-blue-600">
                      {(keywordCount.count ?? 0).toLocaleString()}
                    </span>
                                        건 (전체{" "}
                                        <span className="font-medium">
                      {(keywordCount.total ?? 0).toLocaleString()}
                    </span>
                                        건 중)
                                    </div>
                                )
                            ) : (
                                <div className="text-xs text-gray-400">건수 확인 중...</div>
                            )}
                        </div>

                        <button
                            aria-label="문자열 삭제"
                            onClick={removeKeyword}
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="문자열 삭제"
                        >
                            <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
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
                ) : (
                    // 문자열이 없을 때 안내
                    <div className="border border-gray-200 rounded-md p-6 text-center">
                        <div className="text-gray-400 mb-2">
                            <svg
                                className="w-12 h-12 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <p className="text-sm text-gray-500">등록된 문자열이 없습니다.</p>
                        <p className="text-xs text-gray-400 mt-1">
                            입력창에 문자열을 입력하고 추가해주세요.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
