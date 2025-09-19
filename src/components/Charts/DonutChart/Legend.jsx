import React from 'react';
import * as d3 from 'd3';
import './Legend.css';

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

export default function Legend({
  data = {},
  hoveredLabel,
  onHoveredLabelChange,
}) {
  const processedData = Object.entries(data);

  return (
    <div className="legend-container">
      {processedData.map(([label, value]) => (
        <div
          key={label}
          role="button"
          tabIndex="0"
          className={`legend-item ${hoveredLabel && hoveredLabel !== label ? 'opacity-30' : ''}`}
          onMouseEnter={() => onHoveredLabelChange(label)}
          onMouseLeave={() => onHoveredLabelChange(null)}
        >
          <div
            className="legend-color-dot"
            style={{ backgroundColor: colorScale(label) }}
          ></div>
          <span className="legend-label">{label}</span>
        </div>
      ))}
    </div>
  );
}
