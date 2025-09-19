import React, { useState, useRef } from 'react';
import BarChart from './BarChart.jsx';

export default function BarChartWrapper({
  data = [],
  cohortName = '',
  cohortTotalCount = 0,
}) {
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: '',
  });
  const chartContainerRef = useRef(null);

  const handleMouseOver = (event, d) => {
    const total =
      cohortTotalCount || data.reduce((sum, item) => sum + +item.count, 0);
    const percentage = ((d.count / total) * 100).toFixed(2);

    const content = `
      <div class="p-1">
        <div class="text-[10px] font-semibold mb-0.5">${d.name}</div>
        <div class="text-[9px] text-gray-600">
          ${cohortName}: <span class="ml-0.5 font-medium">${d.count.toLocaleString()}</span><br/>
          <span class="text-gray-400 ml-0.5">(${d.count}/${total} ${percentage}%)</span>
        </div>
      </div>
    `;

    const containerRect = chartContainerRef.current.getBoundingClientRect();

    setTooltip({
      visible: true,
      content: content,
      x: event.clientX - containerRect.left + 10,
      y: event.clientY - containerRect.top + 10,
    });
  };

  const handleMouseOut = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  return (
    <div className="relative h-full w-full" ref={chartContainerRef}>
      <BarChart
        data={data}
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
