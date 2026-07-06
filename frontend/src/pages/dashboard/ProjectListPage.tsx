import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ProjectCard } from '../../features/projects/ProjectCard';
import { deleteProject, listProjects } from '../../features/projects/projectApi';
import { getProfile } from '../../features/auth/profileApi';

export function ProjectListPage() {
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: listProjects });
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] })
  });

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1>Projects</h1>
        </div>
        <div className="action-row">
          {profileQuery.data && (
            <Link className="button button-secondary" to={`/${profileQuery.data.slug}`} target="_blank">
              공개 페이지
            </Link>
          )}
          <Link className="button button-primary" to="/dashboard/projects/new">
            새 프로젝트
          </Link>
        </div>
      </div>

      {projectsQuery.isLoading && <p className="muted">프로젝트를 불러오는 중입니다.</p>}
      {projectsQuery.data?.length === 0 && (
        <div className="empty-state">
          <h2>첫 프로젝트를 추가해보세요</h2>
          <p>공개 페이지를 채울 프로젝트가 아직 없습니다.</p>
          <Link className="button button-primary" to="/dashboard/projects/new">
            프로젝트 만들기
          </Link>
        </div>
      )}
      <div className="admin-project-grid">
        {projectsQuery.data?.map((project) => (
          <div key={project.id} className="admin-project-item">
            <ProjectCard project={project} />
            <Button variant="ghost" onClick={() => deleteMutation.mutate(project.id)}>
              삭제
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
