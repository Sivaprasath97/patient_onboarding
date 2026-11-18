import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/context/AuthContext.jsx';
import PasswordStrength from '../../auth/components/PasswordStrength.jsx';
import { passwordError } from '../../auth/services/authApi.js';
import { useApi, useDebounced, useList, useSubmit } from '../../../shared/hooks/useApi.js';
import { Button, Card, DataTable, EmptyState, FilterSelect, FormModal, Input, Page, PageHeader, Pagination, SearchInput, Select, StatCard, StatusBadge, Tabs, useToast } from '../../../shared/ui/index.js';
import { formatDateTime } from '../../../shared/utils/format.js';
import { initials } from '../../../shared/utils/user.js';
import RolesMatrix from '../components/RolesMatrix.jsx';
import { ROLES, usersApi } from '../services/usersApi.js';

export default function UsersPage() {
  const [tab, setTab] = useState('users');
  const [editing, setEditing] = useState(null); // {} = new
  const [refresh, setRefresh] = useState(0);
  return (
    <Page>
      <PageHeader title="User management" subtitle="Create accounts, assign roles and control access to the portal."
        actions={tab === 'users' && <Button icon="person_add" onClick={() => setEditing({})}>Add user</Button>} />
      <Tabs active={tab} onChange={setTab} tabs={[{ id: 'users', label: 'Users' }, { id: 'roles', label: 'Roles & permissions' }]} />
      {tab === 'users' ? <UsersTab key={refresh} editing={editing} setEditing={setEditing} onChanged={() => setRefresh((n) => n + 1)} /> : <RolesMatrix />}
    </Page>
  );
}

function UsersTab({ editing, setEditing, onChanged }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState('');
  const [resetFor, setResetFor] = useState(null);
  const list = useList(usersApi.list, { q: useDebounced(q), role, active });
  const { data: all } = useApi(() => usersApi.list({ page_size: 200 }), []);
  const users = all?.items || [];

  async function toggle(u) {
    const next = !u.is_active;
    if (!window.confirm(`${next ? 'Activate' : 'Deactivate'} ${u.full_name}?${next ? '' : ' They will be signed out and can no longer sign in.'}`)) return;
    try {
      await usersApi.update(u.id, { is_active: next });
      toast(`${u.full_name} ${next ? 'activated' : 'deactivated'}`);
      onChanged();
    } catch (e) {
      toast(e.message, 'error');
    }
  }

  const columns = [
    { key: 'name', label: 'User', render: (u) => (
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-label-md text-label-md shrink-0">{initials(u.full_name)}</span>
        <div className="min-w-0">
          <div className="font-label-lg text-label-lg truncate">{u.full_name}{u.id === me.id && <span className="text-outline font-normal"> (you)</span>}</div>
          <div className="font-body-sm text-body-sm text-on-surface-variant truncate">{u.email}</div>
        </div>
      </div>
    ) },
    { key: 'role_label', label: 'Role' },
    { key: 'site', label: 'Site', render: (u) => u.site || '—' },
    { key: 'last_login_at', label: 'Last sign-in', render: (u) => <span className="font-body-sm text-body-sm whitespace-nowrap">{formatDateTime(u.last_login_at)}</span> },
    { key: 'status', label: 'Status', render: (u) => (
      <div className="flex flex-col items-start gap-1">
        <StatusBadge status={u.is_active ? 'Active' : 'Inactive'} />
        {u.locked && <StatusBadge tone="amber">Locked</StatusBadge>}
      </div>
    ) },
    { key: 'actions', label: '', align: 'right', render: (u) => (
      <div className="flex justify-end gap-1 flex-wrap">
        <Button size="sm" variant="secondary" icon="edit" onClick={() => setEditing(u)}>Edit</Button>
        <Button size="sm" variant="secondary" icon="key" onClick={() => setResetFor(u)}>{u.locked ? 'Unlock / reset' : 'Reset password'}</Button>
        {u.id !== me.id && <Button size="sm" variant={u.is_active ? 'danger' : 'success'} onClick={() => toggle(u)}>{u.is_active ? 'Deactivate' : 'Activate'}</Button>}
      </div>
    ) },
  ];

  return (
    <>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total users" value={all ? users.length : undefined} icon="group" />
        <StatCard label="Active" value={all ? users.filter((u) => u.is_active).length : undefined} icon="how_to_reg" tone="teal" />
        <StatCard label="Inactive" value={all ? users.filter((u) => !u.is_active).length : undefined} icon="person_off" tone="slate" />
        <StatCard label="Locked" value={all ? users.filter((u) => u.locked).length : undefined} icon="lock" tone={users.some((u) => u.locked) ? 'amber' : 'slate'} />
      </section>
      <Card bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-[#E2E8F0]">
          <SearchInput value={q} onChange={setQ} placeholder="Search name or email…" className="w-full sm:w-72" />
          <FilterSelect value={role} onChange={setRole} options={ROLES} placeholder="All roles" />
          <FilterSelect value={active} onChange={setActive} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} placeholder="Any status" />
        </div>
        <DataTable columns={columns} rows={list.items} loading={list.loading} error={list.error} onRetry={list.reload}
          rowClassName={(u) => (u.is_active ? '' : 'opacity-60')} empty={<EmptyState icon="group" title="No users found" />} />
        <Pagination page={list.page} pageSize={list.pageSize} total={list.total} onChange={list.setPage} />
      </Card>
      <UserFormModal user={editing} onClose={() => setEditing(null)} onSaved={onChanged} isSelf={editing?.id === me.id} />
      <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} onSaved={onChanged} />
    </>
  );
}

