import { NavLink, useNavigate } from 'react-router-dom';
import { logout } from '../../features/auth/authApi';
import { Button } from '../ui/Button';

export function DashboardSidebar() {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="dashboard-sidebar">
      <div>
        <p className="eyebrow">Builder</p>
        <h2>Canvasfolio</h2>
      </div>
      <nav>
        <NavLink to="/dashboard/projects">Portfolio Studio</NavLink>
        <NavLink to="/dashboard/categories">Categories</NavLink>
        <NavLink to="/dashboard/settings">Templates & Theme</NavLink>
      </nav>
      <Button variant="ghost" onClick={handleLogout}>
        Log out
      </Button>
    </aside>
  );
}
