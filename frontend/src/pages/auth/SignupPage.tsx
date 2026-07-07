import { FormEvent, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { signup } from '../../features/auth/authApi';
import { getApiErrorMessage } from '../../lib/apiClient';

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
    const cleanSlug = slugify(portfolioSlug || suggestedSlug || 'portfolio') || 'portfolio';
    mutation.mutate({
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
      portfolioSlug: cleanSlug
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-panel-wide">
        <p className="eyebrow">캔버스폴리오 스튜디오</p>
        <h1>포트폴리오 웹사이트 만들기</h1>
        <form onSubmit={handleSubmit} className="stack">
          <Input label="이름" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label="이메일" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="비밀번호" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Input
            label="공개 주소"
            value={portfolioSlug}
            onChange={(event) => setPortfolioSlug(event.target.value)}
            placeholder={suggestedSlug || 'my-portfolio'}
            required={!suggestedSlug}
          />
          <p className="field-hint">영문 소문자, 숫자, 하이픈만 사용됩니다. 예: my-portfolio7386</p>
          {mutation.isError && (
            <p className="form-error">
              {getApiErrorMessage(mutation.error, '계정을 만들 수 없습니다. 이메일 또는 공개 주소를 확인해주세요.')}
            </p>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '생성 중...' : '시작하기'}
          </Button>
        </form>
        <p className="muted">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </section>
    </main>
  );
}
