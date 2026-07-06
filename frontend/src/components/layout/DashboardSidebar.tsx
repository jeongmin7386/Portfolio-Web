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
        <p className="eyebrow">Publisher</p>
        <h2>Portfolio</h2>
      </div>
      <nav>
        <NavLink to="/dashboard/projects">Projects</NavLink>
        <NavLink to="/dashboard/categories">Categories</NavLink>
        <NavLink to="/dashboard/settings">Settings</NavLink>
      </nav>
      <Button variant="ghost" onClick={handleLogout}>
        로그아웃
      </Button>
    </aside>
  );
}
