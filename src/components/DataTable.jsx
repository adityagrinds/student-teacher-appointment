import EmptyState from './EmptyState'

export default function DataTable({ columns, rows, rowKey = (r) => r.id, loading, emptyTitle = 'Nothing here', emptyMessage }) {
  if (loading) {
    return (
      <div className="table-skeleton" aria-busy="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
    )
  }
  if (!rows.length) return <EmptyState title={emptyTitle} message={emptyMessage} />
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.header}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
