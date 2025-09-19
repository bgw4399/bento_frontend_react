import React, { useState, useRef } from 'react';
import StackedBarChart from './StackedBarChart.jsx';

export default function StackedBarChartWrapper({
  data,
  cohortColorMap,
  cohortTotalCounts,
}) {
  const { domainKey, transformedData, top10ItemNames, orderedCohorts } = data;

  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const containerRef = useRef(null);

  const handleMouseOver = (event, d, cohort) => {
    const value = d[1] - d[0];
    const total = cohortTotalCounts[cohort];
    const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : 0;
    const itemName = d.data[domainKey];

    const content = `
        <div class="p-1">
          <div class="text-[10px] font-semibold mb-0.5">${itemName}</div>
          <div class="text-[9px] text-gray-600">
            ${cohort}:
            <span class="ml-0.5 font-medium">${value.toLocaleString()}</span><br/>
            <span class="text-gray-400 ml-0.5">
              (${value}/${total} ${percentage}%)
            </span>
          </div>
        </div>
      `;

    const containerRect = containerRef.current.getBoundingClientRect();
    const tooltipX = event.clientX - containerRect.left + 15;
    const tooltipY = event.clientY - containerRect.top;

    setTooltip({ visible: true, content, x: tooltipX, y: tooltipY });
  };

  const handleMouseOut = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="relative h-full w-full" ref={containerRef}>
      <StackedBarChart
        stackData={transformedData}
        itemNames={top10ItemNames}
        cohortColorMap={cohortColorMap}
        orderedCohorts={orderedCohorts}
        domainKey={domainKey}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
      />
      {tooltip.visible && (
        <div
          className="pointer-events-none absolute z-50 rounded-md border border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm transition-all duration-75"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
    </div>
  );
}
