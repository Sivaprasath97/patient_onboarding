import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, FormAlert, Input, Select } from '../../../shared/ui/index.js';
import AuthShell from '../components/AuthShell.jsx';
import PasswordStrength from '../components/PasswordStrength.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi, passwordError } from '../services/authApi.js';

const EMPTY = { full_name: '', email: '', role: '', site: '', phone: '', password: '', confirm: '' };

function validate(f) {
  const e = {};
  if (f.full_name.trim().length < 2) e.full_name = 'Enter your full name';
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = 'Enter a valid email address';
  if (!f.role) e.role = 'Select your role';
  const pw = passwordError(f.password);
  if (pw) e.password = pw;
  if (f.confirm !== f.password) e.confirm = 'Passwords do not match';
  return e;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.roles().then(setRoles).catch((err) => setAlert(err.message));
  }, []);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    setAlert('');
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { confirm, ...payload } = form;
      await register({
        ...payload,
        full_name: payload.full_name.trim(),
        email: payload.email.trim(),
        site: payload.site.trim() || null,
        phone: payload.phone.trim() || null,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setAlert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register as a member of a clinical study team."
      footer={<>Already registered?{' '}<Link to="/login" className="text-primary-container font-semibold hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <FormAlert>{alert}</FormAlert>
        <Input label="Full name" name="full_name" required icon="badge" autoComplete="name" placeholder="Dr. Jane Smith"
          value={form.full_name} onChange={onChange} error={errors.full_name} autoFocus />
        <Input label="Work email" name="email" required type="email" icon="mail" autoComplete="email" placeholder="you@hospital.org"
          value={form.email} onChange={onChange} error={errors.email} />
        <Select label="Role" name="role" required placeholder="Select your role…" options={roles} value={form.role} onChange={onChange} error={errors.role} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Site / organisation" name="site" icon="domain" placeholder="Optional" value={form.site} onChange={onChange} error={errors.site} />
          <Input label="Phone" name="phone" type="tel" icon="call" autoComplete="tel" placeholder="Optional" value={form.phone} onChange={onChange} error={errors.phone} />
        </div>
        <div className="space-y-2">
          <Input label="Password" name="password" required type="password" icon="lock" autoComplete="new-password"
            value={form.password} onChange={onChange} error={errors.password} />
          <PasswordStrength password={form.password} />
        </div>
        <Input label="Confirm password" name="confirm" required type="password" icon="lock" autoComplete="new-password"
          value={form.confirm} onChange={onChange} error={errors.confirm} />
        <Button type="submit" loading={loading} className="w-full h-10">Create account</Button>
        <p className="font-body-sm text-body-sm text-outline text-center">Administrator accounts are created by your system administrator.</p>
      </form>
    </AuthShell>
  );
}
