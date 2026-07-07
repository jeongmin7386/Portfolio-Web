import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPublicPortfolio } from '../../features/projects/publicApi';
import { assetUrl } from '../../lib/apiClient';
import { findPortfolioTemplate } from '../../templates/portfolioTemplates';

export function PortfolioPage() {
  const { portfolioSlug } = useParams();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const portfolioQuery = useQuery({
    queryKey: ['publicPortfolio', portfolioSlug, activeCategory],
    queryFn: () => getPublicPortfolio(portfolioSlug!, activeCategory),
    enabled: Boolean(portfolioSlug)
  });

  const projects = useMemo(() => portfolioQuery.data?.projects ?? [], [portfolioQuery.data]);

  if (portfolioQuery.isLoading) {
    return <div className="center-screen">포트폴리오를 불러오는 중입니다...</div>;
  }

  if (!portfolioQuery.data) {
    return <div className="center-screen">포트폴리오를 찾을 수 없습니다.</div>;
  }

  const { profile, categories } = portfolioQuery.data;
  const template = findPortfolioTemplate(profile.theme);
  const heroProject = projects[0];

  return (
    <main className="public-page">
      <header className="public-header">
        <div className="public-header-copy">
          <p className="eyebrow" style={{ color: template.accent }}>
            {template.name}
          </p>
          <h1>{profile.displayName}</h1>
          {profile.bio && <p>{profile.bio}</p>}
          <div className="public-header-actions">
            <a className="button button-primary" href="#work">
              작업 보기
            </a>
            <a className="button button-secondary" href="mailto:hello@example.com">
              연락하기
            </a>
          </div>
        </div>
        <div className="public-hero-media">
          {heroProject?.thumbnailUrl ? (
            <img src={assetUrl(heroProject.thumbnailUrl)} alt="" />
          ) : (
            <img src={profile.profileImageUrl ? assetUrl(profile.profileImageUrl) : template.imageUrl} alt="" />
          )}
        </div>
      </header>

      <div className="filter-bar" aria-label="프로젝트 카테고리 필터">
        <button className={!activeCategory ? 'active' : ''} onClick={() => setActiveCategory(null)}>
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={activeCategory === category.slug ? 'active' : ''}
            onClick={() => setActiveCategory(category.slug)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <section id="work" className="public-grid">
        {projects.map((project, index) => (
          <Link key={project.id} to={`/${profile.slug}/projects/${project.slug}`} className={index === 0 ? 'public-card featured' : 'public-card'}>
            <div className="public-thumb">
              {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title}</span>}
            </div>
            <div className="public-card-body">
              <p>{project.category?.name ?? '프로젝트'}</p>
              <h2>{project.title}</h2>
              <div className="chip-row">
                {project.techStacks.slice(0, 3).map((stack) => (
                  <span key={stack} className="chip">
                    {stack}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