function UserFormModal({ user, onClose, onSaved, isSelf }) {
  const isNew = user && !user.id;
  const [v, setV] = useState({ full_name: '', email: '', password: '', role: '', phone: '', site: '' });
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => {
    if (!user) return;
    submit.reset();
    setV({ full_name: user.full_name || '', email: user.email || '', password: '', role: user.role || '', phone: user.phone || '', site: user.site || '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  const on = (e) => setV((s) => ({ ...s, [e.target.name]: e.target.value }));

  async function save() {
    if ((v.full_name || '').trim().length < 2 || !v.role || (isNew && !/^\S+@\S+\.\S+$/.test(v.email))) return submit.setError('Name, a valid email and role are required.');
    if (isNew) {
      const pw = passwordError(v.password);
      if (pw) return submit.setError(`Temporary password: ${pw}.`);
    }
    const common = { full_name: v.full_name.trim(), role: v.role, phone: v.phone || null, site: v.site || null };
    const res = await submit.run(() => (isNew ? usersApi.create({ ...common, email: v.email.trim(), password: v.password }) : usersApi.update(user.id, common)));
    if (!res.ok) return;
    toast(isNew ? `${res.data.full_name} added` : 'User updated');
    onSaved();
    onClose();
  }

  return (
    <FormModal open={!!user} onClose={onClose} title={isNew ? 'Add user' : `Edit ${user?.full_name}`} onSubmit={save} loading={submit.loading} error={submit.error}
      submitLabel={isNew ? 'Create user' : 'Save changes'}>
      <Input label="Full name" name="full_name" required value={v.full_name || ''} onChange={on} error={submit.fieldErrors.full_name} />
      <Input label="Email" name="email" type="email" required disabled={!isNew} value={v.email || ''} onChange={on} error={submit.fieldErrors.email} />
      {isNew && (
        <div className="space-y-2">
          <Input label="Temporary password" name="password" type="password" required value={v.password} onChange={on}
            hint="Share it securely; the user should change it from My profile." />
          <PasswordStrength password={v.password} />
        </div>
      )}
      <Select label="Role" name="role" required placeholder="Select…" options={ROLES} value={v.role || ''} onChange={on} disabled={isSelf}
        hint={isSelf ? "You can't change your own role." : undefined} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Site / organisation" name="site" value={v.site || ''} onChange={on} />
        <Input label="Phone" name="phone" type="tel" value={v.phone || ''} onChange={on} />
      </div>
    </FormModal>
  );
}

function ResetPasswordModal({ user, onClose, onSaved }) {
  const [pw, setPw] = useState('');
  const submit = useSubmit();
  const toast = useToast();
  useEffect(() => { setPw(''); submit.reset(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <FormModal open={!!user} onClose={onClose} size="sm" title={`Reset password — ${user?.full_name}`} loading={submit.loading} error={submit.error}
      subtitle={user?.locked ? 'This account is locked after failed sign-ins. Setting a new password unlocks it.' : undefined}
      submitLabel="Set password"
      onSubmit={async () => {
        const err = passwordError(pw);
        if (err) return submit.setError(err);
        const res = await submit.run(() => usersApi.resetPassword(user.id, pw));
        if (res.ok) { toast('Password reset'); onSaved(); onClose(); }
      }}>
      <div className="space-y-2">
        <Input label="New password" name="password" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} />
        <PasswordStrength password={pw} />
      </div>
    </FormModal>
  );
}
