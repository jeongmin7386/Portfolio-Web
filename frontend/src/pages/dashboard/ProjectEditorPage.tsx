import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { ProjectForm } from '../../features/projects/ProjectForm';
import { ThumbnailUploader } from '../../features/projects/ThumbnailUploader';
import { getProject } from '../../features/projects/projectApi';

export function ProjectEditorPage() {
  const { projectId } = useParams();
  const numericProjectId = projectId ? Number(projectId) : undefined;
  const projectQuery = useQuery({
    queryKey: ['project', numericProjectId],
    queryFn: () => getProject(numericProjectId!),
    enabled: Boolean(numericProjectId)
  });

  if (numericProjectId && projectQuery.isLoading) {
    return <p className="muted">프로젝트를 불러오는 중입니다.</p>;
  }

  return (
    <section className="page-section editor-shell">
      <div className="page-heading compact">
        <div>
          <p className="eyebrow">Project Editor</p>
          <h1>{numericProjectId ? '프로젝트 수정' : '새 프로젝트'}</h1>
        </div>
      </div>
      <div className="editor-layout">
        <ProjectForm project={projectQuery.data} />
        <aside className="editor-aside">
          {numericProjectId && projectQuery.data ? (
            <ThumbnailUploader projectId={numericProjectId} thumbnailUrl={projectQuery.data.thumbnailUrl} />
          ) : (
            <div className="side-note">
              <h2>썸네일</h2>
              <p>저장된 프로젝트에 이미지를 연결합니다.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
