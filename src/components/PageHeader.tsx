import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

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
      <Link
        to="/dashboard/campaign-hub"
        className="flex items-center gap-3"
        aria-label="Ad-Genie"
      >
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
          <img
            src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
            alt="Ad-Genie Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <span className="text-xl font-bold text-orange-500">
          Ad-Genie
        </span>
        <Sparkles className="text-amber-400 w-4 h-4" />
      </Link>

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

