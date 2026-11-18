import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { USE_MOCK } from '../../../shared/api/client.js';
import { DEMO_PASSWORD, DEMO_USERS } from '../../../shared/api/mock/db.js';
import { ROLE_LABELS } from '../../../shared/auth/permissions.js';
import { Button, FormAlert, Input } from '../../../shared/ui/index.js';
import AuthShell from '../components/AuthShell.jsx';
import { IDLE_MINUTES, takeLogoutReason, useAuth } from '../context/AuthContext.jsx';

const REASONS = {
  idle: `You were signed out after ${IDLE_MINUTES} minutes of inactivity.`,
  expired: 'Your session has expired. Please sign in again.',
  reset: 'Your password was changed. Sign in with your new password.',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [info] = useState(() => REASONS[location.state?.reason] || REASONS[takeLogoutReason()] || '');
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password) errs.password = 'Password is required';
    setErrors(errs);
    setAlert('');
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setAlert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Use your registered study-team credentials."
      footer={<>New to the portal?{' '}<Link to="/register" className="text-primary-container font-semibold hover:underline">Create an account</Link></>}
      aside={USE_MOCK && <DemoAccounts onPick={(email) => setForm({ email, password: DEMO_PASSWORD })} />}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {info && !alert && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary-fixed border border-primary-fixed-dim text-primary font-body-md text-body-md">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>{info}</span>
          </div>
        )}
        <FormAlert>{alert}</FormAlert>
        <Input label="Email" name="email" type="email" icon="mail" autoComplete="email" placeholder="you@hospital.org"
          value={form.email} onChange={onChange} error={errors.email} autoFocus />
        <div>
          <Input label="Password" name="password" type="password" icon="lock" autoComplete="current-password" placeholder="••••••••"
            value={form.password} onChange={onChange} error={errors.password} />
          <div className="text-right mt-1.5">
            <Link to="/forgot-password" className="font-label-lg text-label-lg text-primary-container hover:underline">Forgot password?</Link>
          </div>
        </div>
        <Button type="submit" loading={loading} className="w-full h-10">Sign in</Button>
      </form>
    </AuthShell>
  );
}

function DemoAccounts({ onPick }) {
  return (
    <div className="mt-6 p-4 rounded-xl border border-dashed border-brand-green/60 bg-secondary-fixed/40">
      <div className="flex items-center gap-2 font-label-lg text-label-lg text-on-secondary-container">
        <span className="material-symbols-outlined text-[18px]">science</span>
        Demo mode — sample accounts (password <code className="font-data-mono">{DEMO_PASSWORD}</code>)
      </div>
      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {DEMO_USERS.map((u) => (
          <button key={u.email} type="button" onClick={() => onPick(u.email)}
            className="text-left px-2.5 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant hover:border-primary-container">
            <div className="font-label-lg text-label-lg text-on-surface">{ROLE_LABELS[u.role]}</div>
            <div className="font-data-mono-sm text-data-mono-sm text-on-surface-variant">{u.email}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
