import { Link } from 'react-router-dom';
import { assetUrl } from '../../lib/apiClient';
import type { Project } from '../../lib/types';

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <Link to={`/dashboard/projects/${project.id}/edit`} className="project-thumb">
        {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title.slice(0, 1)}</span>}
      </Link>
      <div className="project-card-body">
        <div>
          <p className="project-meta">
            {project.category?.name ?? 'No category'} · {project.visibility}
          </p>
          <h3>{project.title}</h3>
        </div>
        <div className="chip-row">
          {project.techStacks.slice(0, 4).map((stack) => (
            <span key={stack} className="chip">
              {stack}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
