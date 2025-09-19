import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as d3 from 'd3';

import { transformDonutChartToTableData } from '../../components/Charts/DonutChart/donutChartTransformer.js';

// Component Imports
import LoadingComponent from '../../components/LoadingComponent.jsx';
import Footer from '../../components/Footer.jsx';
import ChartCard from '../../components/ChartCard.jsx';
import DataTable from '../../components/DataTable.jsx';
import SingleDonutChartWrapper from '../../components/Charts/DonutChart/SingleDonutChartWrapper.jsx';
import BarChartWrapper from '../../components/Charts/BarChart/BarChartWrapper.jsx';
import BarChartTableView from '../../components/Charts/BarChart/BarChartTableView.jsx';
import CDMInfo from '../../components/Table/CDMInfo.jsx';
import Condition from '../../components/Table/Condition.jsx';
import Drug from '../../components/Table/Drug.jsx';
import Measurement from '../../components/Table/Measurement.jsx';
import Observation from '../../components/Table/Observation.jsx';
import ProcedureOccurrence from '../../components/Table/ProcedureOccurrence.jsx';
import Specimen from '../../components/Table/Specimen.jsx';
import BioSignal from '../../components/Table/BioSignal.jsx';

const API_URI = import.meta.env.VITE_PUBLIC_API_URI;

const tableComponents = {
  condition: Condition,
  drug: Drug,
  measurement: Measurement,
  observation: Observation,
  procedure_occurrence: ProcedureOccurrence,
  specimen: Specimen,
  bio_signal: BioSignal,
};

const MARGIN = { top: 20, right: 20, bottom: 30, left: 130 };
const BAR_HEIGHT = 20;
const ROW_GAP = 25;
const DEATH_BAR_WIDTH = 5;
const visitMapping = {
  9203: [0, 'Emergency Room Visit', '#FF6B6B'], // 응급
  9201: [1, 'Inpatient Visit', '#4ECDC4'], // 입원
  9202: [2, 'Outpatient Visit', '#45B7D1'], // 외래
  581477: [3, 'Home Visit', '#FFD166'], // 가정
  581385: [4, 'Observation Room', '#BDC3C7'],
  38004207: [5, 'Ambulatory Clinic / Center', '#9B5DE5'],
};

