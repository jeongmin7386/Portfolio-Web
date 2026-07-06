import { Link } from 'react-router-dom';
import { TemplatePreviewCard } from '../../templates/TemplatePreviewCard';
import { portfolioTemplates } from '../../templates/portfolioTemplates';

const examplePortfolios = [
  {
    title: '프로덕트 디자이너',
    category: '케이스 스터디',
    imageUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: '프론트엔드 개발자',
    category: '라이브 프로젝트',
    imageUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: '사진 포트폴리오',
    category: '이미지 그리드',
    imageUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  }
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <nav className="landing-nav">
          <Link to="/" className="brand-mark">
            캔버스폴리오
          </Link>
          <div>
            <Link to="/login">로그인</Link>
            <Link className="button button-primary" to="/signup">
              시작하기
            </Link>
          </div>
        </nav>
        <div className="hero-content">
          <p className="eyebrow">포트폴리오 웹사이트 빌더</p>
          <h1>캔버스폴리오</h1>
          <p>
            프로젝트 갤러리, 템플릿, 실시간 미리보기, 디자인 설정을 한곳에서 관리하고 나만의 포트폴리오 사이트를 게시하세요.
          </p>
          <div className="action-row">
            <Link className="button button-primary" to="/signup">
              포트폴리오 만들기
            </Link>
            <Link className="button button-secondary" to="/login">
              스튜디오 열기
            </Link>
          </div>
        </div>
      </section>

      <section className="landing-section template-section">
        <div className="section-heading">
          <p className="eyebrow">템플릿</p>
          <h2>빈 문서가 아니라, 완성도 있는 포트폴리오 레이아웃에서 시작하세요.</h2>
        </div>
        <div className="template-grid">
          {portfolioTemplates.map((template) => (
            <TemplatePreviewCard key={template.id} template={template} />
          ))}
        </div>
      </section>

      <section className="landing-section feature-band">
        <div className="feature-copy">
          <p className="eyebrow">제작 흐름</p>
          <h2>갤러리 구성, 미리보기, 디자인 설정, 게시까지.</h2>
          <p>
            대시보드는 포트폴리오 사이트 제작에 맞춰 구성되어 있습니다. 프로젝트 갤러리, 템플릿 선택, 실시간 캔버스,
            색상과 폰트, 여백, 배경, 버튼 스타일을 빠르게 조정할 수 있습니다.
          </p>
        </div>
        <div className="feature-grid">
          {['템플릿 선택', '프로젝트 갤러리', '실시간 미리보기', '디자인 패널'].map((feature, index) => (
            <article key={feature}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{feature}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="eyebrow">예시</p>
          <h2>작업 유형에 맞춰 이미지 중심으로 보여주는 포트폴리오.</h2>
        </div>
        <div className="example-grid">
          {examplePortfolios.map((example) => (
            <article key={example.title} className="example-card">
              <img src={example.imageUrl} alt="" />
              <div>
                <p>{example.category}</p>
                <h3>{example.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <p className="eyebrow">게시 준비 완료</p>
        <h2>내 프로젝트를 디자인된 포트폴리오 웹사이트로 바꿔보세요.</h2>
        <Link className="button button-primary" to="/signup">
          내 사이트 만들기
        </Link>
      </section>
    </main>
  );
}
