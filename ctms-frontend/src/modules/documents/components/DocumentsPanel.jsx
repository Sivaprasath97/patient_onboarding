import { useState } from 'react';
import { useApi, useDebounced, useList } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Card, Code, DataTable, EmptyState, FilterSelect, Modal, Pagination, SearchInput, Spinner, useToast } from '../../../shared/ui/index.js';
import { fileSize, formatDateTime } from '../../../shared/utils/format.js';
import { documentsApi } from '../services/documentsApi.js';
import UploadModal from './UploadModal.jsx';

const ICONS = { pdf: 'picture_as_pdf', png: 'image', jpg: 'image', jpeg: 'image', xls: 'table', xlsx: 'table', csv: 'table' };

/** Document library. Pass trialId / participantId to scope it to one record. */
export default function DocumentsPanel({ trialId, participantId, showFilters, title = 'Documents' }) {
  const can = usePermission();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [upload, setUpload] = useState(null); // {} for new, doc for new version
  const [versionsOf, setVersionsOf] = useState(null);
  const { data: meta } = useApi(() => documentsApi.meta(), []);
  const dq = useDebounced(q);
  const list = useList(documentsApi.list, { q: dq, category, trial_id: trialId, participant_id: participantId });

  const dl = async (d) => {
    try { await documentsApi.download(d); } catch (e) { toast(e.message, 'error'); }
  };

  const columns = [
    { key: 'title', label: 'Document', render: (d) => (
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-primary-container">{ICONS[d.filename?.split('.').pop()?.toLowerCase()] || 'description'}</span>
        <div><div className="font-label-lg text-label-lg">{d.title}</div><div className="font-body-sm text-body-sm text-on-surface-variant">{d.filename} • {fileSize(d.size)}</div></div>
      </div>
    ) },
    { key: 'category', label: 'Category' },
    { key: 'version', label: 'Version', render: (d) => <button className="font-data-mono text-primary-container hover:underline" onClick={(e) => { e.stopPropagation(); setVersionsOf(d); }}>v{d.version}</button> },
    !trialId && { key: 'trial_code', label: 'Trial', render: (d) => (d.trial_code ? <Code>{d.trial_code}</Code> : '—') },
    !participantId && { key: 'participant_code', label: 'Participant', render: (d) => (d.participant_code ? <Code>{d.participant_code}</Code> : '—') },
    { key: 'uploaded', label: 'Uploaded', render: (d) => <div className="font-body-sm text-body-sm">{d.uploaded_by?.name}<div className="text-outline">{formatDateTime(d.created_at)}</div></div> },
    { key: 'actions', label: '', align: 'right', render: (d) => (
      <div className="flex justify-end gap-1">
        <Button size="sm" variant="secondary" icon="download" onClick={() => dl(d)}>Download</Button>
        {can('documents:write') && <Button size="sm" variant="ghost" icon="upload" onClick={() => setUpload(d)}>New version</Button>}
      </div>
    ) },
  ].filter(Boolean);

  return (
    <Card title={title} bodyClassName="p-0" actions={can('documents:write') && <Button size="sm" icon="upload_file" onClick={() => setUpload({})}>Upload</Button>}>
      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search title, file, trial, participant…" />
          <FilterSelect value={category} onChange={setCategory} options={meta?.categories || []} placeholder="All categories" />
        </div>
      )}
      <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
        empty={<EmptyState icon="folder_open" title="No documents" />} />
      <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />

      <UploadModal open={!!upload} onClose={() => setUpload(null)} replaces={upload?.id ? upload : null}
        defaults={{ trialId, participantId }} onSaved={list.reload} />
      <VersionsModal doc={versionsOf} onClose={() => setVersionsOf(null)} onDownload={dl} />
    </Card>
  );
}

function VersionsModal({ doc, onClose, onDownload }) {
  const { data, loading } = useApi(() => (doc ? documentsApi.versions(doc.id) : null), [doc?.id]);
  return (
    <Modal open={!!doc} onClose={onClose} title="Version history" subtitle={doc?.title}>
      {loading ? <Spinner /> : (
        <ul className="divide-y divide-[#F1F5F9]">
          {(data || []).map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="font-label-lg text-label-lg">v{d.version} {d.is_latest && <span className="text-[#23803A]">(current)</span>} — {d.filename}</div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">{d.uploaded_by?.name} • {formatDateTime(d.created_at)} • {fileSize(d.size)}</div>
              </div>
              <Button size="sm" variant="secondary" icon="download" onClick={() => onDownload(d)}>Download</Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
