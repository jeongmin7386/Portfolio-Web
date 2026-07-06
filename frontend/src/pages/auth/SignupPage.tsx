import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { signup } from '../../features/auth/authApi';

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [portfolioSlug, setPortfolioSlug] = useState('');
  const suggestedSlug = useMemo(() => slugify(email.split('@')[0] ?? ''), [email]);
  const mutation = useMutation({
    mutationFn: signup,
    onSuccess: () => navigate('/dashboard/projects')
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({
      email,
      password,
      name,
      portfolioSlug: portfolioSlug || suggestedSlug || 'portfolio'
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-wide">
        <p className="eyebrow">Canvasfolio Studio</p>
        <h1>Create your portfolio website.</h1>
        <form onSubmit={handleSubmit} className="stack">
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Input
            label="Public URL"
            value={portfolioSlug}
            onChange={(event) => setPortfolioSlug(event.target.value)}
            placeholder={suggestedSlug || 'my-portfolio'}
            required={!suggestedSlug}
          />
          {mutation.isError && <p className="form-error">Could not create the account. Check the email or public URL.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating...' : 'Start building'}
          </Button>
        </form>
        <p className="muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </section>
    </main>
  );
}
