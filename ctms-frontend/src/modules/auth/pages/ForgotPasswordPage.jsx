import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, FormAlert, Input } from '../../../shared/ui/index.js';
import AuthShell from '../components/AuthShell.jsx';
import { authApi } from '../services/authApi.js';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address');
    setError('');
    setLoading(true);
    try {
      setResult(await authApi.forgotPassword(email.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a reset link to your registered email address."
      footer={<Link to="/login" className="inline-flex items-center gap-1 text-primary-container font-semibold hover:underline">
        <span className="material-symbols-outlined text-[16px]">arrow_back</span>Back to sign in</Link>}>
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary-fixed/60 border border-secondary-container text-on-secondary-container">
            <span className="material-symbols-outlined">mark_email_read</span>
            <p className="font-body-md text-body-md">{result.message} The link is valid for 30 minutes.</p>
          </div>
          {result.demo_reset_link && (
            <div className="p-3 rounded-lg border border-dashed border-brand-green/60 font-body-md text-body-md">
              <b>Demo mode:</b> email isn't connected, so here's the link that would be emailed:{' '}
              <Link to={result.demo_reset_link} className="text-primary-container font-semibold hover:underline break-all">Open reset link</Link>
            </div>
          )}
          <Button variant="secondary" className="w-full" onClick={() => setResult(null)}>Send to a different email</Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <FormAlert>{error}</FormAlert>
          <Input label="Email" name="email" type="email" icon="mail" autoComplete="email" placeholder="you@hospital.org"
            value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Button type="submit" loading={loading} className="w-full h-10">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
