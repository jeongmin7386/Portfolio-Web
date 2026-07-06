import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { login } from '../../features/auth/authApi';
import { getApiErrorMessage } from '../../lib/apiClient';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/dashboard/projects')
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ email, password });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <p className="eyebrow">Canvasfolio Studio</p>
        <h1>Open your portfolio builder.</h1>
        <form onSubmit={handleSubmit} className="stack">
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {mutation.isError && <p className="form-error">{getApiErrorMessage(mutation.error, 'Check your login information.')}</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Logging in...' : 'Log in'}
          </Button>
        </form>
        <p className="muted">
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </section>
    </main>
  );
}
