import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Logo from './Logo';

interface PageHeaderProps {
  showLogout?: boolean;
  className?: string;
}

export default function PageHeader({ showLogout = true, className = '' }: PageHeaderProps) {
  const navigate = useNavigate();
  const { success } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className={`bg-[#2D3142] shadow-sm h-16 flex items-center justify-between px-6 md:px-8 fixed top-0 left-0 right-0 z-50 ${className}`}>
      <Logo to="/dashboard/campaign-hub" size="lg" />

      {showLogout && (
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-2 px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Logout"
        >
          <LogOut size={18} />
          <span className="font-medium">
            {isLoggingOut ? 'Logging out...' : 'Logout'}
          </span>
        </button>
      )}
    </header>
  );
}

