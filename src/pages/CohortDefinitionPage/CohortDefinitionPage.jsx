// --- Part 1/6: imports, utils, icons ---
import React, { useCallback, useEffect, useRef, useState } from 'react';
import CategoryTree from './_components/Category/CategoryTree';
import FieldModal from './_components/FieldModal';

const API_BASE = import.meta.env.VITE_PUBLIC_API_URI;

// className 조건부 조합
function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

const rowStyles = [
  {
    gradient: 'from-blue-800 to-blue-950',
    summary: 'border-blue-800 text-blue-800',
    bar: 'bg-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'bg-blue-100',
    light: 'bg-blue-100',
  },
  {
    gradient: 'from-blue-600 to-blue-700',
    summary: 'border-blue-600 text-blue-600',
    bar: 'bg-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'bg-blue-100',
    light: 'bg-blue-100',
  },
  {
    gradient: 'from-blue-400 to-blue-500',
    summary: 'border-blue-400 text-blue-400',
    bar: 'bg-blue-400',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    accent: 'bg-blue-100',
    light: 'bg-blue-100',
  },
];

function getRowStyle(index) {
  return rowStyles[index % 3];
}

function LogicVennIcon({ logic }) {
  if (logic === 'AND') {
    return (
      <svg className="h-4 w-5" viewBox="0 0 24 16" fill="none">
        <circle
          cx="7"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="17"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <path
          d="M 11 4 A 6 6 0 0 1 11 12 A 6 6 0 0 1 11 4"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (logic === 'OR') {
    return (
      <svg className="h-4 w-5" viewBox="0 0 24 16" fill="none">
        <circle
          cx="7"
          cy="8"
          r="6"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle
          cx="17"
          cy="8"
          r="6"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
    );
  }
  // NOT
  return (
    <svg className="h-4 w-5" viewBox="0 0 24 16" fill="none">
      <defs>
        <mask id="notMask">
          <rect width="24" height="16" fill="white" />
          <circle cx="17" cy="8" r="6" fill="black" />
        </mask>
      </defs>
      <circle
        cx="7"
        cy="8"
        r="6"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        mask="url(#notMask)"
      />
      <circle
        cx="17"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

// --- Part 2/6: component start (state, effects, basic helpers) ---
export default function CohortDefinitionPage() {
  const headerRef = useRef(null);

  // 이름/검증
  const [cohortName, setCohortName] = useState('');
  const [cohortNameError, setCohortNameError] = useState('');
  const [isCohortNameChecking, setIsCohortNameChecking] = useState(false);
  const [cohortNameChecked, setCohortNameChecked] = useState(false);

  // 모달/선택
  const [showModal, setShowModal] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  // 최종 카운트
  const [isFinalCountLoading, setIsFinalCountLoading] = useState(false);
  const [finalPatientCount, setFinalPatientCount] = useState(0);
  const [finalPatientBase, setFinalPatientBase] = useState(0);
  const [finalPatientPercent, setFinalPatientPercent] = useState(0);

  // 그룹명 편집
  const [editingRowId, setEditingRowId] = useState(null);
  const [editingRowName, setEditingRowName] = useState('');

  // 드래그
  const [dragOverContainer, setDragOverContainer] = useState(null);
  const currentDragDataRef = useRef(null);

  // 행/컨테이너
  const [rows, setRows] = useState([
    {
      id: 1,
      type: 'initial',
      name: '그룹 A',
      containers: [
        { id: 1, isEmpty: true, tableName: null, items: [], logic: 'AND' },
      ],
      patientCount: 0,
      patientBase: 0,
      patientPercent: 0,
      rowOperator: 'AND',
      isLoading: false,
    },
  ]);
  const nextRowIdRef = useRef(1);
  const nextContainerIdRef = useRef(2);

  // 편집 인풋 포커스
  useEffect(() => {
    if (editingRowId != null) {
      const el = document.querySelector(
        `input[data-editing-row="${editingRowId}"]`,
      );
      if (el) {
        el.focus();
        el.select();
      }
    }
  }, [editingRowId]);

  // 전역 dragend
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDragOverContainer(null);
      currentDragDataRef.current = null;
      window.currentDragData = null;
    };
    document.addEventListener('dragend', handleGlobalDragEnd);
    return () => document.removeEventListener('dragend', handleGlobalDragEnd);
  }, []);

  // 공통 헬퍼
  const resetAllPatientCounts = useCallback(() => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        patientCount: 0,
        patientBase: 0,
        patientPercent: 0,
        isLoading: false,
      })),
    );
    setFinalPatientCount(0);
    setFinalPatientBase(0);
    setFinalPatientPercent(0);
    setIsFinalCountLoading(false);
  }, []);

  const toggleRowType = useCallback(
    (rowId) => {
      resetAllPatientCounts();
      setRows((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            const newType = row.type === 'NOT' ? 'AND' : 'NOT';
            return { ...row, type: newType, rowOperator: newType };
          }
          return row;
        }),
      );
    },
    [resetAllPatientCounts],
  );

  const addRow = useCallback(() => {
    const newId = (nextRowIdRef.current += 1);
    const newContainerId = nextContainerIdRef.current++;
    const name = `그룹 ${String.fromCharCode(65 + newId - 1)}`;
    const newRow = {
      id: newId,
      type: 'AND',
      name,
      containers: [
        {
          id: newContainerId,
          isEmpty: true,
          tableName: null,
          items: [],
          logic: 'AND',
        },
      ],
      patientCount: 0,
      patientBase: 0,
      patientPercent: 0,
      rowOperator: 'AND',
      isLoading: false,
    };
    setRows((prev) => [...prev, newRow]);
  }, []);

  const startEditingGroupName = useCallback((rowId, currentName) => {
    setEditingRowId(rowId);
    setEditingRowName(currentName);
  }, []);

  const saveGroupName = useCallback(() => {
    if (editingRowId && editingRowName.trim()) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === editingRowId
            ? { ...row, name: editingRowName.trim() }
            : row,
        ),
      );
    }
    setEditingRowId(null);
    setEditingRowName('');
  }, [editingRowId, editingRowName]);

  // --- Part 3/6: container helpers & DnD handlers ---
  const ensureEmptyContainer = useCallback((rowId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const hasEmpty = row.containers.some((c) => c.isEmpty);
          if (!hasEmpty) {
            return {
              ...row,
              containers: [
                ...row.containers,
                {
                  id: nextContainerIdRef.current++,
                  isEmpty: true,
                  tableName: null,
                  items: [],
                  logic: 'AND',
                },
              ],
            };
          }
        }
        return row;
      }),
    );
  }, []);

  const removeContainer = useCallback(
    (rowId, containerId) => {
      resetAllPatientCounts();
      setRows((prev) =>
        prev.map((row) => {
          if (row.id === rowId) {
            const newContainers = row.containers.filter(
              (c) => c.id !== containerId,
            );
            if (newContainers.length === 0) {
              newContainers.push({
                id: nextContainerIdRef.current++,
                isEmpty: true,
                tableName: null,
                items: [],
                logic: 'AND',
              });
            }
            return { ...row, containers: newContainers };
          }
          return row;
        }),
      );
      ensureEmptyContainer(rowId);
    },
    [ensureEmptyContainer, resetAllPatientCounts],
  );

  const removeRow = useCallback(
    (rowId) => {
      resetAllPatientCounts();
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== rowId);
        if (next.length === 1) next[0].type = 'initial';
        return next;
      });
    },
    [resetAllPatientCounts],
  );

  const handleDragOver = useCallback(
    (e, rowId, containerId) => {
      e.preventDefault();
      const dragData = window.currentDragData;
      if (!dragData) return;

      const targetRow = rows.find((r) => r.id === rowId);
      const targetContainer = targetRow?.containers.find(
        (c) => c.id === containerId,
      );

      let canDrop = true;
      if (!targetContainer?.isEmpty && targetContainer?.tableName) {
        canDrop = targetContainer.tableName === dragData.tableName;
      }

      setDragOverContainer((prev) => {
        if (
          prev &&
          prev.rowId === rowId &&
          prev.containerId === containerId &&
          prev.canDrop === canDrop
        ) {
          return prev;
        }
        return { rowId, containerId, canDrop };
      });
    },
    [rows],
  );

  const handleDrop = useCallback(
    (e, rowId, containerId) => {
      resetAllPatientCounts();
      e.preventDefault();
      const dragDataString = e.dataTransfer.getData('text/plain');
      if (!dragDataString) return;

      let tableName;
      let fieldName;
      let fieldType;

      try {
        const dragData = JSON.parse(dragDataString);
        tableName = dragData.tableName ?? null;
        fieldName = dragData.fieldName;
        fieldType = dragData.fieldType || 'unknown';
        currentDragDataRef.current = dragData;
      } catch {
        tableName = '알 수 없음';
        fieldName = dragDataString;
        fieldType = 'unknown';
        currentDragDataRef.current = { tableName, fieldName, fieldType };
      }

      const targetRow = rows.find((r) => r.id === rowId);
      const targetContainer = targetRow?.containers.find(
        (c) => c.id === containerId,
      );
      const wasEmpty = !!targetContainer?.isEmpty;

      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            containers: row.containers.map((c) => {
              if (c.id !== containerId) return c;
              const newItem = {
                tableName,
                fieldName,
                fieldType,
                conditions: null,
                displayText: fieldName,
              };
              const newItems = c.isEmpty ? [newItem] : [...c.items, newItem];
              return {
                ...c,
                isEmpty: false,
                tableName,
                items: newItems,
              };
            }),
          };
        }),
      );

      if (wasEmpty) ensureEmptyContainer(rowId);

      setDragOverContainer(null);
      currentDragDataRef.current = null;
    },
    [ensureEmptyContainer, resetAllPatientCounts, rows],
  );

  const removeItemFromContainer = useCallback(
    (rowId, containerId, itemIndex) => {
      resetAllPatientCounts();
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== rowId) return row;
          return {
            ...row,
            containers: row.containers.map((c) => {
              if (c.id !== containerId) return c;
              const newItems = c.items.filter((_, i) => i !== itemIndex);
              const isEmpty = newItems.length === 0;
              return {
                ...c,
                isEmpty,
                tableName: isEmpty ? null : c.tableName,
                items: newItems,
              };
            }),
          };
        }),
      );
      ensureEmptyContainer(rowId);
    },
    [ensureEmptyContainer, resetAllPatientCounts],
  );

  const toggleLogic = useCallback((rowId, containerId) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        return {
          ...row,
          containers: row.containers.map((c) => {
            if (c.id !== containerId) return c;
            let next = 'AND';
            if (c.logic === 'AND') next = 'OR';
            else if (c.logic === 'OR') next = 'NOT';
            else next = 'AND';
            return { ...c, logic: next };
          }),
        };
      }),
    );
  }, []);

  const getGlobalContainerIndex = useCallback(
    (targetRowIndex, targetContainerIndex) => {
      let globalIndex = 0;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.containers.length; c++) {
          const container = row.containers[c];
          if (!container.isEmpty) {
            if (r === targetRowIndex && c === targetContainerIndex)
              return globalIndex;
            globalIndex++;
          }
        }
      }
      return globalIndex;
    },
    [rows],
  );

  const getContainerNumber = (globalIndex) => String(globalIndex + 1);

  const openFieldModal = useCallback((rowId, containerId, itemIndex) => {
    setSelectedRow(rowId);
    setSelectedContainer(containerId);
    setSelectedField(itemIndex);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedField(null);
    setSelectedContainer(null);
    setSelectedRow(null);
  }, []);

  // --- Part 4/6: fetching & API builders ---
  async function fetchCohortPatientCounts() {
    const res = await fetch('/patient-count-testdata.json'); // 임시 더미데이터
    if (!res.ok) throw new Error('데이터를 불러올 수 없습니다');
    return await res.json();
  }

  async function getPatientCount() {
    setIsFinalCountLoading(true);
    setRows((prev) => prev.map((r) => ({ ...r, isLoading: true })));

    const data = await fetchCohortPatientCounts();

    setRows((prev) =>
      prev.map((row, idx) => {
        const patientCount = data.containerCounts?.[idx] ?? 0;
        const patientBase =
          idx !== 0
            ? (data.containerCounts?.[idx - 1] ?? 0)
            : (data.containerCounts?.[idx] ?? 0);
        const patientPercent =
          patientBase > 0 ? (patientCount / patientBase) * 100 : 0;
        return {
          ...row,
          patientCount,
          patientBase,
          patientPercent,
          isLoading: false,
        };
      }),
    );

    const base = data.totalPatients ?? 0;
    const count = data.finalPatientCount ?? 0;
    setFinalPatientBase(base);
    setFinalPatientCount(count);
    setFinalPatientPercent(base > 0 ? (count / base) * 100 : 0);
    setIsFinalCountLoading(false);
  }

  function convertFieldTypeToApiType(fieldType) {
    const typeMapping = {
      condition: 'condition_occurrence',
      measurement: 'measurement',
      procedure: 'procedure_occurrence',
      drug: 'drug_exposure',
      visit: 'visit_occurrence',
      observation: 'observation',
      death: 'death',
      device: 'device_exposure',
      specimen: 'specimen',
      demographic: 'demographic',
    };
    return typeMapping[fieldType] || 'condition_occurrence';
  }

  function buildFilterCondition(item) {
    const tableColumnMapping = {
      condition_era: {
        condition_concept_id: 'conceptset',
        condition_era_start_date: 'startDate',
        condition_era_end_date: 'endDate',
        condition_era_start_age: 'startAge',
        condition_era_end_age: 'endAge',
        condition_era_gender: 'gender',
        condition_era_status: 'conditionStatus',
      },
      condition_occurrence: {
        condition_concept_id: 'conceptset',
        condition_source_value: 'source',
        condition_occurrence_age: 'age',
        condition_occurrence_gender: 'gender',
        condition_start_date: 'startDate',
        condition_end_date: 'endDate',
        condition_status_concept_id: 'conditionStatus',
        condition_type_concept_id: 'conditionType',
        visit_type_concept_id: 'visitType',
        condition_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
      },
      death: {
        death_concept_id: 'conceptset',
        death_age: 'age',
        death_gender: 'gender',
        death_date: 'date',
        death_type_concept_id: 'deathType',
        cause_concept_id: 'cause',
      },
      device_exposure: {
        device_concept_id: 'conceptset',
        device_exposure_age: 'age',
        device_exposure_gender: 'gender',
        device_exposure_start_date: 'startDate',
        device_exposure_end_date: 'endDate',
        device_type_concept_id: 'deviceType',
        visit_type_concept_id: 'visitType',
        unique_device_id: 'uniqueDeviceId',
        quantity: 'quantity',
        device_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
      },
      dose_era: {
        drug_concept_id: 'conceptset',
        dose_era_start_age: 'startAge',
        dose_era_end_age: 'EndAge',
        dose_era_gender: 'gender',
        dose_era_start_date: 'startDate',
        dose_era_end_date: 'endDate',
        unit_concept_id: 'doseUnit',
        dose_era_length: 'length',
        dose_value: 'doseValue',
      },
      drug_era: {
        drug_concept_id: 'conceptset',
        drug_era_start_age: 'startAge',
        drug_era_end_age: 'endAge',
        drug_era_gender: 'gender',
        drug_era_start_date: 'startDate',
        drug_era_end_date: 'endDate',
        drug_era_length: 'length',
        drug_exposure_count: 'eraExposureCount',
      },
      drug_exposure: {
        drug_concept_id: 'conceptset',
        drug_exposure_age: 'age',
        drug_exposure_gender: 'gender',
        drug_exposure_start_date: 'startDate',
        drug_exposure_end_date: 'endDate',
        drug_type_concept_id: 'drugType',
        visit_type_concept_id: 'visitType',
        stop_reason: 'stopReason',
        refills: 'refill',
        quantity: 'quantity',
        days_supply: 'daysSupply',
        route_concept_id: 'routeType',
        lot_number: 'lotNumber',
        drug_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
      },
      measurement: {
        measurement_concept_id: 'conceptset',
        measurement_age: 'age',
        measurement_gender: 'gender',
        measurement_date: 'date',
        measurement_type_concept_id: 'measurementType',
        visit_type_concept_id: 'visitType',
        operator_concept_id: 'operatorType',
        value_as_number: 'valueAsNumber',
        value_as_concept_id: 'valueAsConcept',
        unit_concept_id: 'unitType',
        measurement_abnormal: 'abnormal',
        range_low: 'rangeLow',
        range_high: 'rangeHigh',
        provider_id: 'providerSpecialty',
        measurement_source_concept_id: 'source',
      },
      observation: {
        observation_concept_id: 'conceptset',
        observation_age: 'age',
        observation_gender: 'gender',
        observation_date: 'date',
        observation_type_concept_id: 'observationType',
        visit_type_concept_id: 'visitType',
        value_as_number: 'valueAsNumber',
        value_as_string: 'valueAsString',
        qualifier_concept_id: 'qualifierType',
        unit_concept_id: 'unitType',
        observation_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
      },
      observation_period: {
        observation_period_start_age: 'startAge',
        observation_period_end_age: 'endAge',
        observation_period_start_date: 'startDate',
        observation_period_end_date: 'endDate',
        observation_period_length: 'length',
        period_type_concept_id: 'periodType',
      },
      procedure_occurrence: {
        procedure_concept_id: 'conceptset',
        procedure_age: 'age',
        procedure_gender: 'gender',
        procedure_date: 'startDate',
        procedure_type_concept_id: 'procedureType',
        visit_type_concept_id: 'visitType',
        modifier_concept_id: 'modifierType',
        quantity: 'quantity',
        procedure_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
      },
      specimen: {
        specimen_concept_id: 'conceptset',
        specimen_age: 'age',
        specimen_gender: 'gender',
        specimen_date: 'date',
        specimen_type_concept_id: 'specimenType',
        quantity: 'quantity',
        unit_concept_id: 'unitType',
        anatomic_site_concept_id: 'anatomicSiteType',
        disease_status_concept_id: 'diseaseStatus',
      },
      visit_occurrence: {
        visit_concept_id: 'conceptset',
        visit_age: 'age',
        visit_gender: 'gender',
        visit_start_date: 'startDate',
        visit_end_date: 'endDate',
        visit_type_concept_id: 'visitType',
        visit_length: 'length',
        visit_source_concept_id: 'source',
        provider_id: 'providerSpecialty',
        place_of_service_concept_id: 'placeOfService',
      },
      demographic: {
        gender_concept_id: 'gender',
        race_concept_id: 'raceType',
        ethnicity_concept_id: 'ethnicityType',
      },
    };

    const tableName =
      item.tableName || convertFieldTypeToApiType(item.fieldType);
    const filter = { type: tableName };
    const columnMapping = tableColumnMapping[tableName] || {};

    // lookup
    if (
      item.fieldType === 'lookup' &&
      item.selectedItems &&
      item.selectedItems.length > 0
    ) {
      const conceptsetField = columnMapping[item.fieldName];
      if (conceptsetField) {
        const conceptIds = item.selectedItems.map(
          (x) => x.target_concept_id || x,
        );
        filter[conceptsetField] = { eq: conceptIds };
        return filter;
      }
    }

    // date/datetime
    if (
      (item.fieldType === 'date' || item.fieldType === 'datetime') &&
      item.operator
    ) {
      const dateField = columnMapping[item.fieldName];
      if (dateField) {
        filter[dateField] = item.operator;
        return filter;
      }
    }

    // range
    if (
      (item.fieldType === 'range_int' || item.fieldType === 'range_float') &&
      item.operator
    ) {
      const rangeField = columnMapping[item.fieldName];
      if (rangeField) {
        filter[rangeField] = item.operator;
        return filter;
      }
      return filter;
    }

    // search
    if (item.fieldType === 'search' && item.operator?.keywords?.length > 0) {
      const keywordItem = item.operator.keywords[0];
      const sourceField = columnMapping[item.fieldName];
      if (sourceField && keywordItem.keyword) {
        if (keywordItem.operator === 'contains') {
          filter[sourceField] = { contains: keywordItem.keyword };
        } else if (keywordItem.operator === 'not_contains') {
          filter[sourceField] = { ncontains: keywordItem.keyword };
        } else if (keywordItem.operator === 'starts_with') {
          filter[sourceField] = { startsWith: keywordItem.keyword };
        }
        return filter;
      }
    }

    return filter;
  }

  function buildApiRequestData() {
    const requestData = {
      name: cohortName,
      description: `코호트: ${cohortName}`,
      cohortDefinition: {
        initialGroup: { containers: [] },
        comparisonGroup: { containers: [] },
      },
      temporary: false,
    };

    rows.forEach((row) => {
      if (row.type === 'initial') {
        const initialContainer = { name: row.name, filters: [] };

        row.containers.forEach((c) => {
          if (!c.isEmpty && c.items.length > 0) {
            const containerFilter = { type: c.tableName };
            c.items.forEach((item) => {
              const cond = buildFilterCondition(item);
              Object.keys(cond).forEach((k) => {
                if (k !== 'type') containerFilter[k] = cond[k];
              });
            });
            initialContainer.filters.push(containerFilter);
          }
        });

        if (initialContainer.filters.length > 0) {
          requestData.cohortDefinition.initialGroup.containers.push(
            initialContainer,
          );
        }
      } else if (row.type === 'AND' || row.type === 'NOT') {
        const comparisonContainer = {
          name: row.name,
          operator: row.type === 'NOT' ? 'not' : 'and',
          filters: [],
        };

        row.containers.forEach((c) => {
          if (!c.isEmpty && c.items.length > 0) {
            const containerFilter = { type: c.tableName };
            c.items.forEach((item) => {
              const cond = buildFilterCondition(item);
              Object.keys(cond).forEach((k) => {
                if (k !== 'type') containerFilter[k] = cond[k];
              });
            });
            comparisonContainer.filters.push(containerFilter);
          }
        });

        if (comparisonContainer.filters.length > 0) {
          requestData.cohortDefinition.comparisonGroup.containers.push(
            comparisonContainer,
          );
        }
      }
    });

    return requestData;
  }

  async function createCohort() {
    try {
      const requestData = buildApiRequestData();

      if (!API_BASE) {
        alert('환경변수 NEXT_PUBLIC_API_URI 가 설정되어 있지 않습니다.');
        return;
      }

      const response = await fetch(`${API_BASE}/api/cohort`, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      alert('코호트 생성이 완료되었습니다.');

      if (result.containerCounts) {
        setRows((prev) =>
          prev.map((row, idx) => {
            const patientCount = result.containerCounts[idx] ?? 0;
            const patientBase =
              idx !== 0
                ? (result.containerCounts[idx - 1] ?? 0)
                : (result.containerCounts[idx] ?? 0);
            const patientPercent =
              patientBase > 0 ? (patientCount / patientBase) * 100 : 0;
            return {
              ...row,
              patientCount,
              patientBase,
              patientPercent,
              isLoading: false,
            };
          }),
        );

        const base = result.totalPatients ?? 0;
        const count = result.finalPatientCount ?? 0;
        setFinalPatientBase(base);
        setFinalPatientCount(count);
        setFinalPatientPercent(base > 0 ? (count / base) * 100 : 0);
      }
    } catch (error) {
      alert('코호트 생성에 실패했습니다: ' + (error?.message || String(error)));
    }
  }

  async function checkCohortName() {
    if (!cohortName.trim()) {
      setCohortNameError('');
      setCohortNameChecked(false);
      return;
    }
    setIsCohortNameChecking(true);
    setCohortNameError('');

    try {
      if (!API_BASE) {
        setCohortNameChecked(true);
        setCohortNameError('API URI 미설정');
        return;
      }
      const requestBody = { cohortName: cohortName.trim() };
      const res = await fetch(`${API_BASE}/api/cohort/check`, {
        method: 'POST',
        headers: { accept: '*/*', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const response = await res.json();

      setCohortNameChecked(true);
      if (response.status === false)
        setCohortNameError('이미 사용 중인 코호트 이름입니다.');
      else if (response.status === true) setCohortNameError('');
    } catch (err) {
      console.error('코호트 이름 중복 확인 실패:', err);
      setCohortNameError('이름 확인 중 오류가 발생했습니다.');
      setCohortNameChecked(true);
    } finally {
      setIsCohortNameChecking(false);
    }
  }

  // --- Part 5/6: render - sidebar & header ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-200">
      {/* 좌측 사이드 바 */}
      <aside className="fixed left-0 z-50 h-full w-72 overflow-y-auto border-r border-slate-200 bg-white">
        <CategoryTree />
      </aside>

      {/* 메인 컨텐츠 */}
      <div className="ml-72 flex h-screen min-w-0 flex-1 flex-col bg-slate-200">
        {/* 상단 헤더 */}
        <header
          ref={headerRef}
          className="fixed left-72 right-0 top-[60px] z-20 border-b border-slate-200 bg-white px-6 pb-2 pt-3 shadow-sm"
        >
          <div className="flex w-full items-center justify-between gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              코호트 정의하기
            </h1>

            <div className="relative flex flex-1 items-center">
              <input
                type="text"
                className={cx(
                  'w-[72%] rounded-lg border px-2 py-1.5 pr-8 text-sm transition-colors focus:border-transparent focus:outline-none focus:ring-1',
                  cohortNameError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-slate-500',
                )}
                placeholder="코호트 이름을 입력하세요"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                onBlur={checkCohortName}
              />

              {/* 상태 아이콘 */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isCohortNameChecking ? (
                  <svg
                    className="h-4 w-4 animate-spin text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : cohortNameError ? (
                  <div className="flex flex-row items-center gap-1">
                    <svg
                      className="h-4 w-4 text-red-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      title={cohortNameError}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="text-sm text-red-600">
                      {cohortNameError}
                    </div>
                  </div>
                ) : cohortNameChecked &&
                  cohortName.trim() &&
                  !cohortNameError ? (
                  <div className="flex flex-row items-center gap-1">
                    <svg
                      className="h-4 w-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      title="사용 가능한 이름입니다"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div className="text-sm text-green-600">
                      사용 가능한 이름입니다.
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="gap-13 flex flex-shrink-0 items-center">
              <button
                className="flex items-center gap-2 rounded-lg bg-blue-800 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                disabled={
                  !cohortName.trim() ||
                  !!cohortNameError ||
                  isCohortNameChecking
                }
                onClick={createCohort}
              >
                <span>코호트 생성</span>
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-200 pt-2">
            <div className="flex h-[110px] items-center justify-between px-2 py-2">
              <div className="flex h-full items-center gap-0 overflow-x-auto pr-4">
                {rows.map((row, rowIndex) => {
                  const rowStyle = getRowStyle(rowIndex);
                  return (
                    <React.Fragment key={row.id}>
                      {rowIndex > 0 && row.type !== 'initial' && (
                        <div className="flex h-full flex-shrink-0 flex-row items-center justify-center">
                          <div className="h-px w-2 bg-slate-300"></div>
                          {row.rowOperator === 'NOT' ? (
                            <span className="rounded-full border border-red-500 bg-red-50 px-1.5 py-0.5 text-xs font-bold text-red-500">
                              NOT
                            </span>
                          ) : (
                            <span className="rounded-full border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs font-bold text-slate-500">
                              AND
                            </span>
                          )}
                          <div className="h-px w-2 bg-slate-300"></div>
                        </div>
                      )}

                      <div
                        className={cx(
                          'flex h-full w-[180px] flex-shrink-0 flex-col justify-between gap-2 rounded-lg border-2 bg-slate-100 p-2.5 px-4 shadow-sm',
                          rowStyle.summary,
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cx(
                              'truncate pr-2 text-sm font-bold',
                              rowStyle.summary,
                            )}
                          >
                            {row.name}
                          </div>
                          {row.isLoading && (
                            <div className="flex justify-end">
                              <svg
                                className="h-4 w-4 animate-spin"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 text-center">
                          {row.patientBase > 0 ? (
                            <>
                              <div className="mx-auto h-3 overflow-hidden rounded-full bg-slate-300">
                                <div
                                  className={cx(
                                    rowStyle.bar,
                                    'h-3 rounded-full',
                                  )}
                                  style={{
                                    width: `${row.patientPercent.toFixed(1)}%`,
                                  }}
                                />
                              </div>
                              <p
                                className={cx(
                                  'pt-0 text-[10px] font-medium',
                                  rowStyle.text,
                                )}
                              >
                                {row.patientCount.toLocaleString()} /{' '}
                                {row.patientBase.toLocaleString()}{' '}
                                <span
                                  className={cx('font-normal', rowStyle.text)}
                                >
                                  ({row.patientPercent.toFixed(1)}%)
                                </span>
                              </p>
                            </>
                          ) : (
                            <>
                              <div className="mx-auto h-3 overflow-hidden rounded-full bg-slate-300" />
                              <p className="text-xs text-slate-400">
                                환자 수 미조회
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="h-full border-l border-slate-200">
                <div className="ml-4 flex h-full w-[180px] flex-shrink-0 flex-col justify-between gap-2 rounded-lg border-2 border-slate-300 bg-slate-100 p-2.5 px-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="truncate border-slate-300 pr-2 text-sm font-bold text-blue-900">
                      최종 환자 수
                    </div>
                    <button
                      className="flex-shrink-0 text-blue-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        getPatientCount();
                      }}
                      title="환자 수 조회"
                    >
                      {isFinalCountLoading ? (
                        <svg
                          className="h-4 w-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 -2 20 20"
                        >
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  <div className="space-y-1 text-center">
                    {finalPatientBase > 0 ? (
                      <>
                        <div className="mx-auto h-3 overflow-hidden rounded-full bg-slate-300">
                          <div
                            className="h-3 rounded-full bg-blue-900"
                            style={{
                              width: `${finalPatientPercent.toFixed(1)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] font-medium text-blue-900">
                          {finalPatientCount.toLocaleString()} /{' '}
                          {finalPatientBase.toLocaleString()}{' '}
                          <span className="font-normal text-blue-900">
                            ({finalPatientPercent.toFixed(1)}%)
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mx-auto h-3 overflow-hidden rounded-full bg-slate-300" />
                        <p className="text-xs text-slate-400">환자 수 미조회</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* 메인 콘텐츠 영역 */}
        <div className="mt-[188px] h-screen min-w-0 flex-1 overflow-y-auto bg-slate-200">
          <main className="h-screen space-y-4 px-5 py-6">
            {rows.map((row, rowIndex) => {
              const style = getRowStyle(rowIndex);
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md"
                >
                  {/* 카드 헤더 */}
                  <div
                    className={cx(
                      'bg-gradient-to-r px-5 py-3 text-white',
                      style.gradient,
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {row.type !== 'initial' ? (
                          <div className="flex items-center gap-2">
                            <button
                              className={cx(
                                'relative inline-flex h-7 w-[76px] items-center rounded-full transition-all duration-200 ease-in-out focus:outline-none',
                                row.type === 'NOT'
                                  ? 'bg-red-400'
                                  : row.id > 2
                                    ? 'bg-blue-500'
                                    : 'bg-blue-900',
                              )}
                              onClick={() => toggleRowType(row.id)}
                            >
                              <span
                                className={cx(
                                  'absolute left-2 text-xs font-medium text-white',
                                  row.type === 'AND'
                                    ? 'opacity-100'
                                    : 'opacity-50',
                                )}
                              >
                                AND
                              </span>
                              <span
                                className={cx(
                                  'absolute right-2 text-xs font-medium text-white',
                                  row.type === 'NOT'
                                    ? 'opacity-100'
                                    : 'opacity-50',
                                )}
                              >
                                NOT
                              </span>
                              <span
                                className={cx(
                                  'inline-block flex h-5 w-8 transform items-center justify-center rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out',
                                  row.type === 'NOT'
                                    ? 'translate-x-10'
                                    : 'translate-x-1',
                                )}
                              >
                                <span
                                  className={cx(
                                    'text-xs font-bold',
                                    row.type === 'NOT'
                                      ? 'text-red-500'
                                      : 'text-blue-500',
                                  )}
                                >
                                  {row.type === 'NOT' ? 'NOT' : 'AND'}
                                </span>
                              </span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="rounded-full border border-white border-opacity-30 bg-white bg-opacity-20 px-3 py-1 text-xs font-medium">
                              <span className="text-xs font-semibold">
                                Initial
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <h3 className="flex items-center gap-2 text-base font-medium">
                            {editingRowId === row.id ? (
                              <input
                                type="text"
                                className="w-56 rounded border border-white border-opacity-50 bg-white bg-opacity-90 px-2 py-0.5 text-sm text-gray-800 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                data-editing-row={row.id}
                                value={editingRowName}
                                onChange={(e) =>
                                  setEditingRowName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveGroupName();
                                  else if (e.key === 'Escape') {
                                    setEditingRowId(null);
                                    setEditingRowName('');
                                  }
                                }}
                                onBlur={saveGroupName}
                              />
                            ) : (
                              <>
                                <span>{row.name}</span>
                                <button
                                  aria-label="그룹명 수정"
                                  className="rounded p-1 transition-colors duration-200 hover:bg-white hover:bg-opacity-20"
                                  onClick={() =>
                                    startEditingGroupName(row.id, row.name)
                                  }
                                  title="그룹명 수정"
                                >
                                  <svg
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                            {row.type === 'NOT' ? '(제외)' : ''}
                          </h3>
                          <p className="pt-0.5 text-xs text-white text-opacity-80">
                            {row.type === 'NOT'
                              ? '해당 조건을 만족하지 않는 환자'
                              : '해당 조건을 만족하는 환자'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {rows.length > 1 && rowIndex > 0 && (
                          <button
                            aria-label="그룹 삭제"
                            className="rounded-lg bg-white bg-opacity-20 p-1.5 transition-colors hover:bg-opacity-30"
                            onClick={() => removeRow(row.id)}
                          >
                            <svg
                              className="h-3.5 w-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 카드 본문 */}
                  <div className="min-w-0 p-4">
                    <div className="-mx-4 min-w-0 max-w-full overflow-x-auto px-4">
                      <div className="inline-flex w-max items-center gap-0">
                        {row.containers.map((container, containerIndex) => {
                          const isDropBlocked =
                            dragOverContainer &&
                            dragOverContainer.rowId === row.id &&
                            dragOverContainer.containerId === container.id &&
                            !dragOverContainer.canDrop;

                          return (
                            <React.Fragment key={container.id}>
                              {container.isEmpty ? (
                                <div
                                  className="flex min-w-[380px] items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-slate-500 transition-all duration-200 hover:border-slate-400 hover:bg-slate-100"
                                  onDrop={(e) =>
                                    handleDrop(e, row.id, container.id)
                                  }
                                  onDragOver={(e) =>
                                    handleDragOver(e, row.id, container.id)
                                  }
                                  role="button"
                                  tabIndex={0}
                                >
                                  <div className="text-center">
                                    <div>
                                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-300">
                                        <svg
                                          className="h-5 w-5 text-slate-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                          />
                                        </svg>
                                      </div>
                                      <h4 className="mb-1 text-sm font-medium text-slate-700">
                                        테이블 별 컨테이너 추가
                                      </h4>
                                      <p className="text-xs text-slate-500">
                                        좌측에서 항목을 끌어다 놓으세요
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={cx(
                                    'relative min-w-[380px] rounded-lg border bg-white p-3 shadow-sm',
                                    style.border,
                                  )}
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-300">
                                        <span className="text-xs font-semibold text-slate-800">
                                          {getContainerNumber(
                                            getGlobalContainerIndex(
                                              rowIndex,
                                              containerIndex,
                                            ),
                                          )}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium text-slate-900">
                                          컨테이너
                                        </span>
                                        {container.tableName && (
                                          <div className="flex items-center gap-2">
                                            <div className="h-3 w-0.5 rounded-full bg-slate-300"></div>
                                            <span className="rounded-full px-2 py-0.5 text-sm font-semibold text-blue-900">
                                              {container.tableName}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      aria-label="컨테이너 삭제"
                                      className="text-slate-400 transition-colors hover:text-red-500"
                                      onClick={() =>
                                        removeContainer(row.id, container.id)
                                      }
                                    >
                                      <svg
                                        className="h-3.5 w-3.5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth="2"
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* 드롭 불가능 오버레이 */}
                                  {isDropBlocked && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-red-500 bg-red-50">
                                      <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-500">
                                          <svg
                                            className="h-5 w-5 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="3"
                                              d="M6 18L18 6M6 6l12 12"
                                            />
                                          </svg>
                                        </div>
                                        <h4 className="mb-1 text-sm font-medium text-red-700">
                                          드롭 불가능
                                        </h4>
                                        <p className="mt-1 text-xs text-red-500">
                                          {container.tableName} 테이블 내 필드만
                                          드롭 가능합니다.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  <div className="border-t border-slate-200 pt-2">
                                    <div
                                      className="min-h-[60px] space-y-1.5"
                                      onDrop={(e) =>
                                        handleDrop(e, row.id, container.id)
                                      }
                                      onDragOver={(e) =>
                                        handleDragOver(e, row.id, container.id)
                                      }
                                      role="button"
                                      tabIndex={0}
                                    >
                                      {container.items.map(
                                        (item, itemIndex) => (
                                          <div
                                            key={itemIndex}
                                            className="rounded-md border border-slate-300 bg-slate-50 p-2.5 transition-colors hover:border-slate-400"
                                          >
                                            <div className="flex items-center justify-between">
                                              <button
                                                aria-label="필드 별 모달 열기"
                                                className="flex-1 text-left"
                                                onClick={() =>
                                                  openFieldModal(
                                                    row.id,
                                                    container.id,
                                                    itemIndex,
                                                  )
                                                }
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span className="text-xs font-medium text-slate-800">
                                                    {item.fieldName}
                                                  </span>
                                                  <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-medium text-blue-600">
                                                    {item.summary}
                                                  </span>
                                                </div>
                                              </button>
                                              <button
                                                aria-label="필드 삭제"
                                                className="ml-2 text-slate-400 transition-colors hover:text-red-500"
                                                onClick={() =>
                                                  removeItemFromContainer(
                                                    row.id,
                                                    container.id,
                                                    itemIndex,
                                                  )
                                                }
                                              >
                                                <svg
                                                  className="h-3.5 w-3.5"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M6 18L18 6M6 6l12 12"
                                                  />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 로직 연결 */}
                              {containerIndex < row.containers.length - 1 && (
                                <div className="flex flex-row items-center justify-center">
                                  <div className="h-px w-2 bg-slate-300"></div>
                                  <button
                                    className="flex flex-col items-center rounded-full border-2 border-slate-300 bg-white px-2.5 py-2 text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                                    onClick={() =>
                                      toggleLogic(row.id, container.id)
                                    }
                                  >
                                    <span className="flex items-center">
                                      <LogicVennIcon logic={container.logic} />
                                    </span>
                                    <span className="text-xs font-medium">
                                      {container.logic}
                                    </span>
                                  </button>
                                  <div className="h-px w-2 bg-slate-300"></div>
                                </div>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 새 행 추가 버튼 */}
            <div className="flex justify-center">
              <button
                className="mb-[100px] flex items-center gap-2.5 rounded-lg border-2 border-dashed border-slate-300 bg-white px-24 py-5 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50"
                onClick={addRow}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <svg
                    className="h-5 w-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-slate-700">
                    새 그룹 추가
                  </h4>
                  <p className="text-xs text-slate-500">
                    추가 조건을 설정하세요
                  </p>
                </div>
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* 필드 상세 설정 모달 */}
      {showModal &&
        selectedField !== null &&
        selectedRow &&
        selectedContainer !== null && (
          <FieldModal
            showModal={showModal}
            fieldData={(() => {
              const r = rows.find((x) => x.id === selectedRow);
              const c = r?.containers.find((x) => x.id === selectedContainer);
              const currentItem = c?.items[selectedField ?? 0];
              return currentItem
                ? {
                    fieldName: currentItem.fieldName,
                    tableName: currentItem.tableName,
                    fieldType: currentItem.fieldType,
                  }
                : null;
            })()}
            existingData={(() => {
              const r = rows.find((x) => x.id === selectedRow);
              const c = r?.containers.find((x) => x.id === selectedContainer);
              const currentItem = c?.items[selectedField ?? 0];
              return currentItem
                ? {
                    selectedItems: currentItem.selectedItems || [],
                    conditions: currentItem.conditions,
                    summary: currentItem.summary,
                    operator: currentItem.operator || {},
                  }
                : null;
            })()}
            onClose={closeModal}
            onApply={(conditions) => {
              setRows((prev) =>
                prev.map((row) => {
                  if (row.id !== selectedRow) return row;
                  return {
                    ...row,
                    containers: row.containers.map((c) => {
                      if (c.id !== selectedContainer) return c;
                      return {
                        ...c,
                        items: c.items.map((item, index) => {
                          if (index === selectedField) {
                            return {
                              ...item,
                              conditions: conditions.displayText,
                              summary: conditions.summary || null,
                              selectedItems: conditions.selectedItems || [],
                              operator: conditions.operator || {},
                            };
                          }
                          return item;
                        }),
                      };
                    }),
                  };
                }),
              );
              closeModal();
            }}
          />
        )}
    </div>
  );
}
