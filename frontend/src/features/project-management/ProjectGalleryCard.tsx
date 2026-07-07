import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/apiClient';
import { visibilityLabel } from '../../lib/labels';
import type { Project } from '../../lib/types';

type ProjectGalleryCardProps = {
  project: Project;
  onDelete: (projectId: number) => void;
};

export function ProjectGalleryCard({ project, onDelete }: ProjectGalleryCardProps) {
  return (
    <article className="studio-project-card">
      <Link to={`/dashboard/projects/${project.id}/edit`} className="studio-project-image">
        {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title.slice(0, 1)}</span>}
      </Link>
      <div className="studio-project-content">
        <div className="status-line">
          <span className={`status-pill status-${project.visibility.toLowerCase()}`}>{visibilityLabel(project.visibility)}</span>
          <span>{project.category?.name ?? '카테고리 없음'}</span>
        </div>
        <h3>{project.title}</h3>
        {project.description && <p>{project.description}</p>}
        <div className="chip-row">
          {project.techStacks.slice(0, 4).map((stack) => (
            <span key={stack} className="chip">
              {stack}
            </span>
          ))}
        </div>
        <div className="card-actions">
          <Link className="button button-secondary" to={`/dashboard/projects/${project.id}/edit`}>
            빌더 열기
          </Link>
          <button className="button button-ghost" type="button" onClick={() => onDelete(project.id)}>
            삭제
          </button>
        </div>
      </div>
    </article>
  );
}
