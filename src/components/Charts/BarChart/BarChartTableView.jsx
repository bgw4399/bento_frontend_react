import React, { useMemo } from 'react';
import DataTable from '../../DataTable';

export default function BarChartTableView({
  data = [],
  domainKey,
  cohortName = 'Value',
}) {
  const tableData = useMemo(() => {
    const totalCount = data.reduce((sum, item) => sum + +item.count, 0);

    const headers = [
      'No.',
      domainKey.charAt(0).toUpperCase() + domainKey.slice(1),
      `${cohortName}`,
    ];

    const rows = data.map((item, index) => {
      const value = +item.count;
      return {
        'No.': index + 1,
        [headers[1]]: item.name,
        [headers[2]]: `${value.toLocaleString()} (${((value / totalCount) * 100).toFixed(2)}%)`,
      };
    });

    return { headers, rows };
  }, [data, domainKey, cohortName]);

  return <DataTable data={tableData} />;
}
