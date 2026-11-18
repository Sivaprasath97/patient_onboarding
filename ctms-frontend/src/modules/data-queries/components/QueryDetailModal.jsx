import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { usePermission } from '../../../shared/hooks/usePermission.js';
import { Button, Code, FormAlert, Modal, StatusBadge, useToast } from '../../../shared/ui/index.js';
import { formatDateTime } from '../../../shared/utils/format.js';
import { queriesApi } from '../services/queriesApi.js';

const LINKS = {
  participant: (q) => `/participants/${q.entity_id}`,
  enrollment: (q) => `/enrollment/${q.entity_id}`,
  visit: () => '/visits',
  assessment: (q) => `/assessments/${q.entity_id}`,
  adverse_event: (q) => `/adverse-events/${q.entity_id}`,
};
const TYPE_STYLE = {
  question: ['help', 'text-[#B45309]'], response: ['reply', 'text-primary-container'],
  close: ['task_alt', 'text-[#23803A]'], reopen: ['restart_alt', 'text-[#DC2626]'],
};

export default function QueryDetailModal({ query, onClose, onChanged }) {
  const can = usePermission();
  const toast = useToast();
  const [q, setQ] = useState(query);
  const [message, setMessage] = useState('');
  const submit = useSubmit();
  useEffect(() => { setQ(query); setMessage(''); submit.reset(); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!q) return null;
  const act = async (fn, msg, requireText = true) => {
    if (requireText && !message.trim()) return submit.setError('Enter a message.');
    const res = await submit.run(fn);
    if (!res.ok) return;
    toast(msg);
    setQ(res.data);
    setMessage('');
    onChanged();
  };

  return (
    <Modal open={!!query} onClose={onClose} size="lg" title={<span className="flex items-center gap-2"><Code>{q.query_code}</Code> <StatusBadge status={q.status} /> <StatusBadge status={q.priority} dot={false} /></span>}
      subtitle={<>On <Link to={LINKS[q.entity_type]?.(q) || '#'} className="text-primary-container hover:underline" onClick={onClose}>{q.entity_label}</Link>{q.field ? ` • field: ${q.field}` : ''}</>}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-x-6 gap-y-1 font-body-sm text-body-sm text-on-surface-variant">
          <span>Raised by <b>{q.raised_by?.name}</b></span>
          <span>Assigned to <b>{q.assigned_to?.name || 'Unassigned'}</b></span>
          {q.trial_code && <span>Trial <b>{q.trial_code}</b></span>}
        </div>
        <ol className="space-y-3">
          {q.thread.map((m, i) => (
            <li key={i} className="flex gap-3">
              <span className={`material-symbols-outlined mt-0.5 ${TYPE_STYLE[m.type]?.[1]}`}>{TYPE_STYLE[m.type]?.[0]}</span>
              <div className="flex-1 p-3 rounded-lg bg-surface-container-low">
                <div className="flex justify-between gap-2 font-label-md text-label-md text-on-surface-variant">
                  <span>{m.by?.name} • {m.type}</span><span className="font-data-mono-sm text-data-mono-sm">{formatDateTime(m.at)}</span>
                </div>
                <p className="font-body-md text-body-md text-on-surface whitespace-pre-wrap mt-1">{m.message}</p>
              </div>
            </li>
          ))}
        </ol>
        <FormAlert>{submit.error}</FormAlert>
        {q.status !== 'Closed' || can('queries:raise') ? (
          <div className="space-y-2">
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Write a response or comment…"
              className="w-full px-3 py-2 border border-[#CBD5E1] rounded-lg font-body-md text-body-md focus:outline-none focus:border-primary-container" />
            <div className="flex flex-wrap justify-end gap-2">
              {q.status !== 'Closed' && can('queries:respond') && (
                <Button icon="reply" loading={submit.loading} onClick={() => act(() => queriesApi.respond(q.id, message.trim()), 'Response sent')}>Respond</Button>
              )}
              {q.status !== 'Closed' && can('queries:close') && (
                <Button variant="success" icon="task_alt" loading={submit.loading} onClick={() => act(() => queriesApi.close(q.id, message.trim() || null), 'Query closed', false)}>Close query</Button>
              )}
              {q.status !== 'Open' && can('queries:raise') && (
                <Button variant="danger" icon="restart_alt" loading={submit.loading} onClick={() => act(() => queriesApi.reopen(q.id, message.trim()), 'Query reopened')}>Reopen</Button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
