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
import PublicRegisterPage from '../pages/PublicRegisterPage';
import EvaluationAssignmentsPage from './pages/EvaluationAssignmentsPage';
import EvaluationWorkflowPage from './pages/EvaluationWorkflowPage';
import { AlertProvider } from './components/alerts/AlertProvider';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/register" element={<PublicRegisterPage />} />
        <Route path="/RecoverPage" element={<RecoverPage />} />
        <Route
          path="/HomePage"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/new"
          element={
            <ProtectedRoute>
              <RegisterUserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/:id"
          element={
            <ProtectedRoute>
              <OrganizationDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organizations/new"
          element={
            <ProtectedRoute>
              <RegisterOrganizationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <ReportDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id/report"
          element={
            <ProtectedRoute>
              <ReportViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluations"
          element={
            <ProtectedRoute>
              <EvaluationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluations/:evaluationId/workflow"
          element={
            <ProtectedRoute>
              <EvaluationWorkflowPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/asignaciones"
          element={
            <ProtectedRoute>
              <EvaluationAssignmentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vulnerabilities"
          element={
            <ProtectedRoute>
              <VulnerabilitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/questionnaires"
          element={
            <ProtectedRoute>
              <QuestionnairesPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/LoginPage" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AlertProvider>
      <AppRoutes />
    </AlertProvider>
  </React.StrictMode>
);
