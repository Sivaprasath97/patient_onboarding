import { useEffect, useState } from 'react';
import ReasonModal from '../../../shared/components/ReasonModal.jsx';
import { EnrollmentPicker } from '../../../shared/components/Pickers.jsx';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { FormModal, Input, TextArea, useToast } from '../../../shared/ui/index.js';
import { formatDate, todayISO } from '../../../shared/utils/format.js';
import { visitsApi } from '../services/visitsApi.js';

/** All visit action dialogs. `action` = { type: 'complete'|'reschedule'|'cancel'|'missed', visit } */
export default function VisitActions({ action, onClose, onDone }) {
  const v = action?.visit;
  return (
    <>
      <CompleteModal open={action?.type === 'complete'} visit={v} onClose={onClose} onDone={onDone} />
      <RescheduleModal open={action?.type === 'reschedule'} visit={v} onClose={onClose} onDone={onDone} />
      <ReasonModal open={action?.type === 'cancel'} onClose={onClose} title={`Cancel ${v?.visit_name}`} submitLabel="Cancel visit"
        successMessage="Visit cancelled" onConfirm={(r) => visitsApi.cancel(v.id, r)} onDone={onDone} />
      <ReasonModal open={action?.type === 'missed'} onClose={onClose} title={`Mark ${v?.visit_name} as missed`} submitLabel="Mark missed"
        successMessage="Visit marked as missed" onConfirm={(r) => visitsApi.missed(v.id, r)} onDone={onDone} />
    </>
  );
}

function CompleteModal({ open, visit, onClose, onDone }) {
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState('');
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setNotes('');
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    const res = await submit.run(() => visitsApi.complete(visit.id, { completed_date: date, notes: notes || null }));
    if (!res.ok) return;
    toast(res.data.out_of_window ? 'Visit completed — outside the protocol window' : 'Visit completed', res.data.out_of_window ? 'info' : 'success');
    onDone(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} size="sm" title={`Complete ${visit?.visit_name}`} submitLabel="Mark completed" submitVariant="success"
      subtitle={visit && `Window: ${formatDate(visit.window_start)} – ${formatDate(visit.window_end)}`} onSubmit={save} loading={submit.loading} error={submit.error}>
      <Input label="Completion date" name="completed_date" type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
      {visit && (date < visit.window_start || date > visit.window_end) && (
        <p className="font-body-sm text-body-sm text-[#B45309]">This date is outside the protocol visit window; consider reporting a protocol deviation.</p>
      )}
      <TextArea label="Visit notes" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
    </FormModal>
  );
}

function RescheduleModal({ open, visit, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (open && visit) {
      setDate(visit.scheduled_date);
      setReason('');
      submit.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function save() {
    if (reason.trim().length < 3) return submit.setError('Enter a reason for rescheduling.');
    const res = await submit.run(() => visitsApi.reschedule(visit.id, { scheduled_date: date, reason: reason.trim() }));
    if (!res.ok) return;
    toast('Visit rescheduled');
    onDone(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} size="sm" title={`Reschedule ${visit?.visit_name}`} submitLabel="Reschedule"
      subtitle={visit && `Protocol window: ${formatDate(visit.window_start)} – ${formatDate(visit.window_end)}`} onSubmit={save} loading={submit.loading} error={submit.error}>
      <Input label="New date" name="scheduled_date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <TextArea label="Reason" name="reason" required value={reason} onChange={(e) => setReason(e.target.value)} />
    </FormModal>
  );
}

export function ScheduleVisitModal({ open, onClose, defaultEnrollment, onDone }) {
  const [v, setV] = useState({});
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (open) {
      submit.reset();
      setV({ enrollment_id: defaultEnrollment || '', visit_name: '', visit_type: 'Unscheduled', scheduled_date: todayISO(), window_days: 0, notes: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));

  async function save() {
    if (!v.enrollment_id || v.visit_name.trim().length < 2) return submit.setError('Select an enrollment and enter a visit name.');
    const res = await submit.run(() => visitsApi.create({ ...v, window_days: Number(v.window_days) || 0, notes: v.notes || null }));
    if (!res.ok) return;
    toast('Visit scheduled');
    onDone(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title="Schedule a visit" subtitle="Visits must belong to a participant who is in screening or enrolled (BR-6)."
      onSubmit={save} loading={submit.loading} error={submit.error} submitLabel="Schedule">
      <EnrollmentPicker name="enrollment_id" required value={v.enrollment_id} onChange={on} status="Enrolled" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Visit name" name="visit_name" required value={v.visit_name} onChange={on} placeholder="e.g. Unscheduled safety visit" />
        <Input label="Visit type" name="visit_type" value={v.visit_type} onChange={on} />
        <Input label="Date" name="scheduled_date" type="date" value={v.scheduled_date} onChange={on} />
        <Input label="Window (± days)" name="window_days" type="number" min="0" max="60" value={v.window_days} onChange={on} />
      </div>
      <TextArea label="Notes" name="notes" value={v.notes} onChange={on} />
    </FormModal>
  );
}
