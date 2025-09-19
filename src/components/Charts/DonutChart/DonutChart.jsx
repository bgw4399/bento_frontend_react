import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import './DonutChart.css';

const colorScale = d3
  .scaleOrdinal()
  .domain([
    'MALE',
    'FEMALE',
    'UNKNOWN',
    'alive',
    'deceased',
    'Inpatient Visit',
    'Ambulatory Surgical Center',
    'Emergency Room and Inpatient Visit',
    'Emergency Room - Hospital',
    'Observation Room',
    'Ambulatory Clinic / Center',
  ])
  .range([
    '#3498db',
    '#F9A7B0',
    '#808080',
    '#4CAF50',
    '#5E6C7F',
    '#4F8EF7',
    '#F78CA2',
    '#FFD166',
    '#06D6A0',
    '#9B5DE5',
    '#43AA8B',
    '#FF61A6',
    '#3A86FF',
    '#FFBE0B',
  ]);

export default function DonutChart({
  data = {},
  hoveredLabel = null,
  width = 200,
  height = 200,
  onHoveredLabelChange = () => {},
}) {
  const radius = Math.min(width, height) / 2;

  const { pieData, total } = useMemo(() => {
    const processedData =
      typeof data === 'object' && data !== null ? Object.entries(data) : [];
    if (processedData.length === 0) return { pieData: [], total: 0 };

    const pie = d3
      .pie()
      .sort(null)
      .value((d) => d[1]);
    const total = processedData.reduce((sum, [_, value]) => sum + value, 0);
    return { pieData: pie(processedData), total };
  }, [data]);

  if (pieData.length === 0 || total === 0) {
    return (
      <div
        className="no-data-container"
        style={{ height: `${height}px`, width: `${width}px` }}
      >
        <p>Currently, no data is available for display.</p>
      </div>
    );
  }

  const arcGenerator = d3
    .arc()
    .innerRadius(radius * 0.2)
    .outerRadius(radius * 0.8);
  const arcHoverGenerator = d3
    .arc()
    .innerRadius(radius * 0.18)
    .outerRadius(radius * 0.82);

  return (
    <div className="chart-container">
      <svg
        width={width}
        height={height}
        viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
      >
        <g className="chart-inner">
          {pieData.map((slice) => {
            const isHovered = hoveredLabel === slice.data[0];
            return (
              <path
                key={slice.data[0]}
                d={isHovered ? arcHoverGenerator(slice) : arcGenerator(slice)}
                fill={colorScale(slice.data[0])}
                className="slice"
                onMouseEnter={() => onHoveredLabelChange(slice.data[0])}
                onMouseLeave={() => onHoveredLabelChange(null)}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
