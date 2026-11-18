import { EmptyState, ErrorState, Spinner } from './Layout.jsx';

/**
 * columns: [{ key, label, render?(row), className?, align? }]
 */
export default function DataTable({ columns, rows, loading, error, onRetry, onRowClick, empty, rowKey = 'id', rowClassName }) {
  if (error) return <div className="p-4"><ErrorState error={error} onRetry={onRetry} /></div>;
  return (
    <div className="overflow-x-auto custom-scroll">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2 font-label-md text-[11px] uppercase tracking-[0.04em] text-[#64748B] whitespace-nowrap ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading && !rows?.length ? (
            <tr>
              <td colSpan={columns.length}>
                <Spinner />
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr>
              <td colSpan={columns.length}>{empty || <EmptyState title="No records found" />}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row[rowKey]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-[#F1F5F9] hover:bg-[#F8FAFC] ${onRowClick ? 'cursor-pointer' : ''} ${loading ? 'opacity-60' : ''} ${rowClassName ? rowClassName(row) : ''}`}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-2.5 font-body-md text-body-md text-on-surface align-middle ${c.align === 'right' ? 'text-right' : ''} ${c.className || ''}`}
                  >
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pageSize, total, onChange }) {
  if (!total) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-xl">
      <span className="font-body-sm text-body-sm text-on-surface-variant">
        Showing <span className="font-data-mono">{from}–{to}</span> of <span className="font-data-mono">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <PageBtn icon="chevron_left" disabled={page <= 1} onClick={() => onChange(page - 1)} />
        <span className="font-data-mono text-data-mono px-2">
          {page} / {pages}
        </span>
        <PageBtn icon="chevron_right" disabled={page >= pages} onClick={() => onChange(page + 1)} />
      </div>
    </div>
  );
}

function PageBtn({ icon, ...props }) {
  return (
    <button
      className="w-7 h-7 rounded border border-[#CBD5E1] bg-surface-container-lowest flex items-center justify-center disabled:opacity-40 hover:bg-surface-container-low"
      {...props}
    >
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </button>
  );
}

/** Code-style identifier cell (PT-00001, TRL-0001…) */
export function Code({ children }) {
  return <span className="font-data-mono text-data-mono text-primary-container font-semibold whitespace-nowrap">{children}</span>;
}
