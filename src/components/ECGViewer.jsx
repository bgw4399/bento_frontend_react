import React, { useState, useEffect, useRef } from 'react';
import { xmlParseToJson } from '../ecgparse'; // ecgparse.js 유틸리티 필요
import * as d3 from 'd3';

export default function ECGViewer({ filePath }) {
  const containerRef = useRef(null);
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    const renderCharts = async () => {
      if (!showCharts || !containerRef.current) return;

      const xml = await xmlParseToJson(filePath);
      const container = containerRef.current;

      function decodeBase64ToInt16Array(base64, unitsPerBit = 1) {
        const binary = atob(base64);
        const len = binary.length / 2;
        const int16 = new Int16Array(len);
        for (let i = 0; i < len; i++) {
          const lo = binary.charCodeAt(i * 2);
          const hi = binary.charCodeAt(i * 2 + 1);
          int16[i] = (hi << 8) | lo;
        }
        return Array.from(int16).map((v) => v * unitsPerBit);
      }

      function drawLeadChart(container, values, duration, leadId) {
        const margin = { top: 20, right: 10, bottom: 10, left: 30 };
        const width = 250;
        const height = 150;

        const xScale = d3
          .scaleLinear()
          .domain([0, duration])
          .range([margin.left, width - margin.right]);
        const yExtent = d3.extent(values);
        const yScale = d3
          .scaleLinear()
          .domain(yExtent)
          .range([height - margin.bottom, margin.top]);
        const line = d3
          .line()
          .x((d, i) => xScale(i * (duration / values.length)))
          .y((d) => yScale(d));

        const svg = d3
          .select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height);
        svg
          .append('rect')
          .attr('width', '100%')
          .attr('height', '100%')
          .attr('fill', 'white');
        svg
          .append('text')
          .attr('x', margin.left)
          .attr('y', 15)
          .attr('fill', '#333')
          .text(leadId);
        svg
          .append('path')
          .datum(values)
          .attr('fill', 'none')
          .attr('stroke', '#007acc')
          .attr('stroke-width', 1)
          .attr('d', line);
      }

      async function renderAllECGWaveforms(container, waveformList) {
        if (!container) return;
        d3.select(container).selectAll('*').remove();

        waveformList.forEach((waveform) => {
          const SampleBase = waveform.SampleBase;
          const waveformContainer = d3
            .select(container)
            .append('div')
            .attr('class', 'waveformContainer')
            .style('display', 'flex')
            .style('overflow-x', 'auto');

          waveform.LeadData.forEach((lead) => {
            const {
              LeadID,
              LeadSampleCountTotal,
              LeadAmplitudeUnitsPerBit,
              WaveFormData,
            } = lead;
            const duration = LeadSampleCountTotal / SampleBase;
            const decoded = decodeBase64ToInt16Array(
              WaveFormData,
              LeadAmplitudeUnitsPerBit,
            );
            const leadContainer = waveformContainer
              .append('div')
              .attr('class', 'leadContainer')
              .style('margin-bottom', '24px')
              .node();

            drawLeadChart(leadContainer, decoded, duration, LeadID);
          });
        });
      }

      // 메인 실행 로직
      const init = async () => {
        const xml = await xmlParseToJson(filePath);
        renderAllECGWaveforms(containerRef.current, xml);
      };

      init();
    };

    renderCharts();
  }, [showCharts, filePath]); // showCharts나 filePath가 바뀔 때마다 다시 그림

  return (
    <>
      <button
        className="mb-2 rounded bg-blue-500 px-3 py-1 text-white hover:bg-blue-600"
        onClick={() => setShowCharts((prev) => !prev)}
      >
        {showCharts ? 'Hide ECG Graphs' : 'Show ECG Graphs'}
      </button>
      <div
        ref={containerRef}
        className="max-h-[1000px] overflow-hidden transition-all duration-500"
        style={{
          opacity: showCharts ? 1 : 0,
          height: showCharts ? 'auto' : '0',
          pointerEvents: showCharts ? 'auto' : 'none',
        }}
      ></div>
    </>
  );
}
