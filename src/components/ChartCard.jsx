import React from 'react';

export default function ChartCard({
  title = '',
  description = '',
  type = 'full',
  height = '300px',
  hasTableView = false,
  isTableView = false,
  hasXButton = true,
  children,
  tableContent,
  onClose = () => {},
  onToggleView = () => {},
}) {
  const typeClasses = {
    full: 'col-span-1 md:col-span-6',
    half: 'col-span-1 md:col-span-3',
    third: 'col-span-1 md:col-span-2',
  };

  return (
    <div
      className={`relative flex w-full flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${typeClasses[type]}`}
      style={{ height: height }}
    >
      {/* 헤더 */}
      <div className="mb-2 flex h-8 items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <div className="flex items-center gap-2">
          {hasTableView && (
            <div className="flex rounded-full border border-gray-200 bg-gray-50 p-0.5">
              <button
                className={`rounded-full px-2 py-0.5 text-xs transition-colors ${!isTableView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => onToggleView(false)}
              >
                Chart
              </button>
              <button
                className={`rounded-full px-2 py-0.5 text-xs transition-colors ${isTableView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                onClick={() => onToggleView(true)}
              >
                Table
              </button>
            </div>
          )}
          {hasXButton && (
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={onClose}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 컨텐츠 */}
      <div className="h-full w-full flex-1 overflow-hidden">
        {isTableView ? tableContent : children}
      </div>
    </div>
  );
}
