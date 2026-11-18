import { useEffect, useRef, useState } from 'react';
import { ParticipantPicker, TrialPicker } from '../../../shared/components/Pickers.jsx';
import { useApi, useSubmit } from '../../../shared/hooks/useApi.js';
import { Field, FormModal, Input, Select, TextArea, useToast } from '../../../shared/ui/index.js';
import { fileSize } from '../../../shared/utils/format.js';
import { documentsApi } from '../services/documentsApi.js';

/** Upload a new document, or a new version when `replaces` is given. */
export default function UploadModal({ open, onClose, replaces, defaults = {}, onSaved }) {
  const [v, setV] = useState({});
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const submit = useSubmit();
  const toast = useToast();
  const { data: meta } = useApi(() => documentsApi.meta(), []);

  useEffect(() => {
    if (!open) return;
    submit.reset();
    setFile(null);
    setV({
      title: replaces?.title || '', category: replaces?.category || defaults.category || '', description: '',
      trial_id: defaults.trialId || '', participant_id: defaults.participantId || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));

  function pick(f) {
    if (!f) return;
    const ext = `.${f.name.split('.').pop().toLowerCase()}`;
    if (meta && !meta.allowed_extensions.includes(ext)) return submit.setError(`File type ${ext} is not allowed.`);
    if (meta && f.size > meta.max_mb * 1024 * 1024) return submit.setError(`File is larger than ${meta.max_mb} MB.`);
    submit.reset();
    setFile(f);
    if (!v.title) setV((s) => ({ ...s, title: f.name.replace(/\.[^.]+$/, '') }));
  }

  async function save() {
    if (!file) return submit.setError('Choose a file to upload.');
    if (v.title.trim().length < 2 || !v.category) return submit.setError('Title and category are required.');
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', v.title.trim());
    fd.append('category', v.category);
    if (v.description) fd.append('description', v.description);
    if (replaces) fd.append('replaces_id', replaces.id);
    else {
      if (v.trial_id) fd.append('trial_id', v.trial_id);
      if (v.participant_id) fd.append('participant_id', v.participant_id);
    }
    const res = await submit.run(() => documentsApi.upload(fd));
    if (!res.ok) return;
    toast(`${res.data.title} v${res.data.version} uploaded`);
    onSaved(res.data);
    onClose();
  }

  return (
    <FormModal open={open} onClose={onClose} title={replaces ? `Upload new version of “${replaces.title}”` : 'Upload document'}
      subtitle={replaces ? `Current version: v${replaces.version}. Previous versions are kept.` : undefined}
      onSubmit={save} loading={submit.loading} error={submit.error} submitLabel="Upload">
      <Field label="File" required hint={meta && `Allowed: ${meta.allowed_extensions.join(', ')} • max ${meta.max_mb} MB`}>
        <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          className="cursor-pointer border-2 border-dashed border-[#CBD5E1] rounded-lg p-5 text-center hover:border-primary-container hover:bg-surface-container-low">
          <span className="material-symbols-outlined text-primary-container text-3xl">upload_file</span>
          <p className="font-body-md text-body-md mt-1">{file ? <><b>{file.name}</b> • {fileSize(file.size)}</> : 'Click to choose or drag a file here'}</p>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => pick(e.target.files[0])} />
        </div>
      </Field>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Title" name="title" required value={v.title} onChange={on} />
        <Select label="Category" name="category" required placeholder="Select…" options={meta?.categories || []} value={v.category} onChange={on} disabled={!!replaces} />
      </div>
      {!replaces && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrialPicker name="trial_id" label="Trial (optional)" placeholder="Not linked" value={v.trial_id} onChange={on} disabled={!!defaults.trialId} />
          <ParticipantPicker name="participant_id" status="" label="Participant (optional)" placeholder="Not linked" value={v.participant_id} onChange={on} disabled={!!defaults.participantId} />
        </div>
      )}
      <TextArea label="Description" name="description" rows={2} value={v.description} onChange={on} />
    </FormModal>
  );
}
