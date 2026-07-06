import { Link } from 'react-router-dom';

type EditorSidebarProps = {
  activeSection: string;
  onSectionChange: (section: string) => void;
};

const pages = ['Home', 'Work', 'About', 'Contact'];
const sections = ['Hero', 'Project gallery', 'Case study', 'Contact CTA'];

export function EditorSidebar({ activeSection, onSectionChange }: EditorSidebarProps) {
  return (
    <aside className="editor-sidebar">
      <div className="editor-sidebar-header">
        <p className="eyebrow">Site map</p>
        <h2>Portfolio pages</h2>
      </div>

      <div className="editor-panel-group">
        <p className="panel-label">Pages</p>
        <div className="page-list">
          {pages.map((page) => (
            <button key={page} type="button" className={page === 'Work' ? 'active' : ''}>
              <span>{page}</span>
              <small>{page === 'Work' ? 'Editing' : 'Ready'}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-panel-group">
        <p className="panel-label">Sections</p>
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
        Choose template
      </Link>
    </aside>
  );
}
