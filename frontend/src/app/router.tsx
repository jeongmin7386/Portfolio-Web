import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { DashboardLayout } from '../pages/dashboard/DashboardLayout';
import { ProjectListPage } from '../pages/dashboard/ProjectListPage';
import { ProjectEditorPage } from '../pages/dashboard/ProjectEditorPage';
import { CategoryPage } from '../pages/dashboard/CategoryPage';
import { SettingsPage } from '../pages/dashboard/SettingsPage';
import { LandingPage } from '../pages/landing/LandingPage';
import { PortfolioPage } from '../pages/public/PortfolioPage';
import { ProjectDetailPage } from '../pages/public/ProjectDetailPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/signup',
    element: <SignupPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/projects" replace />
          },
          {
            path: 'projects',
            element: <ProjectListPage />
          },
          {
            path: 'projects/new',
            element: <ProjectEditorPage />
          },
          {
            path: 'projects/:projectId/edit',
            element: <ProjectEditorPage />
          },
          {
            path: 'categories',
            element: <CategoryPage />
          },
          {
            path: 'settings',
            element: <SettingsPage />
          }
        ]
      }
    ]
  },
  {
    path: '/:portfolioSlug',
    element: <PortfolioPage />
  },
  {
    path: '/:portfolioSlug/projects/:projectSlug',
    element: <ProjectDetailPage />
  }
]);
