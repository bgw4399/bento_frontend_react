import React from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Concept ID', accessor: 'concept_name' },
  { header: 'Date', accessor: 'measurement_date' },
  {
    header: 'Value',
    Cell: ({ row }) => `${row.value_as_number} ${row.unit_source_value}`,
  },
];

// 2. props로 데이터를 받아 PaginatedTable에 title, data, columns를 전달합니다.
export default function Measurement({ measurement }) {
  return (
    <PaginatedTable
      title="Measurement Information"
      data={measurement}
      columns={columns}
    />
  );
}
