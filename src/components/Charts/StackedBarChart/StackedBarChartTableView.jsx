import React, { useMemo } from 'react';
import DataTable from '../../DataTable';

export default function StackedBarChartTableView({
  data,
  domainKey,
  orderedCohorts,
  cohortTotalCounts,
}) {
  const tableData = useMemo(() => {
    const headers = [
      'No.',
      domainKey.charAt(0).toUpperCase() + domainKey.slice(1),
      ...orderedCohorts,
    ];
    const rows = data.map((item, index) => {
      const row = { 'No.': index + 1, [headers[1]]: item[domainKey] };
      orderedCohorts.forEach((cohort) => {
        const value = +item[cohort];
        const total = +cohortTotalCounts[cohort];
        row[cohort] = total
          ? `${value.toLocaleString()} (${((value / total) * 100).toFixed(2)}%)`
          : value.toLocaleString();
      });
      return row;
    });
    return { headers, rows };
  }, [data, domainKey, orderedCohorts, cohortTotalCounts]);

  return <DataTable data={tableData} />;
}
