import React, { useState, useMemo } from 'react';
import * as d3 from 'd3';
import './BarChartVertical.css';

export default function BarChartVertical({ data = [] }) {
  const [hoveredBar, setHoveredBar] = useState(null);

  const width = 600;
  const height = 400;
  const margin = { top: 20, right: 30, bottom: 40, left: 40 };

  const { xScale, yScale } = useMemo(() => {
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value)])
      .nice()
      .range([height - margin.bottom, margin.top]);

    return { xScale: x, yScale: y };
  }, [data]);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <g fill="steelblue">
        {data.map((d, i) => (
          <React.Fragment key={d.label}>
            <rect
              x={xScale(d.label)}
              y={yScale(d.value)}
              width={xScale.bandwidth()}
              height={height - margin.bottom - yScale(d.value)}
              className="bar"
              rx="5"
              ry="5"
              onMouseEnter={() => setHoveredBar(d)}
              onMouseLeave={() => setHoveredBar(null)}
              style={{
                animation: `slideUp ${300 + i * 100}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              }}
            />

            {/* 호버 시 값 표시 */}
            {hoveredBar === d && (
              <text
                x={xScale(d.label) + xScale.bandwidth() / 2}
                y={yScale(d.value) - 10}
                textAnchor="middle"
                className="value-text"
              >
                {d.value}
              </text>
            )}
          </React.Fragment>
        ))}
      </g>

      <g transform={`translate(0,${height - margin.bottom})`}>
        {data.map((d) => (
          <text
            key={d.label}
            x={xScale(d.label) + xScale.bandwidth() / 2}
            y="20"
            textAnchor="middle"
            className={`axis-label ${hoveredBar === d ? 'bold' : ''}`}
          >
            {d.label}
          </text>
        ))}
      </g>

      <g transform={`translate(${margin.left},0)`}>
        {yScale.ticks(5).map((tick) => (
          <text
            key={tick}
            x="-10"
            y={yScale(tick)}
            textAnchor="end"
            alignmentBaseline="middle"
            className="axis-label"
          >
            {tick}
          </text>
        ))}
      </g>
    </svg>
  );
}
