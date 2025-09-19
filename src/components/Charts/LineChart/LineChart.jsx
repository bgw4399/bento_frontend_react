import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data = [], cohortColorMap = {}, showLegend = true }) => {
  const chartContainerRef = useRef(null);
  const [visibleSeries, setVisibleSeries] = useState(new Set());

  // Svelte의 $: 와 유사하게, cohortColorMap prop이 변경될 때 visibleSeries 상태를 초기화합니다.
  useEffect(() => {
    setVisibleSeries(new Set(Object.keys(cohortColorMap)));
  }, [cohortColorMap]);

  // 시리즈(라인)의 보임/숨김 상태를 토글하는 함수
  const toggleSeries = useCallback((series) => {
    setVisibleSeries((prev) => {
      const newVisibleSeries = new Set(prev);
      if (newVisibleSeries.has(series)) {
        newVisibleSeries.delete(series);
      } else {
        newVisibleSeries.add(series);
      }
      return newVisibleSeries;
    });
  }, []);

  const drawChart = useCallback(() => {
    if (!chartContainerRef.current || !data || data.length === 0) return;

    const container = chartContainerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const margin = {
      top: 30,
      right: showLegend ? 120 : 30,
      bottom: 50,
      left: 50,
    };

    d3.select(container).selectAll('*').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('display', 'none')
      .style('pointer-events', 'none')
      .style('background', 'white')
      .style('border', '1px solid #eee')
      .style('border-radius', '4px')
      .style('padding', '0')
      .style('z-index', '100');
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

    const xAxis = (g) =>
      g
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end');

    const yAxis = (g) =>
      g.attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y));

    svg.append('g').call(xAxis);
    svg.append('g').call(yAxis);

    const line = d3
      .line()
      .x((d) => x(d.label) + x.bandwidth() / 2)
      .y((d) => y(d.value));

    const seriesData = Array.from(d3.group(data, (d) => d.series));

    seriesData.forEach(([series, values]) => {
      const isVisible = visibleSeries.has(series);
      const opacity = isVisible ? 1 : 0.2;

      // 선과 점을 그리는 로직...
      svg
        .append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', cohortColorMap[series] || '#ccc')
        .attr('stroke-width', 2)
        .attr('d', line)
        .style('opacity', opacity);

      svg
        .selectAll(`circle-${series}`)
        .data(values)
        .join('circle')
        .attr('cx', (d) => x(d.label) + x.bandwidth() / 2)
        .attr('cy', (d) => y(d.value))
        .attr('r', 4)
        .attr('fill', cohortColorMap[series])
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .attr('class', `point-${series}`)
        .style('opacity', opacity)
        .style('pointer-events', isVisible ? 'auto' : 'none')
        .on('mouseover', function (event, d) {
          if (!visibleSeries.has(series)) return;

          d3.select(this).transition().duration(200).attr('r', 6);

          tooltip
            .style('display', 'block')
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px').html(`
                            <div class="p-1">
                                <div class="text-[10px] font-semibold mb-0.5">${series}</div>
                                <div class="text-[9px] text-gray-600">
                                    ${d.label}:
                                    <span class="ml-0.5 font-medium text-black">${d.value.toLocaleString()}</span>
                                </div>
                            </div>
                        `);
        })
        .on('mouseout', function () {
          if (!visibleSeries.has(series)) return;

          d3.select(this).transition().duration(200).attr('r', 4);

          tooltip.style('display', 'none');
        });
    });

    // ... 범례 그리기 로직 (클릭 시 toggleSeries 호출)
    if (showLegend) {
      const legend = svg
        .append('g')
        .attr(
          'transform',
          `translate(${width - margin.right + 10}, ${margin.top})`,
        );

      legend
        .selectAll('g')
        .data(seriesData)
        .join('g')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`)
        .attr('cursor', 'pointer')
        .on('click', (event, d) => toggleSeries(d[0]))
        .call((g) => {
          g.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', (d) => cohortColorMap[d[0]])
            .style('opacity', (d) => (visibleSeries.has(d[0]) ? 1 : 0.2));
          g.append('text')
            .attr('x', 20)
            .attr('y', 9.5)
            .text((d) => d[0]);
        });
    }
  }, [data, cohortColorMap, showLegend, visibleSeries, toggleSeries]);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      drawChart();
    });

    if (chartContainerRef.current) {
      observer.observe(chartContainerRef.current);
    }

    // 최초 렌더링 시 차트 그리기
    drawChart();

    return () => {
      if (chartContainerRef.current) {
        observer.unobserve(chartContainerRef.current);
      }
      d3.select('body').selectAll('.tooltip').remove();
    };
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
};

export default LineChart;
