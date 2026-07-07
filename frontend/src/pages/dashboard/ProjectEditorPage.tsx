import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DesignSettingsPanel } from '../../editor/DesignSettingsPanel';
import { EditorSidebar } from '../../editor/EditorSidebar';
import { WebsitePreviewCanvas } from '../../editor/WebsitePreviewCanvas';
import { getProfile } from '../../features/auth/profileApi';
import { listCategories } from '../../features/categories/categoryApi';
import { ProjectBuilderForm } from '../../features/project-management/ProjectBuilderForm';
import { emptyProjectDraft, type ProjectDraft } from '../../features/project-management/projectDraft';
import { defaultThemeDraft, type ThemeDraft } from '../../features/theme-settings/themeSettings';
import { createProject, getProject, updateProject } from '../../features/projects/projectApi';
import { ThumbnailUploader } from '../../features/projects/ThumbnailUploader';
import type { ProjectPayload, ProjectVisibility } from '../../lib/types';

function draftFromProject(project?: {
  title: string;
  description?: string;
  caseStudy?: string;
  category?: { id: number } | null;
  techStacks: string[];
  githubUrl?: string;
  liveUrl?: string;
  visibility: ProjectVisibility;
  sortOrder: number;
}): ProjectDraft {
  if (!project) {
    return emptyProjectDraft;
  }

  return {
    title: project.title,
    description: project.description ?? '',
    caseStudy: project.caseStudy ?? '',
    categoryId: project.category?.id ?? '',
    techStacks: project.techStacks,
    githubUrl: project.githubUrl ?? '',
    liveUrl: project.liveUrl ?? '',
    isPublic: project.visibility === 'PUBLIC',
    sortOrder: project.sortOrder
  };
}

export function ProjectEditorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { projectId } = useParams();
  const numericProjectId = projectId ? Number(projectId) : undefined;
  const [draft, setDraft] = useState<ProjectDraft>(emptyProjectDraft);
  const [themeDraft, setThemeDraft] = useState<ThemeDraft>(defaultThemeDraft);
  const [activeSection, setActiveSection] = useState('프로젝트 갤러리');

  const projectQuery = useQuery({
    queryKey: ['project', numericProjectId],
    queryFn: () => getProject(numericProjectId!),
    enabled: Boolean(numericProjectId)
  });
  const categoriesQuery = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });

  useEffect(() => {
    if (projectQuery.data) {
      setDraft(draftFromProject(projectQuery.data));
    }
  }, [projectQuery.data]);

  const payload = useMemo<ProjectPayload>(() => {
    return {
      title: draft.title,
      description: draft.description,
      caseStudy: draft.caseStudy,
      categoryId: draft.categoryId === '' ? null : Number(draft.categoryId),
      techStacks: draft.techStacks,
      githubUrl: draft.githubUrl,
      liveUrl: draft.liveUrl,
      visibility: draft.isPublic ? 'PUBLIC' : 'PRIVATE',
      sortOrder: draft.sortOrder
    };
  }, [draft]);

  const saveMutation = useMutation({
    mutationFn: () => (numericProjectId ? updateProject(numericProjectId, payload) : createProject(payload)),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', saved.id] });
      navigate(`/dashboard/projects/${saved.id}/edit`);
    }
  });

  if (numericProjectId && projectQuery.isLoading) {
    return <p className="muted">프로젝트 빌더를 불러오는 중입니다...</p>;
  }

  return (
    <section className="site-editor-shell">
      <EditorSidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="editor-canvas-column">
        <div className="editor-topbar">
          <div>
            <p className="eyebrow">{activeSection}</p>
            <h1>{numericProjectId ? '웹사이트 프로젝트 빌더' : '새 포트폴리오 프로젝트 만들기'}</h1>
          </div>
          <Link className="button button-secondary" to="/dashboard/projects">
            스튜디오로 돌아가기
          </Link>
        </div>
        <WebsitePreviewCanvas
          draft={draft}
          project={projectQuery.data}
          profileName={profileQuery.data?.displayName}
          profileTheme={profileQuery.data?.theme}
          theme={themeDraft}
        />
      </main>

      <aside className="editor-inspector">
        <DesignSettingsPanel theme={themeDraft} onChange={setThemeDraft} />
        <ProjectBuilderForm
          draft={draft}
          categories={categoriesQuery.data ?? []}
          isSaving={saveMutation.isPending}
          onChange={setDraft}
          onSubmit={() => saveMutation.mutate()}
        />
        {saveMutation.isError && <p className="form-error">저장에 실패했습니다. 필수 입력값을 확인한 뒤 다시 시도해주세요.</p>}
        {numericProjectId && projectQuery.data ? (
          <ThumbnailUploader projectId={numericProjectId} thumbnailUrl={projectQuery.data.thumbnailUrl} />
        ) : (
          <div className="side-note">
            <h2>커버 이미지</h2>
            <p>프로젝트를 한 번 저장한 뒤, 공개 갤러리에 사용할 썸네일 이미지를 업로드할 수 있습니다.</p>
          </div>
        )}
      </aside>
    </section>
  );
}
