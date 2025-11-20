import { generateA11yId } from '@/lib/accessibility'

interface FormFieldProps {
  label: string
  children: React.ReactNode
  error?: string
  description?: string
  required?: boolean
}

export function FormField({ label, children, error, description, required }: FormFieldProps) {
  const fieldId = generateA11yId('field')
  const errorId = generateA11yId('error')
  const descId = generateA11yId('desc')

  return (
    <div className="mb-4">
      <label
        htmlFor={fieldId}
        className={`block text-sm font-medium mb-1 ${required ? 'required' : ''}`}
      >
        {label}
        {required && (
          <span className="text-red-600 ml-1" aria-label="obavezno polje">
            *
          </span>
        )}
      </label>
      
      {description && (
        <p id={descId} className="text-sm text-gray-600 mb-2">
          {description}
        </p>
      )}
      
      <div>
        {React.cloneElement(children as React.ReactElement<any>, {
          id: fieldId,
          'aria-describedby': `${description ? descId : ''} ${error ? errorId : ''}`.trim(),
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required
        })}
      </div>
      
      {error && (
        <p id={errorId} role="alert" className="error-message text-sm mt-1">
          <span className="sr-only">Greška: </span>
          {error}
        </p>
      )}
    </div>
  )
}

interface SearchFieldProps {
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  resultsLabel?: string
}

export function AccessibleSearchField({
  placeholder,
  value,
  onChange,
  onSubmit,
  resultsLabel = 'rezultati pretrage'
}: SearchFieldProps) {
  const searchId = generateA11yId('search')
  const resultsId = generateA11yId('results')

  return (
    <div className="relative">
      <label htmlFor={searchId} className="sr-only">
        {placeholder}
      </label>
      <div className="relative">
        <input
          id={searchId}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onSubmit) {
              e.preventDefault()
              onSubmit()
            }
          }}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          aria-describedby={resultsId}
          autoComplete="off"
        />
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span aria-hidden="true">🔍</span>
        </div>
      </div>
      <div id={resultsId} className="sr-only" aria-live="polite">
        {value ? `Pretraga za: ${value}. ${resultsLabel} će biti prikazani ispod.` : ''}
      </div>
    </div>
  )
}

interface DataTableProps {
  data: Array<Record<string, any>>
  columns: Array<{
    key: string
    header: string
    sortable?: boolean
  }>
  caption: string
}

export function AccessibleDataTable({ data, columns, caption }: DataTableProps) {
  const tableId = generateA11yId('table')

  return (
    <div className="overflow-x-auto">
      <table
        id={tableId}
        className="min-w-full divide-y divide-gray-200"
        role="table"
        aria-label={caption}
      >
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-gray-50">
          <tr role="row">
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                role="columnheader"
                aria-sort={column.sortable ? 'none' : undefined}
                tabIndex={column.sortable ? 0 : -1}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
                {column.sortable && (
                  <span className="ml-2" aria-hidden="true">
                    ↕️
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} role="row" className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {columns.map((column, colIndex) => (
                <td
                  key={column.key}
                  role={colIndex === 0 ? 'rowheader' : 'gridcell'}
                  scope={colIndex === 0 ? 'row' : undefined}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

import React from 'react'