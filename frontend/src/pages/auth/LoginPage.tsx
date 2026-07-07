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
        <p className="eyebrow">캔버스폴리오 스튜디오</p>
        <h1>포트폴리오 빌더로 돌아가기</h1>
        <form onSubmit={handleSubmit} className="stack">
          <Input label="이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="비밀번호" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {mutation.isError && <p className="form-error">{getApiErrorMessage(mutation.error, '로그인 정보를 확인해주세요.')}</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '로그인 중...' : '로그인'}
          </Button>
        </form>
        <p className="muted">
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </section>
    </main>
  );
}
