import { getDefaultRouteForRole, useRole, type UserRole } from "@/contexts/RoleContext";
import { Navigate, Outlet } from "react-router-dom";

export function AuthGate({
  allowedRoles,
  requireAuth = true,
}: {
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}) {
  const { isAuthenticated, isLoading, role } = useRole();

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!requireAuth) {
    return isAuthenticated ? <Navigate to={getDefaultRouteForRole(role)} replace /> : <Outlet />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteForRole(role)} replace />;
  }

  return <Outlet />;
}
