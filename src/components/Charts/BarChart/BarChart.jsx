import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { SINGLE_DATA_COLOR } from '../../../constants'; // 경로 수정 필요

export default function BarChart({
  data = [],
  onMouseOver = () => {},
  onMouseOut = () => {},
}) {
  const chartContainerRef = useRef(null);
  const tooltipRef = useRef(null);

  const drawChart = useCallback(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const container = chartContainerRef.current;
    const { width, height } = container.getBoundingClientRect();

    const margin = { top: 30, right: 80, bottom: 10, left: 140 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);

    d3.select(container).selectAll('*').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => +d.count || 0)])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleBand()
      .domain(data.map((d) => d.name))
      .range([0, height - margin.bottom - margin.top])
      .padding(0.4);

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisTop(xScale).ticks(5).tickFormat(d3.format(',.0f')))
      .call((g) => g.selectAll('.domain').remove());

    // Y축
    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call((g) => {
        const axis = d3.axisLeft(yScale);
        g.call(axis);
        g.selectAll('.domain').remove();

        const maxLength = 20;
        g.selectAll('text').text(function (d) {
          return d.length > maxLength ? d.slice(0, maxLength - 1) + '…' : d;
        });
      });

    svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', 0)
      .attr('y', (d) => yScale(d.name))
      .attr('width', (d) => Math.max(0, xScale(d.count)))
      .attr('height', yScale.bandwidth())
      .attr('fill', SINGLE_DATA_COLOR)
      .on('mouseover', (event, d) => {
        onMouseOver(event, d); // 부모 컴포넌트의 함수 호출
        d3.select(event.currentTarget)
          .style('stroke', '#666')
          .style('stroke-width', '2px');
      })
      .on('mouseout', (event) => {
        onMouseOut(); // 부모 컴포넌트의 함수 호출
        d3.select(event.currentTarget).style('stroke', 'none');
      });
  }, [data, onMouseOver, onMouseOut]);

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, [drawChart]);

  return (
    <div className="relative h-full w-full">
      {(!data || data.length === 0) && (
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