export default function PersonDetailPage() {
  const { personId } = useParams();
  const timelineContainerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('Loading data...');
  const [personData, setPersonData] = useState(null);
  const [personVisits, setPersonVisits] = useState([]);
  const [personStatistics, setPersonStatistics] = useState(null);
  const [tableProps, setTableProps] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [isStatisticsView, setIsStatisticsView] = useState(false);
  const [isTableView, setIsTableView] = useState({});
  const [isSelectTableOpen, setIsSelectTableOpen] = useState(false);
  const [selectItems, setSelectItems] = useState([
    { id: 'condition', name: 'Condition', checked: true },
    { id: 'drug', name: 'Drug', checked: true },
    { id: 'measurement', name: 'Measurement', checked: true },
    { id: 'observation', name: 'Observation', checked: true },
    { id: 'procedure_occurrence', name: 'Procedure Occurrence', checked: true },
    { id: 'specimen', name: 'Specimen', checked: true },
    { id: 'bio_signal', name: 'Bio Signal', checked: true },
  ]);
  const [visibleCharts, setVisibleCharts] = useState([
    'visitTypeRatio',
    'departmentVisits',
    'topTenDrugs',
    'topTenConditions',
    'topTenProcedures',
    'topTenMeasurements',
  ]);

  const handleCloseChart = (chartId) => {
    setVisibleCharts((prev) => prev.filter((id) => id !== chartId));
  };
  const handleCheckboxChange = (itemId) => {
    setSelectItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!personId) return;

      setIsLoading(true);
      setMessage('Loading data...');
      try {
        // const [personRes, visitsRes, statsRes] = await Promise.all([
        //     fetch(`${API_URI}/api/person/${personId}/`),
        //     fetch(`${API_URI}/api/person/${personId}/visit/`),
        //     fetch(`${API_URI}/api/person/${personId}/statistics/`)
        // ]);

        // setPersonData(await personRes.json());
        // setPersonVisits(await visitsRes.json());
        // setPersonStatistics(await statsRes.json());
        setIsLoading(true);
        setMessage('Loading data...');
        setPersonData(null);
        setPersonVisits([]);
        setPersonStatistics(null);
        const allPeopleRes = await fetch('/cdm_sample_data.json');
        const allPeopleData = await allPeopleRes.json();
        const personJson = allPeopleData[personId];
        if (!personJson)
          throw new Error(`Person with ID ${personId} not found`);
        setPersonData(personJson);

        // 2. Visit 정보 가져오기 -> visit-testdata.json 사용
        const allVisitsRes = await fetch('/visit-testdata.json');
        const allVisitsData = await allVisitsRes.json();
        const visitsJson = allVisitsData.filter(
          (visit) => visit.personid == personId,
        );
        setPersonVisits(visitsJson);

        // 3. Statistics 정보 가져오기 -> 각 통계 json 파일 사용
        const genderRes = await fetch('/gender-testdata.json');
        const ageRes = await fetch('/patientAge-testdata.json');
        const drugRes = await fetch('/topTenDrug-testdata.json');
        const deathRes = await fetch('/deathRatio-testdata.json');
        // const conditionRes = await fetch('/topTenCondition-testdata.json');
        // const procedureRes = await fetch('/topTenProcedure-testdata.json');
        // const measurementRes = await fetch('/topTenMeasurement-testdata.json');

        const statsJson = {
          visitType: await deathRes.json(),
          departmentVisit: await genderRes.json(),
          topTenDrug: await drugRes.json(),
          // topTenCondition: await conditionRes.json(),
          // topTenProcedure: await procedureRes.json(),
          // topTenMeasurement: await measurementRes.json(),
        };

        setPersonStatistics(statsJson);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        setMessage('Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [personId]);
  useEffect(() => {
    if (personData) {
      // personData에서 각 테이블에 필요한 데이터를 추출하여 newTableProps 객체를 만듭니다.
      const newTableProps = {
        cdm_info: {
          careSite: personData.care_site,
          location: personData.location,
          visitOccurrence: personData.visit_occurrence[0], // 대표로 첫 번째 방문 정보를 표시
        },
        condition: {
          conditionEra: personData.condition_era,
          conditionOccurrence: personData.condition_occurrence,
        },
        drug: { drugExposure: personData.drug_exposure },
        measurement: { measurement: personData.measurement },
        observation: { observation: personData.observation },
        procedure_occurrence: {
          procedureOccurrence: personData.procedure_occurrence,
        },
        specimen: { specimen: personData.specimen },
        bio_signal: { bioSignal: personData.bio_signal },
      };
      // 완성된 props 객체를 tableProps state에 저장합니다.
      setTableProps(newTableProps);
    }
  }, [personData]);
  const fetchDataById = useCallback(async (id) => {
    setMessage('Loading Table...');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URI}/api/visit/${id}/`);
      const fullData = await res.json();
      const newTableProps = {
        cdm_info: {
          careSite: fullData?.care_site,
          location: fullData?.location,
          visitOccurrence: fullData?.visitInfo,
        },
        condition: {
          conditionEra: fullData?.conditionEras,
          conditionOccurrence: fullData?.conditions,
        },
        drug: { drugExposure: fullData?.drugs },
      };
      setTableProps(newTableProps);
      setIsStatisticsView(true);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const drawTimeline = useCallback(() => {
    if (
      !timelineContainerRef.current ||
      !personVisits ||
      personVisits.length === 0
    )
      return;

    const container = timelineContainerRef.current;
    const { width, height } = container.getBoundingClientRect();
    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;
    let xScale, xAxisGroup;

    // --- Helper Functions ---
    function initializeSvg(_width, _height) {
      let svg = d3.select(container).select('svg');
      if (!svg.node()) {
        svg = d3
          .select(container)
          .append('svg')
          .attr('width', _width)
          .attr('height', _height)
          .style('border', '1px solid #d1d5db')
          .style('border-radius', '6px');
      }
      svg.selectAll('*').remove();
      return svg;
    }

    function setupScales(_width) {
      let minStart = new Date(
        Math.min(...personVisits.map((d) => new Date(d.visit_start_date))),
      );
      let maxEnd = new Date(
        Math.max(...personVisits.map((d) => new Date(d.visit_end_date))),
      );
      minStart.setDate(minStart.getDate() - 360);
      maxEnd.setDate(maxEnd.getDate() + 360);
      return d3
        .scaleTime()
        .domain([minStart, maxEnd])
        .range([MARGIN.left, _width - MARGIN.right - 50]);
    }

    function setupClipPath(svg) {
      svg
        .append('defs')
        .append('clipPath')
        .attr('id', 'clip-timeline')
        .append('rect')
        .attr('x', MARGIN.left + 50)
        .attr('y', 0)
        .attr('width', innerWidth)
        .attr('height', innerHeight);
    }

    function setupTooltip() {
      let tooltip = d3.select(container).select('.tooltip');
      if (tooltip.empty()) {
        tooltip = d3
          .select(container)
          .append('div')
          .attr('class', 'tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(0,0,0,0.7)')
          .style('color', 'white')
          .style('padding', '5px')
          .style('border-radius', '5px')
          .style('font-size', '12px')
          .style('visibility', 'hidden');
      }
      return tooltip;
    }

    function groupOverlappingVisits(visits) {
      const groups = [];
      const visitsByType = d3.group(visits, (d) => d.visit_concept_id);
      visitsByType.forEach((typeVisits) => {
        const sorted = typeVisits
          .slice()
          .sort(
            (a, b) =>
              new Date(a.visit_start_date) - new Date(b.visit_start_date),
          );
        const typeGroups = [];
        for (const visit of sorted) {
          const vStart = new Date(visit.visit_start_date);
          const vEnd = new Date(visit.visit_end_date);
          let placed = false;
          for (const group of typeGroups) {
            const gEnd = new Date(group.end);
            if (vStart <= gEnd) {
              group.items.push(visit);
              group.end = new Date(Math.max(gEnd.getTime(), vEnd.getTime()));
              placed = true;
              break;
            }
          }
          if (!placed) {
            typeGroups.push({ start: vStart, end: vEnd, items: [visit] });
          }
        }
        groups.push(...typeGroups);
      });
      return groups;
    }

    function drawYAxis(svg) {
      const entries = Object.entries(visitMapping);
      const labelGroup = svg
        .append('g')
        .attr('transform', `translate(${MARGIN.left + 50}, ${MARGIN.top})`);

      labelGroup
        .selectAll('text')
        .data(entries)
        .enter()
        .append('text')
        .attr('x', 0)
        .attr('y', ([id]) => visitMapping[id][0] * ROW_GAP + 10)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('alignment-baseline', 'middle')
        .text(([_, [, label]]) => label);

      const guideLines = svg
        .append('g')
        .attr('transform', `translate(0, ${MARGIN.top})`);

      guideLines
        .selectAll('line')
        .data(entries)
        .enter()
        .append('line')
        .attr('x1', MARGIN.left + 50)
        .attr('x2', innerWidth + MARGIN.left)
        .attr('y1', ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
        .attr('y2', ([id]) => visitMapping[id][0] * ROW_GAP - 2.5)
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    }
    function drawXAxis(svg) {
      const axis = d3.axisBottom(xScale).ticks(10);
      xAxisGroup = svg
        .append('g')
        .attr('transform', `translate(50,${innerHeight})`)
        .call(axis);
    }
    function darkenColor(hex, amount = 0.1) {
      const color = d3.color(hex);
      if (!color) return hex;

      const hsl = d3.hsl(color);
      hsl.l = Math.max(0, hsl.l - amount); // lightness 낮추기 (0~1)
      return hsl.formatHex();
    }
    function showTooltip(event, tooltip, text) {
      tooltip
        .style('visibility', 'visible')
        .style('white-space', 'pre')
        .text(text);
    }
    function moveTooltip(event, tooltip) {
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      const svgRect = container.getBoundingClientRect();
      const pageX = event.clientX - svgRect.left;
      const pageY = event.clientY - svgRect.top;

      let tooltipX = pageX + 10;
      let tooltipY = pageY - 30;

      if (tooltipX + tooltipWidth > svgRect.width)
        tooltipX = pageX - tooltipWidth - 10;
      if (tooltipY + tooltipHeight > svgRect.height)
        tooltipY = pageY - tooltipHeight - 10;

      tooltip.style('top', `${tooltipY}px`).style('left', `${tooltipX}px`);
    }

    function drawBars(svg, tooltip) {
      const barGroup = svg
        .append('g')
        .attr('transform', `translate(0,${MARGIN.top})`)
        .attr('clip-path', 'url(#clip-timeline)');
      const grouped = groupOverlappingVisits(personVisits);

      if (personData.death) {
        barGroup
          .append('rect')
          .attr('class', 'death-bar')
          .attr('x', xScale(new Date(personData.death.death_date)))
          .attr('y', 0)
          .attr('width', DEATH_BAR_WIDTH)
          .attr('height', innerHeight - 20)
          .attr('fill', 'black')
          .attr('opacity', 1)
          .on('mouseover', (event) =>
            showTooltip(
              event,
              tooltip,
              `death_concept : ${personData.death.cause_concept_id}\ndeath_date : ${personData.death.death_date}`,
            ),
          )
          .on('mousemove', (event) => moveTooltip(event, tooltip))
          .on('mouseout', () => tooltip.style('visibility', 'hidden'));
      }

      barGroup
        .selectAll('rect.visit-bar')
        .data(grouped)
        .enter()
        .append('rect')
        .attr('class', 'visit-bar')
        .attr('x', (d) => xScale(new Date(d.start)))
        .attr(
          'y',
          (d) => visitMapping[d.items[0].visit_concept_id]?.[0] * ROW_GAP,
        )
        .attr('width', (d) =>
          Math.max(xScale(new Date(d.end)) - xScale(new Date(d.start)), 5),
        )
        .attr('height', BAR_HEIGHT)
        .attr('fill', (d) => {
          const baseColor =
            visitMapping[d.items[0].visit_concept_id]?.[2] || '#ccc';
          const count = d.items.length;
          if (count === 1) return baseColor;
          if (count <= 2) return darkenColor(baseColor, 0.2);
          if (count <= 4) return darkenColor(baseColor, 0.3);
          return darkenColor(baseColor, 0.4);
        })
        .on('mouseover', function (event, d) {
          d3.select(this)
            .style('filter', 'brightness(1.2)')
            .attr('stroke', 'black')
            .attr('stroke-width', 1);

          const visit = d.items[0];
          const len = d.items.length;
          let text;
          if (len === 1) {
            text = `Start: ${visit.visit_start_date}\nEnd: ${visit.visit_end_date}\nCount: ${len}`;
          } else {
            const visit2 = d.items[len - 1];
            text = `Start: ${visit.visit_start_date}\nEnd: ${visit2.visit_end_date}\nCount: ${len}`;
          }
          showTooltip(event, tooltip, text);
        })
        .on('mousemove', function (event) {
          moveTooltip(event, tooltip);
        })
        .on('mouseout', function () {
          d3.select(this).style('filter', 'none').attr('stroke', 'none');

          tooltip.style('visibility', 'hidden');
        })
        .on('click', (event, d) => {
          if (d.items.length !== 1) {
            setSelectedGroup(d.items);
          } else {
            setSelectedGroup(null);
            fetchDataById(d.items[0].visit_occurrence_id);
          }
        });
    }

    function setupZoom(svg, _width, _height) {
      const zoom = d3
        .zoom()
        .scaleExtent([0.5, 20])
        .translateExtent([
          [xScale.range()[0], 0],
          [xScale.range()[1], _height],
        ])
        .on('zoom', (event) => {
          const newXScale = event.transform.rescaleX(xScale);
          xAxisGroup.call(d3.axisBottom(newXScale));
          d3.selectAll('.visit-bar')
            .attr('x', (d) => newXScale(new Date(d.start)))
            .attr('width', (d) =>
              Math.max(
                newXScale(new Date(d.end)) - newXScale(new Date(d.start)),
                5,
              ),
            );
          d3.selectAll('.death-bar')
            .attr('x', newXScale(new Date(personData.death?.death_date)))
            .attr('width', DEATH_BAR_WIDTH);
        });
      svg.call(zoom);
    }

    // --- 메인 D3 로직 실행 ---
    const svg = initializeSvg(width, height);
    xScale = setupScales(width);
    setupClipPath(svg);
    const tooltip = setupTooltip();
    drawYAxis(svg);
    xAxisGroup = svg
      .append('g')
      .attr('transform', `translate(50,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(10));
    drawBars(svg, tooltip);
    setupZoom(svg, width, height);
  }, [personVisits, personData, fetchDataById]);

  useEffect(() => {
    if (!isLoading && personVisits.length > 0) {
      drawTimeline();
    }
    const handleResize = () => {
      if (timelineContainerRef.current) {
        d3.select(timelineContainerRef.current).select('svg').remove();
        drawTimeline();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, personVisits, drawTimeline]);

  if (isLoading) {
    return <LoadingComponent message={message} />;
  }

  if (!personData) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 text-center"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
        <title>Not Found - Bento</title>
        <h1 className="mb-4 text-2xl font-bold text-red-600">
          Patient Not Found
        </h1>
        <p className="text-gray-600">
          The patient with ID{' '}
          <strong className="font-semibold">{personId}</strong> could not be
          found.
        </p>
        <Link
          to="/person"
          className="mt-6 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  const genderCodes = { 8507: 'Male', 8532: 'Female', 0: 'Unknown' };

  return (
    <div className="p-4">
      <header className="w-full border-b bg-white py-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center whitespace-nowrap px-[10px] py-[5px]">
            <Link to="/cohort" aria-label="go back">
              <button
                className="flex items-center pr-[10px]"
                aria-label="go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="h-7 w-7 text-gray-600"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </Link>
            <span className="text-sm text-gray-400">ID</span>
            <span className="ml-1 text-sm font-medium text-gray-900">
              {personData.person.person_id}
            </span>
            <span className="mx-3 text-gray-200">|</span>
            <span className="text-sm text-gray-400">Gender</span>
            <span className="ml-1 text-sm font-medium text-gray-900">
              {genderCodes[personData.person.gender_concept_id]}
            </span>
            <span className="mx-3 text-gray-200">|</span>
            <span className="text-sm text-gray-400">Birth(Year)</span>
            <span className="ml-1 text-sm font-medium text-gray-900">
              {personData.person.year_of_birth}
            </span>
          </div>
          <div className="mr-2 flex h-fit rounded-full border border-gray-200 bg-gray-50 p-0.5">
            <button
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${!isStatisticsView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setIsStatisticsView(false)}
            >
              Statistics
            </button>
            <button
              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${isStatisticsView ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              onClick={() => setIsStatisticsView(true)}
            >
              Table
            </button>
          </div>
        </div>
        <div className="flex gap-4">
          <div
            className="relative h-[220px] w-4/5 min-w-[850px]"
            ref={timelineContainerRef}
          ></div>
          <div className="h-[220px] w-1/5 overflow-y-auto rounded-lg border bg-white p-4 shadow-md">
            <h2 className="mb-2 text-lg font-bold">Overlapping Visits</h2>
            {selectedGroup ? (
              <ul className="space-y-2">
                {selectedGroup.map((visit, index) => (
                  <li
                    key={index}
                    className="block border-b pb-1 text-sm hover:bg-gray-100"
                  >
                    <button
                      className="w-full text-left"
                      onClick={() => fetchDataById(visit.visit_occurrence_id)}
                    >
                      <strong>ID:</strong> {visit.visit_concept_id}
                      <br />
                      <strong>Start:</strong> {visit.visit_start_date}
                      <br />
                      <strong>End:</strong> {visit.visit_end_date}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                Click on a bar to view details.
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-5 pb-[60px] pt-8">
        {!isStatisticsView ? (
          <div className="w-full">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
              {visibleCharts.includes('visitTypeRatio') && (
                <ChartCard
                  title="Visit Type Ratio"
                  type="half"
                  hasTableView={true}
                  hasXButton={true}
                  isTableView={isTableView.visitTypeRatio}
                  onClose={() => handleCloseChart('visitTypeRatio')}
                  onToggleView={(view) =>
                    setIsTableView((prev) => ({
                      ...prev,
                      visitTypeRatio: view,
                    }))
                  }
                  tableContent={
                    <DataTable
                      data={transformDonutChartToTableData({
                        data: personStatistics?.visitType || {},
                      })}
                    />
                  }
                >
                  <SingleDonutChartWrapper
                    data={personStatistics?.visitType || {}}
                  />
                </ChartCard>
              )}

              {visibleCharts.includes('departmentVisits') && (
                <ChartCard
                  title="Department Visit Ratio"
                  type="half"
                  hasTableView={true}
                  hasXButton={true}
                  isTableView={isTableView.departmentVisits}
                  onClose={() => handleCloseChart('departmentVisits')}
                  onToggleView={(view) =>
                    setIsTableView((prev) => ({
                      ...prev,
                      departmentVisits: view,
                    }))
                  }
                  tableContent={
                    <DataTable
                      data={transformDonutChartToTableData({
                        data: personStatistics?.departmentVisit || {},
                      })}
                    />
                  }
                >
                  <SingleDonutChartWrapper
                    data={personStatistics?.departmentVisit || {}}
                  />
                </ChartCard>
              )}

              {/* Bar Charts (수정된 부분) */}
              <ChartCard
                title="Top 10 Drugs"
                type="half"
                hasTableView={true}
                isTableView={isTableView.topTenDrugRatio}
                onClose={() => handleCloseChart('topTenDrugs')}
                onToggleView={(view) =>
                  setIsTableView((prev) => ({ ...prev, topTenDrugRatio: view }))
                }
                tableContent={
                  <BarChartTableView
                    data={(personStatistics?.topTenDrug || []).map((item) => ({
                      name: item.label,
                      count: item.value,
                    }))}
                    domainKey="drug"
                  />
                }
              >
                <BarChartWrapper
                  data={(personStatistics?.topTenDrug || [])
                    .sort((a, b) => b.value - a.value)
                    .map((item) => ({ name: item.label, count: item.value }))}
                />
              </ChartCard>

              <ChartCard
                title="Top 10 Conditions"
                type="half"
                hasTableView={true}
                isTableView={isTableView.topTenConditionRatio}
                onToggleView={(view) =>
                  setIsTableView((prev) => ({
                    ...prev,
                    topTenConditionRatio: view,
                  }))
                }
                onClose={() => handleCloseChart('topTenConditions')}
                tableContent={
                  <BarChartTableView
                    data={(personStatistics?.topTenCondition || []).map(
                      (item) => ({ name: item.label, count: item.value }),
                    )}
                    domainKey="condition"
                  />
                }
              >
                <BarChartWrapper
                  data={(personStatistics?.topTenCondition || []).map(
                    (item) => ({ name: item.label, count: item.value }),
                  )}
                />
              </ChartCard>

              <ChartCard
                title="Top 10 Procedures"
                type="half"
                hasTableView={true}
                isTableView={isTableView.topTenProcedureRatio}
                onToggleView={(view) =>
                  setIsTableView((prev) => ({
                    ...prev,
                    topTenProcedureRatio: view,
                  }))
                }
                onClose={() => handleCloseChart('topTenProcedures')}
                tableContent={
                  <BarChartTableView
                    data={(personStatistics?.topTenProcedure || []).map(
                      (item) => ({ name: item.label, count: item.value }),
                    )}
                    domainKey="procedure"
                  />
                }
              >
                <BarChartWrapper
                  data={(personStatistics?.topTenProcedure || []).map(
                    (item) => ({ name: item.label, count: item.value }),
                  )}
                />
              </ChartCard>

              <ChartCard
                title="Top 10 Measurements"
                type="half"
                hasTableView={true}
                onClose={() => handleCloseChart('topTenMeasurements')}
                tableContent={
                  <BarChartTableView
                    data={(personStatistics?.topTenMeasurement || []).map(
                      (item) => ({ name: item.label, count: item.value }),
                    )}
                    domainKey="measurement"
                  />
                }
              >
                <BarChartWrapper
                  data={(personStatistics?.topTenMeasurement || []).map(
                    (item) => ({ name: item.label, count: item.value }),
                  )}
                />
              </ChartCard>
            </div>
          </div>
        ) : (
          // Table View
          <div>
            <div className="relative mb-2 flex justify-end">
              <button
                className="ml-auto w-fit rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setIsSelectTableOpen((prev) => !prev)}
              >
                <span>{isSelectTableOpen ? '▲' : '▼'} Select Tables</span>
              </button>
              {isSelectTableOpen && (
                <div className="absolute right-0 top-full z-50 min-w-[250px] rounded-lg border border-gray-300 bg-white p-4 shadow-md">
                  <div className="flex flex-col gap-3">
                    {selectItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleCheckboxChange(item.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {item.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Svelte의 svelte:component -> React의 동적 컴포넌트 렌더링 */}
            {tableProps?.cdm_info && (
              <CDMInfo
                careSite={tableProps['cdm_info'].careSite}
                location={tableProps['cdm_info'].location}
                visitOccurrence={tableProps['cdm_info'].visitOccurrence}
              />
            )}
            {selectItems
              .filter((item) => item.checked)
              .map((item) => {
                const ComponentToRender = tableComponents[item.id];
                const props = tableProps[item.id] || {};
                return ComponentToRender ? (
                  <ComponentToRender key={item.id} {...props} />
                ) : null;
              })}
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}
