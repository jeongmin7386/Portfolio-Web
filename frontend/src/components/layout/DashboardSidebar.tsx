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
        <p className="eyebrow">빌더</p>
        <h2>캔버스폴리오</h2>
      </div>
      <nav>
        <NavLink to="/dashboard/projects">포트폴리오 스튜디오</NavLink>
        <NavLink to="/dashboard/categories">카테고리</NavLink>
        <NavLink to="/dashboard/settings">템플릿과 테마</NavLink>
      </nav>
      <Button variant="ghost" onClick={handleLogout}>
        로그아웃
      </Button>
    </aside>
  );
}
