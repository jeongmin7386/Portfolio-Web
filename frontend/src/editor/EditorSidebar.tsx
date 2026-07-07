import { Link } from 'react-router-dom';

type EditorSidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

const pages = ['홈', '작업', '소개', '연락'];
const sections = ['히어로', '프로젝트 갤러리', '케이스 스터디', '문의 CTA'];

export function EditorSidebar({ activeSection, onSectionChange }: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar-header">
        <p className="eyebrow">사이트맵</p>
        <h2>포트폴리오 페이지</h2>
      </div>

      <div className="editor-panel-group">
        <p className="panel-label">페이지</p>
        <div className="page-list">
          {pages.map((page) => (
            <button key={page} type="button" className={page === '작업' ? 'active' : ''}>
              <span>{page}</span>
              <small>{page === '작업' ? '편집 중' : '준비됨'}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-panel-group">
        <p className="panel-label">섹션</p>
        <div className="section-list">
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              className={activeSection === section ? 'active' : ''}
              onClick={() => onSectionChange(section)}
            >
              {section}
            </button>
          ))}
        </div>
      </div>

      <Link className="button button-secondary sidebar-link" to="/dashboard/settings">
        템플릿 고르기
      </Link>
    </aside>
  );
}
