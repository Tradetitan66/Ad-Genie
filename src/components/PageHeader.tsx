import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, LogOut, ArrowLeft, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

interface PageHeaderProps {
  showLogout?: boolean;
  className?: string;
  showBackButton?: boolean;
  backButtonText?: string;
  backButtonPath?: string;
}

export default function PageHeader({ 
  showLogout = true, 
  className = '',
  showBackButton = false,
  backButtonText = 'Back to Dashboard',
  backButtonPath = '/dashboard/campaign-hub'
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { success } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on a link
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('currentUser');
      localStorage.removeItem('user');
      setMobileMenuOpen(false);
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className={`bg-[#2D3142] shadow-sm h-16 flex items-center justify-between px-6 md:px-8 fixed top-0 left-0 right-0 z-50 ${className}`}>
      <div className="flex items-center gap-4 md:gap-6">
        <Link
          to="/"
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
        {showBackButton && (
          <button
            onClick={() => navigate(backButtonPath)}
            className="flex items-center gap-2 px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all"
            aria-label="Back to Dashboard"
          >
            <ArrowLeft size={18} />
            <span className="font-medium hidden sm:inline">{backButtonText}</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showLogout && (
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 hover:border-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Logout"
          >
            <LogOut size={18} />
            <span className="font-medium">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </button>
        )}

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-white hover:text-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Mobile Menu Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900 shadow-2xl z-50 md:hidden overflow-y-auto"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
                      <img
                        src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                        alt="Ad-Genie Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-lg font-bold text-orange-500">Ad-Genie</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 text-white hover:text-amber-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                    aria-label="Close menu"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-3">
                  <div className="flex flex-col">
                    <a
                      href="#how-it-works"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      How It Works
                    </a>
                    <a
                      href="#features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      Features
                    </a>
                    <a
                      href="#faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-4 py-3 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      FAQ
                    </a>
                    <div className="px-4 py-2">
                      <Link
                        to="/waitlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-full shadow-lg hover:shadow-orange-500/50 transition-all inline-block text-center min-h-[44px] flex items-center justify-center"
                      >
                        Join Waitlist
                      </Link>
                    </div>

                    {showLogout && (
                      <div className="px-4 py-3 border-t border-white/10 mt-2">
                        <button
                          onClick={() => {
                            handleLogout();
                            setMobileMenuOpen(false);
                          }}
                          disabled={isLoggingOut}
                          className="w-full px-4 py-2 flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors rounded-lg min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LogOut size={18} />
                          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}

