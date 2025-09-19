import React, { useState } from 'react';
import DonutChart from './DonutChart.jsx';
import Legend from './Legend.jsx';

export default function SingleDonutChartWrapper({ data = {} }) {
  const [hoveredLabel, setHoveredLabel] = useState(null);

  return (
    <div className="flex h-full w-full flex-col items-center justify-start">
      <div className="flex items-center justify-center">
        <DonutChart
          data={data}
          hoveredLabel={hoveredLabel}
          width={200}
          height={200}
          onHoveredLabelChange={setHoveredLabel}
        />
      </div>
      <div className="w-full">
        <Legend
          data={data}
          hoveredLabel={hoveredLabel}
          onHoveredLabelChange={setHoveredLabel}
        />
      </div>
    </div>
  );
}
