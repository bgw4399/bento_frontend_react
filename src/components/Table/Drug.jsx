import React from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Drug Concept ID', accessor: 'concept_name' },
  {
    header: 'Exposure Period',
    Cell: ({ row }) =>
      `${row.drug_exposure_start_date} ~ ${row.drug_exposure_end_date}`,
  },
  { header: 'Quantity', accessor: 'quantity' },
  {
    header: 'Days Supply',
    Cell: ({ row }) => (row.days_supply ? `${row.days_supply} days` : 'null'),
  },
];

export default function Drug({ drugExposure }) {
  return (
    <PaginatedTable
      title="Drug Information"
      data={drugExposure}
      columns={columns}
    />
  );
}
