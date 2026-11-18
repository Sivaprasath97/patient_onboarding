import { useEffect, useState } from 'react';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { FormModal, Select, StatusBadge, TextArea, useToast } from '../../../shared/ui/index.js';
import { TRANSITIONS, trialsApi } from '../services/trialsApi.js';

export default function StatusChangeModal({ open, onClose, trial, onSaved }) {
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const submit = useSubmit();
  const toast = useToast();
  const options = TRANSITIONS[trial?.status] || [];
  const needsReason = ['Suspended', 'Terminated'].includes(status);

  useEffect(() => {
    if (open) {
      setStatus(options[0] || '');
      setReason('');
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    if (needsReason && !reason.trim()) return submit.setError('A reason is required to suspend or terminate a trial.');
    const res = await submit.run(() => trialsApi.changeStatus(trial.id, status, reason.trim() || null));
    if (!res.ok) return;
    toast(`${trial.trial_code} is now ${status}`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title="Change trial status" size="sm" onSubmit={save} loading={submit.loading}
      error={submit.error} submitLabel="Update status" submitVariant={status === 'Terminated' ? 'solidDanger' : 'primary'}>
      <div className="flex items-center gap-2 font-body-md text-body-md">
        Current status: <StatusBadge status={trial?.status} />
      </div>
      {options.length ? (
        <>
          <Select label="New status" name="status" options={options} value={status} onChange={(e) => setStatus(e.target.value)} />
          {status === 'Active' && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">The trial needs an active protocol before it can be activated.</p>
          )}
          <TextArea label="Reason" name="reason" required={needsReason} value={reason} onChange={(e) => setReason(e.target.value)}
            hint="Recorded in the status history and audit trail." />
        </>
      ) : (
        <p className="font-body-md text-body-md text-on-surface-variant">This trial is {trial?.status}; its status can't be changed.</p>
      )}
    </FormModal>
  );
}
