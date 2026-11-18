import { useState } from 'react';
import { TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useApi } from '../../../shared/hooks/useApi.js';
import { Button, Card, DataTable, EmptyState, Input, Page, PageHeader, useToast } from '../../../shared/ui/index.js';
import { formatDateTime } from '../../../shared/utils/format.js';
import { reportsApi } from '../services/reportsApi.js';

const ICONS = {
  'trial-summary': 'summarize', enrollment: 'how_to_reg', 'screening-withdrawal': 'person_off',
  'visit-completion': 'event_available', 'adverse-events': 'health_and_safety', 'trial-progress': 'trending_up',
};

export default function ReportsPage() {
  const toast = useToast();
  const { data: reports } = useApi(() => reportsApi.list(), []);
  const [type, setType] = useState('trial-summary');
  const [filters, setFilters] = useState({ trial_id: '', date_from: '', date_to: '' });
  const [exporting, setExporting] = useState('');
  const key = JSON.stringify(filters);
  const { data: report, loading, error, reload } = useApi(() => reportsApi.get(type, filters), [type, key]);

  const on = (e) => setFilters((f) => ({ ...f, [e.target.name]: e.target.value }));
  async function doExport(format) {
    setExporting(format);
    try {
      await reportsApi.export(type, format, filters);
      toast(`${format.toUpperCase()} downloaded`);
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setExporting('');
    }
  }

  return (
    <Page>
      <PageHeader title="Reports & analytics" subtitle="Generate clinical research reports and export them to PDF or Excel." />

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {(reports || []).map((r) => (
          <button key={r.id} onClick={() => setType(r.id)}
            className={`text-left p-3 rounded-xl border bg-surface-container-lowest transition-colors ${type === r.id ? 'border-primary-container ring-2 ring-primary-container/10' : 'border-[#E2E8F0] hover:border-primary-container'}`}>
            <span className="material-symbols-outlined text-primary-container">{ICONS[r.id] || 'description'}</span>
            <div className="font-label-lg text-label-lg mt-1">{r.title}</div>
          </button>
        ))}
      </section>

      <Card title={report?.title || 'Report'} subtitle={report && `Generated ${formatDateTime(report.generated_at)} • ${report.rows.length} rows`} bodyClassName="p-0"
        actions={<>
          <Button size="sm" variant="secondary" icon="table" loading={exporting === 'xlsx'} disabled={!report} onClick={() => doExport('xlsx')}>Excel</Button>
          <Button size="sm" variant="secondary" icon="picture_as_pdf" loading={exporting === 'pdf'} disabled={!report} onClick={() => doExport('pdf')}>PDF</Button>
        </>}>
        <div className="flex flex-wrap items-end gap-3 p-3 border-b border-[#E2E8F0]">
          <div className="w-72"><TrialPicker name="trial_id" label="Trial" placeholder="All trials" value={filters.trial_id} onChange={on} /></div>
          <Input label="From" name="date_from" type="date" value={filters.date_from} onChange={on} className="w-44" />
          <Input label="To" name="date_to" type="date" value={filters.date_to} onChange={on} className="w-44" />
          {(filters.trial_id || filters.date_from || filters.date_to) && (
            <Button variant="ghost" onClick={() => setFilters({ trial_id: '', date_from: '', date_to: '' })}>Clear filters</Button>
          )}
        </div>
        {report && Object.keys(report.summary || {}).length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            {Object.entries(report.summary).map(([k, v]) => (
              <span key={k} className="px-2.5 py-1 rounded-full bg-surface-container-lowest border border-[#E2E8F0] font-label-lg text-label-lg">
                {k}: <span className="font-data-mono text-primary-container">{v}</span>
              </span>
            ))}
          </div>
        )}
        <DataTable rowKey="_k" loading={loading} error={error} onRetry={reload}
          columns={(report?.columns || []).map((c) => ({ key: c.key, label: c.label }))}
          rows={(report?.rows || []).map((r, i) => ({ ...r, _k: i }))}
          empty={<EmptyState icon="analytics" title="No data for these filters" />} />
      </Card>
    </Page>
  );
}
