import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/authApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
        <p className="eyebrow">Portfolio Publisher</p>
        <h1>다시 작업을 이어가세요</h1>
        <form onSubmit={handleSubmit} className="stack">
          <Input label="이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="비밀번호" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {mutation.isError && <p className="form-error">로그인 정보를 확인해주세요.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '로그인 중' : '로그인'}
          </Button>
        </form>
        <p className="muted">
          계정이 없다면 <Link to="/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
