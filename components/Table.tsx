import React from 'react';

interface TableProps {
  headers: string[];
  rows: (string | number)[][];
}

export const Table: React.FC<TableProps> = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700/50 my-0 -mx-1 sm:mx-0">
      <table className="min-w-full divide-y-2 divide-gray-700 bg-gray-800 text-xs sm:text-sm">
        <thead className="bg-gray-900/70">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 font-medium text-white text-left"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-700/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="whitespace-nowrap px-3 sm:px-4 py-2 sm:py-2.5 text-gray-300"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};