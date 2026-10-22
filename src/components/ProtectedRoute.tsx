import React from 'react';
import { UserRole } from '../lib/auth-context.tsx';
import { AuthGate } from './AuthGate.tsx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireSuperAdmin = false
}) => {
  return (
    <AuthGate requireSuperAdmin={requireSuperAdmin}>
      {children}
    </AuthGate>
  );
};
