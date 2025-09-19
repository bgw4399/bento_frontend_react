import React from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Concept ID', accessor: 'concept_name' },
  { header: 'Date', accessor: 'specimen_date' },
  { header: 'Value', accessor: 'specimen_source_value' },
];

export default function Specimen({ specimen }) {
  return (
    <PaginatedTable
      title="Specimen Information"
      data={specimen}
      columns={columns}
    />
  );
}
