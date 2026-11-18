import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, FormAlert, Input, Spinner } from '../../../shared/ui/index.js';
import AuthShell from '../components/AuthShell.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { authApi, passwordError } from '../services/authApi.js';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [check, setCheck] = useState({ loading: true });
  const [v, setV] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return setCheck({ error: 'This reset link is incomplete. Request a new one.' });
    authApi.checkResetToken(token).then((r) => setCheck({ email: r.email })).catch((e) => setCheck({ error: e.message }));
  }, [token]);

  const on = (e) => {
    setV((s) => ({ ...s, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    const pw = passwordError(v.password);
    if (pw) errs.password = pw;
    if (v.confirm !== v.password) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setAlert('');
    try {
      await authApi.resetPassword(token, v.password);
      navigate('/login', { replace: true, state: { reason: 'reset' } });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setAlert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle={check.email ? `For ${check.email}` : 'Set a new password for your account.'}
      footer={<Link to="/login" className="text-primary-container font-semibold hover:underline">Back to sign in</Link>}>
      {check.loading ? <Spinner label="Checking link…" /> : check.error ? (
        <div className="space-y-4">
          <FormAlert>{check.error}</FormAlert>
          <Button to="/forgot-password" className="w-full">Request a new link</Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert>{alert}</FormAlert>
          <div className="space-y-2">
            <Input label="New password" name="password" type="password" icon="lock" autoComplete="new-password" value={v.password} onChange={on} error={errors.password} autoFocus />
            <PasswordStrength password={v.password} />
          </div>
          <Input label="Confirm new password" name="confirm" type="password" icon="lock" autoComplete="new-password" value={v.confirm} onChange={on} error={errors.confirm} />
          <Button type="submit" loading={loading} className="w-full h-10">Update password</Button>
          <p className="font-body-sm text-body-sm text-outline text-center">You'll be signed out of all devices.</p>
        </form>
      )}
    </AuthShell>
  );
}
