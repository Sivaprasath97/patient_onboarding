import { useEffect, useState } from 'react';
import { PERMISSION_GROUPS } from '../../../shared/auth/permissions.js';
import { useSubmit } from '../../../shared/hooks/useApi.js';
import { Button, Card, FormAlert, Input, Page, PageHeader, StatusBadge, useToast } from '../../../shared/ui/index.js';
import { formatDateTime } from '../../../shared/utils/format.js';
import { initials } from '../../../shared/utils/user.js';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi, passwordError } from '../services/authApi.js';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <Page className="max-w-[1100px]">
      <PageHeader title="My profile" subtitle="Your account details, password and access rights." />
      <section className="bg-surface-container-lowest border border-[#E2E8F0] rounded-xl overflow-hidden">
        <div className="h-20 bg-brand-gradient" />
        <div className="px-5 pb-5 pt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <span className="w-16 h-16 -mt-11 sm:-mt-10 rounded-full bg-surface-container-lowest p-1 shrink-0">
            <span className="w-full h-full rounded-full bg-leaf-gradient text-white flex items-center justify-center font-headline-md text-headline-md">
              {initials(user.full_name)}
            </span>
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-headline-lg text-headline-lg text-on-surface truncate">{user.full_name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <StatusBadge tone="blue">{user.role_label}</StatusBadge>
              <span className="font-body-md text-body-md text-on-surface-variant">{user.email}</span>
            </div>
          </div>
          <div className="font-body-sm text-body-sm text-on-surface-variant">Last sign-in: {formatDateTime(user.last_login_at)}</div>
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ProfileForm />
        <ChangePasswordForm />
      </div>
      <MyAccess />
    </Page>
  );
}

function ProfileForm() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const submit = useSubmit();
  const [v, setV] = useState({ full_name: '', phone: '', site: '' });
  useEffect(() => setV({ full_name: user.full_name, phone: user.phone || '', site: user.site || '' }), [user]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));
  const dirty = v.full_name !== user.full_name || v.phone !== (user.phone || '') || v.site !== (user.site || '');

  async function save(e) {
    e.preventDefault();
    if (v.full_name.trim().length < 2) return submit.setError('Enter your full name.');
    const res = await submit.run(() => authApi.updateMe({ full_name: v.full_name.trim(), phone: v.phone.trim() || null, site: v.site.trim() || null }));
    if (!res.ok) return;
    setUser(res.data);
    toast('Profile updated');
  }

  return (
    <Card title="Personal details" icon="badge">
      <form onSubmit={save} noValidate className="space-y-4">
        <FormAlert>{submit.error}</FormAlert>
        <Input label="Full name" name="full_name" required value={v.full_name} onChange={on} error={submit.fieldErrors.full_name} />
        <Input label="Email" name="email" value={user.email} disabled hint="Contact your administrator to change your email." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" name="phone" type="tel" value={v.phone} onChange={on} />
          <Input label="Site / organisation" name="site" value={v.site} onChange={on} />
        </div>
        <div className="flex justify-end">
          <Button type="submit" icon="save" loading={submit.loading} disabled={!dirty}>Save changes</Button>
        </div>
      </form>
    </Card>
  );
}

function ChangePasswordForm() {
  const toast = useToast();
  const submit = useSubmit();
  const EMPTY = { current_password: '', new_password: '', confirm: '' };
  const [v, setV] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const on = (e) => {
    setV((s) => ({ ...s, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  async function save(e) {
    e.preventDefault();
    const errs = {};
    if (!v.current_password) errs.current_password = 'Enter your current password';
    const pw = passwordError(v.new_password);
    if (pw) errs.new_password = pw;
    else if (v.new_password === v.current_password) errs.new_password = 'Must be different from the current password';
    if (v.confirm !== v.new_password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await submit.run(() => authApi.changePassword(v.current_password, v.new_password));
    if (!res.ok) return;
    setV(EMPTY);
    toast('Password changed');
  }

  const err = { ...submit.fieldErrors, ...errors };
  return (
    <Card title="Change password" icon="key">
      <form onSubmit={save} noValidate className="space-y-4">
        <FormAlert>{!Object.keys(submit.fieldErrors).length && submit.error}</FormAlert>
        <Input label="Current password" name="current_password" type="password" autoComplete="current-password" value={v.current_password} onChange={on} error={err.current_password} />
        <div className="space-y-2">
          <Input label="New password" name="new_password" type="password" autoComplete="new-password" value={v.new_password} onChange={on} error={err.new_password} />
          <PasswordStrength password={v.new_password} />
        </div>
        <Input label="Confirm new password" name="confirm" type="password" autoComplete="new-password" value={v.confirm} onChange={on} error={err.confirm} />
        <div className="flex justify-end">
          <Button type="submit" icon="lock_reset" loading={submit.loading}>Update password</Button>
        </div>
      </form>
    </Card>
  );
}

function MyAccess() {
  const { user } = useAuth();
  const mine = new Set(user.permissions || []);
  return (
    <Card title="What you can do" subtitle={`Access granted to the ${user.role_label} role`} icon="verified_user">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {PERMISSION_GROUPS.map(([group, perms]) => (
          <div key={group}>
            <h3 className="font-label-md text-label-md uppercase tracking-[0.04em] text-on-surface-variant mb-1.5">{group}</h3>
            <ul className="space-y-1">
              {perms.map(([p, desc]) => (
                <li key={p} className={`flex items-start gap-2 font-body-md text-body-md ${mine.has(p) ? 'text-on-surface' : 'text-outline'}`}>
                  <span className={`material-symbols-outlined text-[16px] mt-px ${mine.has(p) ? 'text-secondary' : 'text-outline-variant'}`}>
                    {mine.has(p) ? 'check_circle' : 'block'}
                  </span>
                  {desc}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
