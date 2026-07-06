import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Toggle } from '../../components/ui/Toggle';
import { getProfile, updateProfile } from '../../features/auth/profileApi';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const [slug, setSlug] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [theme, setTheme] = useState('MINIMAL_GRID');
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
    setTheme(profileQuery.data.theme);
    setPublicProfile(profileQuery.data.publicProfile);
  }, [profileQuery.data]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    mutation.mutate({ slug, displayName, bio, profileImageUrl, theme, publicProfile });
  }

  return (
    <section className="page-section narrow-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Settings</h1>
        </div>
      </div>

      <form className="editor-form" onSubmit={handleSubmit}>
        <Input label="공개 주소" value={slug} onChange={(event) => setSlug(event.target.value)} required />
        <Input label="표시 이름" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
        <Textarea label="소개" value={bio} onChange={(event) => setBio(event.target.value)} rows={5} />
        <Input label="프로필 이미지 URL" value={profileImageUrl} onChange={(event) => setProfileImageUrl(event.target.value)} />
        <label className="field">
          <span>테마</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="MINIMAL_GRID">Minimal Grid</option>
          </select>
        </label>
        <Toggle checked={publicProfile} onChange={setPublicProfile} label={publicProfile ? '포트폴리오 공개' : '포트폴리오 비공개'} />
        {mutation.isSuccess && <p className="form-success">저장되었습니다.</p>}
        {mutation.isError && <p className="form-error">설정 저장에 실패했습니다.</p>}
        <Button type="submit" disabled={mutation.isPending}>
          저장
        </Button>
      </form>
    </section>
  );
}
