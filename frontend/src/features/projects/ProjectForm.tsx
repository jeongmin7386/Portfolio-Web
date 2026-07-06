import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { listCategories } from '../categories/categoryApi';
import { createProject, updateProject } from './projectApi';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TagInput } from '../../components/ui/TagInput';
import { Textarea } from '../../components/ui/Textarea';
import { Toggle } from '../../components/ui/Toggle';
import type { Project, ProjectPayload, ProjectVisibility } from '../../lib/types';

type ProjectFormProps = {
  project?: Project;
};

export function ProjectForm({ project }: ProjectFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const [title, setTitle] = useState(project?.title ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(project?.category?.id ?? '');
  const [techStacks, setTechStacks] = useState<string[]>(project?.techStacks ?? []);
  const [githubUrl, setGithubUrl] = useState(project?.githubUrl ?? '');
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl ?? '');
  const [isPublic, setIsPublic] = useState(project?.visibility === 'PUBLIC');
  const [sortOrder, setSortOrder] = useState(project?.sortOrder ?? 0);

  useEffect(() => {
    if (!project) {
      return;
    }
    setTitle(project.title);
    setDescription(project.description ?? '');
    setCategoryId(project.category?.id ?? '');
    setTechStacks(project.techStacks);
    setGithubUrl(project.githubUrl ?? '');
    setLiveUrl(project.liveUrl ?? '');
    setIsPublic(project.visibility === 'PUBLIC');
    setSortOrder(project.sortOrder);
  }, [project]);

  const payload = useMemo<ProjectPayload>(() => {
    const visibility: ProjectVisibility = isPublic ? 'PUBLIC' : 'PRIVATE';
    return {
      title,
      description,
      categoryId: categoryId === '' ? null : Number(categoryId),
      techStacks,
      githubUrl,
      liveUrl,
      visibility,
      sortOrder
    };
  }, [categoryId, description, githubUrl, isPublic, liveUrl, sortOrder, techStacks, title]);

  const saveMutation = useMutation({
    mutationFn: () => (project ? updateProject(project.id, payload) : createProject(payload)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', saved.id] });
      navigate(`/dashboard/projects/${saved.id}/edit`);
    }
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  return (
    <form className="editor-form" onSubmit={handleSubmit}>
      <div className="editor-title-row">
        <input
          className="title-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="프로젝트 제목"
          required
        />
        <Toggle checked={isPublic} onChange={setIsPublic} label={isPublic ? '공개' : '비공개'} />
      </div>

      <Textarea
        label="설명"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="프로젝트의 목표, 역할, 성과를 간단히 적어보세요."
        rows={7}
      />

      <div className="form-grid">
        <label className="field">
          <span>카테고리</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value ? Number(event.target.value) : '')}>
            <option value="">선택 안 함</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="정렬 순서"
          type="number"
          value={sortOrder}
          onChange={(event) => setSortOrder(Number(event.target.value))}
        />
      </div>

      <TagInput label="기술 스택" value={techStacks} onChange={setTechStacks} />

      <div className="form-grid">
        <Input label="GitHub 링크" value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/..." />
        <Input label="배포 링크" value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} placeholder="https://..." />
      </div>

      {saveMutation.isError && <p className="form-error">저장에 실패했습니다. 입력값을 확인해주세요.</p>}

      <div className="sticky-actions">
        <Button type="button" variant="ghost" onClick={() => navigate('/dashboard/projects')}>
          목록
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? '저장 중' : '저장'}
        </Button>
      </div>
    </form>
  );
}
