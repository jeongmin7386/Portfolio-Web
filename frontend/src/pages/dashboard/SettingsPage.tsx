import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Toggle } from '../../components/ui/Toggle';
import { getProfile, updateProfile } from '../../features/auth/profileApi';
import { TemplatePreviewCard } from '../../templates/TemplatePreviewCard';
import { portfolioTemplates } from '../../templates/portfolioTemplates';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [theme, setTheme] = useState('MINIMAL_PORTFOLIO');
  const [publicProfile, setPublicProfile] = useState(true);
  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] })
  });

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }
    setSlug(profileQuery.data.slug);
    setDisplayName(profileQuery.data.displayName);
    setBio(profileQuery.data.bio ?? '');
    setProfileImageUrl(profileQuery.data.profileImageUrl ?? '');
    setTheme(profileQuery.data.theme === 'MINIMAL_GRID' ? 'MINIMAL_PORTFOLIO' : profileQuery.data.theme || 'MINIMAL_PORTFOLIO');
    setPublicProfile(profileQuery.data.publicProfile);
  }, [profileQuery.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ slug, displayName, bio, profileImageUrl, theme, publicProfile });
  }

  return (
    <section className="settings-page">
      <div className="section-heading">
        <div>
          <p className="eyebrow">템플릿과 테마</p>
          <h1>포트폴리오 웹사이트의 분위기를 선택하세요.</h1>
        </div>
      </div>

      <form className="settings-layout" onSubmit={handleSubmit}>
        <div className="settings-main">
          <section className="dashboard-band">
            <div className="compact-heading section-heading">
              <div>
                <p className="eyebrow">템플릿 선택</p>
                <h2>포트폴리오 레이아웃</h2>
              </div>
            </div>
            <div className="template-grid compact-template-grid">
              {portfolioTemplates.map((template) => (
                <TemplatePreviewCard key={template.id} template={template} selected={theme === template.id} onSelect={setTheme} />
              ))}
            </div>
          </section>
        </div>

        <aside className="settings-inspector">
          <div className="inspector-section">
            <p className="panel-label">게시 상태</p>
            <Toggle checked={publicProfile} onChange={setPublicProfile} label={publicProfile ? '게시됨' : '비공개'} />
          </div>
          <div className="inspector-section">
            <Input label="공개 주소" value={slug} onChange={(event) => setSlug(event.target.value)} required />
            <Input label="표시 이름" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            <Textarea label="포트폴리오 소개" value={bio} onChange={(event) => setBio(event.target.value)} rows={5} />
            <Input label="프로필 이미지 URL" value={profileImageUrl} onChange={(event) => setProfileImageUrl(event.target.value)} />
          </div>
          {mutation.isSuccess && <p className="form-success">설정이 저장되었습니다.</p>}
          {mutation.isError && <p className="form-error">설정을 저장하지 못했습니다.</p>}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중...' : '테마 저장'}
          </Button>
        </aside>
      </form>
    </section>
  );
}
