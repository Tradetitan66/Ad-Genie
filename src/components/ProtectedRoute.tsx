import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { userService } from '../services/database';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requireNoOnboarding?: boolean;
}

export default function ProtectedRoute({
  children,
  requireOnboarding = false,
  requireNoOnboarding = false,
}: ProtectedRouteProps) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try Supabase auth first (if configured)
      let session = null;
      try {
        const { data: { session: supabaseSession } } = await supabase.auth.getSession();
        session = supabaseSession;
      } catch (supabaseError) {
        // Supabase not configured or error - use localStorage fallback
        console.log('Supabase auth not available, using localStorage fallback');
      }

      if (!session) {
        // Check localStorage for currentUser (used by LoginPage)
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
          const user = await userService.getByEmail(currentUser);
          if (user) {
            setIsAuthenticated(true);
            setHasCompletedOnboarding(user.has_completed_onboarding);
            setLoading(false);
            return;
          }
        }
        // Also check for 'user' key (used by AuthContext)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.email) {
              const user = await userService.getByEmail(parsedUser.email);
              if (user) {
                setIsAuthenticated(true);
                setHasCompletedOnboarding(user.has_completed_onboarding);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }
      } else {
        // Supabase session exists
        setIsAuthenticated(true);
        const user = await userService.getByEmail(session.user.email!);
        if (user) {
          setHasCompletedOnboarding(user.has_completed_onboarding);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#2563EB] animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireOnboarding && !hasCompletedOnboarding) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  if (requireNoOnboarding && hasCompletedOnboarding) {
    return <Navigate to="/dashboard/campaign-hub" replace />;
  }

  return <>{children}</>;
}
