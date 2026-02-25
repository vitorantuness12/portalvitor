import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsPwa } from '@/hooks/useIsPwa';

export function PwaRedirect() {
  const { user, loading } = useAuth();
  const isPwa = useIsPwa();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    if (!isPwa) return;
    if (user) return;

    // Don't redirect if already on app-login, auth, or install pages
    const allowedPaths = ['/app-login', '/auth', '/install', '/validar-certificado', '/validar-carteirinha'];
    if (allowedPaths.some(p => location.pathname.startsWith(p))) return;

    navigate('/app-login', { replace: true });
  }, [isPwa, user, loading, location.pathname, navigate]);

  return null;
}
