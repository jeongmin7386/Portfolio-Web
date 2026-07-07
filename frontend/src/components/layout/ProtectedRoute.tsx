import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet } from 'react-router-dom';
import { getMe } from '../../features/auth/authApi';

export function ProtectedRoute() {
  const hasToken = Boolean(localStorage.getItem('accessToken'));
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: hasToken
  });

  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  if (meQuery.isLoading) {
    return <div className="center-screen">세션을 확인하는 중입니다.</div>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
