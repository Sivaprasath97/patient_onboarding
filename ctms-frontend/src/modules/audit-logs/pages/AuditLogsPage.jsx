import { Fragment, useState } from 'react';
import { useApi, useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { Card, EmptyState, ErrorState, FilterSelect, Input, Page, PageHeader, Pagination, SearchInput, Spinner } from '../../../shared/ui/index.js';
import { formatDateTime, humanize } from '../../../shared/utils/format.js';
import { auditApi } from '../services/auditApi.js';

export default function AuditLogsPage() {
  const [q, setQ] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState(null);
  const { data: facets } = useApi(() => auditApi.facets(), []);
  const list = useList(auditApi.list, { q: useDebounced(q), action, entity_type: entityType, date_from: from, date_to: to }, 50);

  return (
    <Page>
      <PageHeader title="Audit logs" subtitle="Tamper-evident record of logins, record creation and modification. Read-only: entries can't be edited or deleted." />
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-end gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search user, email, record…" />
          <FilterSelect value={action} onChange={setAction} placeholder="All actions" options={(facets?.actions || []).map((a) => ({ value: a, label: humanize(a) }))} />
          <FilterSelect value={entityType} onChange={setEntityType} placeholder="All record types" options={(facets?.entity_types || []).map((a) => ({ value: a, label: humanize(a) }))} />
          <Input name="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" aria-label="From date" />
          <Input name="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" aria-label="To date" />
        </div>
        {list.error ? <div className="p-4"><ErrorState error={list.error} onRetry={list.reload} /></div> : list.loading && !list.items.length ? <Spinner /> : !list.items.length ? (
          <EmptyState icon="history" title="No audit entries match" />
        ) : (
          <div className="overflow-x-auto custom-scroll">
            <table className="w-full text-left">
              <thead><tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {['Timestamp', 'User', 'Action', 'Record', 'IP', ''].map((h) => <th key={h} className="px-4 py-2 font-label-md text-[11px] uppercase text-[#64748B] whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {list.items.map((a) => {
                  const hasDetail = Object.keys(a.changes || {}).length || Object.keys(a.details || {}).length;
                  return (
                    <Fragment key={a.id}>
                      <tr className={`border-b border-[#F1F5F9] font-body-md text-body-md ${hasDetail ? 'cursor-pointer hover:bg-[#F8FAFC]' : ''}`} onClick={() => hasDetail && setExpanded(expanded === a.id ? null : a.id)}>
                        <td className="px-4 py-2 font-data-mono-sm text-data-mono-sm whitespace-nowrap">{formatDateTime(a.timestamp)}</td>
                        <td className="px-4 py-2"><div>{a.user_name || '—'}</div><div className="font-body-sm text-body-sm text-on-surface-variant">{a.email}</div></td>
                        <td className="px-4 py-2"><span className={`font-data-mono text-data-mono ${a.action.includes('failed') ? 'text-[#DC2626]' : 'text-on-surface'}`}>{a.action}</span></td>
                        <td className="px-4 py-2">{a.entity_type ? <><span className="text-on-surface-variant">{humanize(a.entity_type)}:</span> {a.entity_label}</> : '—'}</td>
                        <td className="px-4 py-2 font-data-mono-sm text-data-mono-sm text-outline">{a.ip || '—'}</td>
                        <td className="px-4 py-2 text-outline">{hasDetail ? <span className="material-symbols-outlined text-[18px]">{expanded === a.id ? 'expand_less' : 'expand_more'}</span> : null}</td>
                      </tr>
                      {expanded === a.id && (
                        <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          <td colSpan={6} className="px-6 py-3">
                            {Object.entries(a.changes || {}).map(([k, c]) => (
                              <div key={k} className="font-data-mono-sm text-data-mono-sm py-0.5">
                                <b>{k}</b>: <span className="text-[#B91C1C] line-through">{JSON.stringify(c.from)}</span> → <span className="text-[#1B6B30]">{JSON.stringify(c.to)}</span>
                              </div>
                            ))}
                            {Object.entries(a.details || {}).map(([k, v]) => (
                              <div key={k} className="font-data-mono-sm text-data-mono-sm py-0.5"><b>{k}</b>: {JSON.stringify(v)}</div>
                            ))}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>
    </Page>
  );
}
