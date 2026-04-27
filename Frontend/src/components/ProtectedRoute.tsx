import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessPath } from '../utils/roleAccess';
import { defaultPathByRole, getCurrentRole, isAuthenticated } from '../utils/auth';

type Props = {
  children: React.ReactNode;
};

/**
 * Exige sesión y que la ruta actual esté permitida para el rol (`canAccessPath`).
 */
const ProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  if (!isAuthenticated()) {
    return <Navigate to="/LoginPage" replace state={{ from: path }} />;
  }

  const role = getCurrentRole();
  if (!role) {
    return <Navigate to="/LoginPage" replace state={{ from: path }} />;
  }
  if (!canAccessPath(role, path)) {
    return <Navigate to={defaultPathByRole(role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
