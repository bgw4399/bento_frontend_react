import React from 'react';
import PaginatedTable from './PaginatedTable';

const columns = [
  { header: 'Concept ID', accessor: 'concept_name' },
  { header: 'Date', accessor: 'procedure_date' },
  { header: 'Value', accessor: 'procedure_source_value' },
  { header: 'Quantity', accessor: 'quantity' },
];

export default function ProcedureOccurrence({ procedureOccurrence }) {
  return (
    <PaginatedTable
      title="Procedure Occurrence"
      data={procedureOccurrence}
      columns={columns}
    />
  );
}
