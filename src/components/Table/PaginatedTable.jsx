import React from 'react';
import { usePagination } from '../../hooks/usePagination';

export default function PaginatedTable({ title, data, columns }) {
  const { currentPage, totalPages, paginatedData, nextPage, prevPage } =
    usePagination(data, 10);

  return (
    <div className="mb-4 flex w-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>

      {!data || data.length === 0 ? (
        <p className="text-sm text-gray-500">
          No {title.replace(' Information', '').toLowerCase()} data available.
        </p>
      ) : (
        <>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((col) => (
                  <th key={col.header} className="border-b px-4 py-2">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.header} className="border-b px-4 py-2">
                      {col.Cell ? col.Cell({ row }) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex items-center justify-between">
            <button
              className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <p className="text-sm">
              Page {currentPage} of {totalPages}
            </p>
            <button
              className="rounded bg-gray-200 px-3 py-1 disabled:opacity-50"
              onClick={nextPage}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
