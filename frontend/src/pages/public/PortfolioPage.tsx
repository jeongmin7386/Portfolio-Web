import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { getPublicPortfolio } from '../../features/projects/publicApi';
import { assetUrl } from '../../lib/apiClient';

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
    return <div className="center-screen">포트폴리오를 불러오는 중입니다.</div>;
  }

  if (!portfolioQuery.data) {
    return <div className="center-screen">공개 포트폴리오를 찾을 수 없습니다.</div>;
  }

  const { profile, categories } = portfolioQuery.data;

  return (
    <main className="public-page">
      <header className="public-header">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h1>{profile.displayName}</h1>
          {profile.bio && <p>{profile.bio}</p>}
        </div>
        {profile.profileImageUrl && <img src={assetUrl(profile.profileImageUrl)} alt="" />}
      </header>

      <div className="filter-bar" aria-label="카테고리 필터">
        <button className={!activeCategory ? 'active' : ''} onClick={() => setActiveCategory(null)}>
          All
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

      <section className="public-grid">
        {projects.map((project) => (
          <Link key={project.id} to={`/${profile.slug}/projects/${project.slug}`} className="public-card">
            <div className="public-thumb">
              {project.thumbnailUrl ? <img src={assetUrl(project.thumbnailUrl)} alt="" /> : <span>{project.title}</span>}
            </div>
            <div className="public-card-body">
              <p>{project.category?.name ?? 'Project'}</p>
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
