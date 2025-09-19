import React, { useState, useMemo } from 'react';
import DonutChart from './DonutChart.jsx';
import Legend from './Legend.jsx';

export default function GroupDonutChartWrapper({ data = [] }) {
  const [hoveredLabel, setHoveredLabel] = useState(null);

  const { processedData, legendData } = useMemo(() => {
    const pData =
      data?.map((cohort) => ({ name: cohort.cohortName, data: cohort.data })) ||
      [];
    const allUniqueData = pData.reduce((acc, cohort) => {
      if (cohort.data && typeof cohort.data === 'object') {
        Object.entries(cohort.data).forEach(([label, value]) => {
          if (!acc.find((d) => d.label === label)) acc.push({ label, value });
        });
      }
      return acc;
    }, []);
    const lData = allUniqueData.reduce((acc, item) => {
      acc[item.label] = item.value;
      return acc;
    }, {});
    return { processedData: pData, legendData: lData };
  }, [data]);

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="w-full overflow-x-auto">
        <div
          className="flex flex-row items-start justify-center gap-2 px-4"
          style={{ minWidth: '400px' }}
        >
          {processedData.map((chart) => (
            <div
              key={chart.name}
              className="flex w-[200px] flex-col items-center"
            >
              <DonutChart
                data={chart.data}
                hoveredLabel={hoveredLabel}
                width={150}
                height={150}
                onHoveredLabelChange={setHoveredLabel}
              />
              <span
                className="break-words text-center text-sm font-medium text-gray-600"
                style={{ maxWidth: '160px' }}
              >
                {chart.name}
              </span>
            </div>
          ))}
        </div>
      </div>
      {processedData.length > 0 && (
        <div className="mt-4">
          <Legend
            data={legendData}
            hoveredLabel={hoveredLabel}
            onHoveredLabelChange={setHoveredLabel}
          />
        </div>
      )}
    </div>
  );
}
