import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';

import LoginPage from '../pages/LoginPage';
import RecoverPage from '../pages/RecoverPage';
import HomePage from '../pages/HomePage';
import UsersPage from './pages/UsersPage';
import OrganizationsPage from './pages/OrganizationsPage';
import ReportDetailPage from './pages/ReportDetailPage';
import ReportsPage from './pages/ReportsPage';
import OrganizationDetailPage from './pages/OrganizationDetailPage';
import EvaluationsPage from './pages/EvaluationsPage';
import ReportViewPage from './pages/ReportViewPage';
import VulnerabilitiesPage from './pages/VulnerabilitiesPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import QuestionnairesPage from './pages/QuestionnairesPage';
import RegisterUserPage from './pages/RegisterUserPage';
import RegisterOrganizationPage from './pages/RegisterOrganizationPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/RecoverPage" element={<RecoverPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/new" element={<RegisterUserPage />} />
        <Route path="/organizations" element={<OrganizationsPage />} />
        <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
        <Route path="/organizations/new" element={<RegisterOrganizationPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/reports/:id/report" element={<ReportViewPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/vulnerabilities" element={<VulnerabilitiesPage />} />
        <Route path="/dashboard" element={<AdminDashboardPage />} />
        <Route path="/questionnaires" element={<QuestionnairesPage />} />
        <Route path="/" element={<Navigate to="/LoginPage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);
