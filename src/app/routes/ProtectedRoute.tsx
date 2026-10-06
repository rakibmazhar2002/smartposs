import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '@/core/hooks/use-auth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="w-full max-w-sm space-y-4 px-6"><Skeleton className="h-12 w-12 rounded-xl" /><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-72" /></div></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <AppShell><Outlet /></AppShell>;
}

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Skeleton className="h-12 w-12 rounded-xl" /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.isSuperAdmin) return <Navigate to="/dashboard" replace />;
  return <AppShell><Outlet /></AppShell>;
}
