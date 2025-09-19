import React, { useMemo } from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Type', accessor: 'type' },
  { header: 'Condition Concept ID', accessor: 'concept_name' },
  { header: 'Period', accessor: 'period' },
  { header: 'Status / Count', accessor: 'status' },
];

export default function Condition({ conditionOccurrence, conditionEra }) {
  const combinedData = useMemo(() => {
    const occurrenceData = (conditionOccurrence || []).map((cond) => ({
      type: 'Occurrence',
      concept_name: cond.concept_name,
      period: `${cond.condition_start_date} ~ ${cond.condition_end_date}`,
      status: cond.condition_status_source_value
        ? cond.condition_status_source_value
        : 'null',
    }));

    const eraData = (conditionEra || []).map((era) => ({
      type: 'Era',
      concept_name: era.concept_name,
      period: `${era.condition_era_start_date} ~ ${era.condition_era_end_date}`,
      status: `${era.condition_occurrence_count} times`,
    }));

    return [...occurrenceData, ...eraData];
  }, [conditionOccurrence, conditionEra]);

  return (
    <PaginatedTable
      title="Condition Information"
      data={combinedData}
      columns={columns}
    />
  );
}
