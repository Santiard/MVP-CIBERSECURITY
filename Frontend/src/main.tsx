import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles/theme.css';

import LoginPage from '../pages/LoginPage';
import RecoverPage from '../pages/RecoverPage';
import HomePage from '../pages/HomePage';
import DashboardPage from '../pages/DashboardPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/LoginPage" element={<LoginPage />} />
        <Route path="/HomePage" element={<HomePage />} />
        <Route path="/RecoverPage" element={<RecoverPage />} />
        <Route path="/DashboardPage" element={<DashboardPage />} />
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
