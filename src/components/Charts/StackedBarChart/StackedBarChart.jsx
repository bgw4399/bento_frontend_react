import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';

export default function StackedBarChart({
  stackData = [],
  itemNames = [],
  cohortColorMap = {},
  orderedCohorts = [],
  domainKey = '',
}) {
  const chartContainerRef = useRef(null);

  const drawChart = useCallback(() => {
    const container = chartContainerRef.current;
    if (!container || stackData.length === 0) return;

    const { width, height } = container.getBoundingClientRect();
    const margin = { top: 30, right: 80, bottom: 10, left: 140 };

    d3.select(container).selectAll('*').remove();

    const stack = d3
      .stack()
      .keys(orderedCohorts)
      .value((d, key) => +d[key] || 0);
    const series = stack(stackData);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(series, (d) => d3.max(d, (d) => d[1]))])
      .range([0, width - margin.left - margin.right]);

    const yScale = d3
      .scaleBand()
      .domain(itemNames)
      .range([0, height - margin.bottom - margin.top])
      .padding(0.4);

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisTop(xScale).ticks(5).tickFormat(d3.format(',.0f')))
      .call((g) => g.selectAll('.domain').remove());

    // Y축
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(yScale))
      .call((g) => g.selectAll('.domain').remove());

    // 스택 막대 그룹
    const groups = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .selectAll('g')
      .data(series)
      .join('g')
      .attr('fill', (d) => cohortColorMap[d.key]);

    // 각 막대 (rect)
    groups
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => xScale(d[0]))
      .attr('y', (d) => yScale(d.data[domainKey]))
      .attr('width', (d) => xScale(d[1]) - xScale(d[0]))
      .attr('height', yScale.bandwidth())
      .on('mouseover', function (event, d) {
        const currentCohort = d3.select(this.parentNode).datum().key;
        onMouseOver(event, d, currentCohort);
      })
      .on('mouseout', onMouseOut);
  }, [
    stackData,
    itemNames,
    cohortColorMap,
    orderedCohorts,
    domainKey,
    onMouseOver,
    onMouseOut,
  ]);

  useEffect(() => {
    const observer = new ResizeObserver(() => drawChart());
    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }
    drawChart();
    return () => {
      if (chartContainerRef.current)
        observer.unobserve(chartContainerRef.current);
      d3.select('body').selectAll('.tooltip').remove();
    };
  }, [drawChart]);

  return (
    <div className="relative h-full w-full">
      {stackData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-center text-xs text-gray-500">
            Currently, no data is available for display.
          </p>
        </div>
      )}
      <div ref={chartContainerRef} className="h-full w-full"></div>
    </div>
  );
}
