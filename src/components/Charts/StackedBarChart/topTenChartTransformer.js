import * as d3 from 'd3';

export function transformTopTenData(data, domainKey, viewType) {
  if (!data || data.length === 0) {
    return {
      domainKey,
      viewType,
      transformedData: [],
      top10ItemNames: [],
      orderedCohorts: [],
    };
  }

  const cohorts = [...new Set(data.map((d) => d.cohort))];
  const orderedCohorts =
    viewType === 'combined'
      ? cohorts
      : [viewType, ...cohorts.filter((c) => c !== viewType)];

  let top10ItemNames;
  if (viewType === 'combined') {
    const totalItemCounts = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.count),
      (d) => d[domainKey],
    );
    top10ItemNames = Array.from(totalItemCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([item]) => item);
  } else {
    const anchorCohortData = data.filter((d) => d.cohort === viewType);
    top10ItemNames = anchorCohortData
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((d) => d[domainKey]);
  }

  const transformedData = top10ItemNames.map((itemName) => {
    const itemData = { [domainKey]: itemName };
    orderedCohorts.forEach((cohort) => {
      itemData[cohort] = 0;
    });
    data.forEach((d) => {
      if (d[domainKey] === itemName) {
        itemData[d.cohort] = +d.count || 0;
      }
    });
    return itemData;
  });

  return {
    domainKey,
    viewType,
    transformedData,
    top10ItemNames,
    orderedCohorts,
  };
}
