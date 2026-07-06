import { assetUrl } from '../lib/apiClient';
import type { Project } from '../lib/types';
import { findPortfolioTemplate } from '../templates/portfolioTemplates';
import type { ThemeDraft } from '../features/theme-settings/themeSettings';
import type { ProjectDraft } from '../features/project-management/projectDraft';

type WebsitePreviewCanvasProps = {
  draft: ProjectDraft;
  project?: Project;
  profileName?: string;
  profileTheme?: string;
  theme: ThemeDraft;
};

function previewFont(fontFamily: string) {
  if (fontFamily === 'Pretendard') {
    return 'Pretendard, "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  }
  if (fontFamily === 'Noto Sans KR') {
    return '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  }
  if (fontFamily === 'Georgia') {
    return 'Georgia, serif';
  }
  if (fontFamily === 'Mono') {
    return '"SFMono-Regular", Consolas, monospace';
  }
  return 'Inter, Pretendard, "Noto Sans KR", ui-sans-serif, system-ui, sans-serif';
}

export function WebsitePreviewCanvas({ draft, project, profileName = '내 이름', profileTheme, theme }: WebsitePreviewCanvasProps) {
  const template = findPortfolioTemplate(profileTheme);
  const title = draft.title || '대표 프로젝트';
  const description = draft.description || '프로젝트의 목적, 대상 사용자, 결과를 짧게 소개해보세요.';
  const caseStudy =
    draft.caseStudy ||
    '케이스 스터디 영역에는 문제 정의, 작업 과정, 주요 의사결정, 결과와 배운 점을 정리할 수 있습니다.';
  const thumbnail = project?.thumbnailUrl;

  return (
    <section className="preview-stage">
      <div className="browser-chrome">
        <span />
        <span />
        <span />
        <strong>실시간 포트폴리오 미리보기</strong>
      </div>

      <div
        className="site-canvas"
        style={{
          background: theme.background,
          color: theme.background === '#101010' ? '#f8f5ee' : '#111111',
          fontFamily: previewFont(theme.fontFamily),
          gap: `${theme.spacing}px`
        }}
      >
        <header className="canvas-nav">
          <strong>{profileName}</strong>
          <nav>
            <span>작업</span>
            <span>소개</span>
            <span>연락</span>
          </nav>
        </header>

        <section className="canvas-hero">
          <p className="canvas-kicker" style={{ color: theme.accentColor }}>
            {template.name}
          </p>
          <h1>나의 작업과 이야기를 보여주는 포트폴리오 웹사이트</h1>
          <p>{template.tagline}</p>
        </section>

        <section className="canvas-project-grid">
          <article className="canvas-project-feature">
            <div className="canvas-image">
              {thumbnail ? <img src={assetUrl(thumbnail)} alt="" /> : <img src={template.imageUrl} alt="" />}
            </div>
            <div>
              <p className="canvas-kicker" style={{ color: theme.accentColor }}>
                대표 프로젝트
              </p>
              <h2>{title}</h2>
              <p>{description}</p>
              <div className="canvas-tags">
                {(draft.techStacks.length ? draft.techStacks : ['React', 'Spring Boot', 'PostgreSQL']).slice(0, 4).map((stack) => (
                  <span key={stack}>{stack}</span>
                ))}
              </div>
            </div>
          </article>

          <div className="canvas-mini-grid">
            {template.sections.slice(0, 3).map((section, index) => (
              <article key={section}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <strong>{section}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="canvas-case-study">
          <p className="canvas-kicker" style={{ color: theme.accentColor }}>
            케이스 스터디
          </p>
          <h2>과정과 결과</h2>
          <p>{caseStudy}</p>
          <div className={`canvas-button canvas-button-${theme.buttonStyle.toLowerCase()}`} style={{ borderColor: theme.accentColor }}>
            프로젝트 보기
          </div>
        </section>
      </div>
    </section>
  );
}
