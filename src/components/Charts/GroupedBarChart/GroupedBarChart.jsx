import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import './GroupedBarChart.css'; // 아래에서 만들 CSS 파일을 import 합니다.

const GroupedBarChart = ({ data }) => {
  const svgContainerRef = useRef(null);

  const getTargetName = useCallback(
    (id) => {
      return data.targetNames && data.targetNames[id]
        ? data.targetNames[id]
        : id;
    },
    [data.targetNames],
  );

  const transformData = useCallback(
    (chartData) => {
      if (!chartData || !chartData.definition || !chartData.result) return [];
      const groups = chartData.definition.groups.map((g) => g.name);
      const transformedData = [];
      chartData.result.forEach((result) => {
        result.values.forEach((value, index) => {
          transformedData.push({
            group: groups[index],
            target: getTargetName(result.cohortId ?? result.personId),
            value: value,
          });
        });
      });
      return transformedData;
    },
    [getTargetName],
  );

  const drawChart = useCallback(() => {
    if (!data || !data.definition || !data.result || !svgContainerRef.current)
      return;

    const svgContainer = svgContainerRef.current;
    const chartData = transformData(data);
    if (chartData.length === 0) {
      svgContainer.innerHTML = ''; // 데이터 없을 때 차트 비우기
      return;
    }

    const containerRect = svgContainer.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;

    const marginLeft = 50,
      marginRight = 20,
      marginTop = 40,
      marginBottom = 30;

    svgContainer.innerHTML = '';

    const fx = d3
      .scaleBand()
      .domain(data.definition.groups.map((g) => g.name))
      .rangeRound([marginLeft, width - marginRight])
      .paddingInner(0.1);
    const targets = data.result.map((r) =>
      getTargetName(r.cohortId ?? r.personId),
    );
    const x = d3
      .scaleBand()
      .domain(targets)
      .rangeRound([0, fx.bandwidth()])
      .padding(0.05);
    const customColors = [
      '#4595EC',
      '#FF6B6B',
      '#FFD166',
      '#06D6A0',
      '#9D8DF1',
    ];
    const color = d3
      .scaleOrdinal()
      .domain(targets)
      .range(customColors)
      .unknown('#ccc');
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(chartData, (d) => d.value)])
      .nice()
      .range([height - marginBottom, marginTop]);

    const svg = d3
      .create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    const tooltip = d3
      .select(document.body)
      .append('div')
      .attr(
        'class',
        'grouped-barchart-tooltip fixed hidden bg-black/80 text-white px-3 py-2 rounded-md text-xs pointer-events-none',
      );

    svg
      .append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(
        d3
          .axisLeft(y)
          .tickSize(-(width - marginRight - marginLeft))
          .tickFormat(''),
      )
      .call((g) => g.select('.domain').remove())
      .call((g) =>
        g
          .selectAll('.tick line')
          .attr('stroke', '#e0e0e0')
          .attr('stroke-opacity', 0.5)
          .attr('stroke-dasharray', '2,2'),
      );

    svg
      .append('g')
      .selectAll('g')
      .data(d3.group(chartData, (d) => d.group))
      .join('g')
      .attr('transform', ([group]) => `translate(${fx(group)},0)`)
      .selectAll('rect')
      .data(([, d]) => d)
      .join('rect')
      .attr('x', (d) => x(d.target))
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => y(0) - y(d.value))
      .attr('fill', (d) => color(d.target))
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', d3.color(color(d.target)).brighter(0.5));
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>${d.group}</strong> | ${d.target}<br/>Value: ${d.value}`,
          );
      })
      .on('mousemove', function (event) {
        tooltip
          .style('top', event.pageY - 10 + 'px')
          .style('left', event.pageX + 10 + 'px');
      })
      .on('mouseout', function (event, d) {
        d3.select(this).attr('fill', color(d.target));
        tooltip.style('visibility', 'hidden');
      });

    svg
      .append('g')
      .attr('transform', `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(fx))
      .call((g) => g.select('.domain').remove());
    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(5, 's'))
      .call((g) => g.select('.domain').remove());

    const legend = svg
      .append('g')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'start');
    const legendItems = legend
      .selectAll('g')
      .data(targets.slice())
      .join('g')
      .attr(
        'transform',
        (d, i) =>
          `translate(${width - marginRight - 100}, ${marginTop + i * 20})`,
      );
    legendItems
      .append('rect')
      .attr('x', 0)
      .attr('width', 19)
      .attr('height', 19)
      .attr('fill', color);
    legendItems
      .append('text')
      .attr('x', 24)
      .attr('y', 9.5)
      .attr('dy', '0.35em')
      .text((d) => d);

    svgContainer.appendChild(svg.node());
    return tooltip;
  }, [data, getTargetName, transformData]);

  useEffect(() => {
    let tooltip;
    const observer = new ResizeObserver(() => {
      tooltip = drawChart();
    });

    if (svgContainerRef.current) {
      observer.observe(svgContainerRef.current);
      tooltip = drawChart();
    }

    return () => {
      if (svgContainerRef.current) {
        observer.unobserve(svgContainerRef.current);
      }
      // 컴포넌트가 사라질 때 body에 추가된 툴팁을 제거
      d3.selectAll('.grouped-barchart-tooltip').remove();
    };
  }, [drawChart]);

  return (
    <div
      ref={svgContainerRef}
      className="relative flex h-full w-full items-center justify-center"
    ></div>
  );
};

export default GroupedBarChart;
