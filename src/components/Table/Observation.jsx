import React from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Concept ID', accessor: 'concept_name' },
  { header: 'Date', accessor: 'observation_date' },
  {
    header: 'Value',
    Cell: ({ row }) => (
      <span>
        {row.value_as_string}{' '}
        {row.unit_source_value !== 'N/A' && row.unit_source_value}
      </span>
    ),
  },
];

export default function Observation({ observation }) {
  return (
    <PaginatedTable
      title="Observation Information"
      data={observation}
      columns={columns}
    />
  );
}
