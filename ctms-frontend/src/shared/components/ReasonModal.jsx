import { useEffect, useState } from 'react';
import { useSubmit } from '../hooks/useApi.js';
import { FormModal, TextArea, useToast } from '../ui/index.js';

/** Confirm an action that requires a written reason (withdraw, cancel, screen fail…). */
export default function ReasonModal({ open, onClose, title, subtitle, label = 'Reason', submitLabel = 'Confirm', danger = true, successMessage, onConfirm, onDone }) {
  const [reason, setReason] = useState('');
  const submit = useSubmit();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setReason('');
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    if (reason.trim().length < 3) return submit.setError('Please enter a reason (at least 3 characters).');
    const res = await submit.run(() => onConfirm(reason.trim()));
    if (!res.ok) return;
    if (successMessage) toast(successMessage);
    onDone?.(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title={title} subtitle={subtitle} size="sm" onSubmit={save} loading={submit.loading}
      error={submit.error} submitLabel={submitLabel} submitVariant={danger ? 'solidDanger' : 'primary'}>
      <TextArea label={label} name="reason" required rows={4} value={reason} onChange={(e) => setReason(e.target.value)}
        hint="Recorded in the audit trail." autoFocus />
    </FormModal>
  );
}
