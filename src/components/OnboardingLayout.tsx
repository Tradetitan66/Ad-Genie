import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { brandProfileService } from '../services/database';
import { userService } from '../services/database';

interface OnboardingLayoutProps {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export default function OnboardingLayout({
  children,
  currentStep,
  totalSteps,
  stepLabel,
}: OnboardingLayoutProps) {
  const navigate = useNavigate();
  const { success } = useToast();
  const progressPercentage = (currentStep / totalSteps) * 100;
  const [brandColors, setBrandColors] = useState<{
    primary?: string;
    secondary?: string;
    accent?: string;
  }>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const loadBrandColors = async () => {
      try {
        const currentUserEmail = localStorage.getItem('currentUser');
        if (!currentUserEmail) return;

        const user = await userService.getByEmail(currentUserEmail);
        if (!user) return;

        const brandProfile = await brandProfileService.getByUserId(user.id);
        if (brandProfile?.brand_colors) {
          setBrandColors(brandProfile.brand_colors);
        }
      } catch (error) {
        console.error('Error loading brand colors:', error);
      }
    };

    loadBrandColors();
  }, []);

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

  const primaryColor = brandColors.primary || '#F97316'; // orange-500 default

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-3"
              aria-label="Ad-Genie"
              onClick={() => {
                // #region agent log
                fetch('http://127.0.0.1:7243/ingest/1f05fac3-9d5b-456a-b58e-d045d6d2998f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'OnboardingLayout.tsx:84', message: 'Logo clicked', data: { component: 'OnboardingLayout', currentPath: window.location.pathname, targetPath: '/' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => {});
                // #endregion
              }}
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Logout</span>
              </button>

              {/* Mobile Hamburger Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-600 hover:text-red-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Toggle menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

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
                  <Link
                    to="/"
                    onClick={() => {
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/1f05fac3-9d5b-456a-b58e-d045d6d2998f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'OnboardingLayout.tsx:150', message: 'Mobile menu logo clicked', data: { component: 'OnboardingLayout-mobile', currentPath: window.location.pathname, targetPath: '/' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => {});
                      setMobileMenuOpen(false);
                      // #endregion
                    }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
                      <img
                        src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                        alt="Ad-Genie Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-lg font-bold text-orange-500">Ad-Genie</span>
                  </Link>
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

                    <div className="px-4 py-3 border-t border-white/10 mt-2">
                      <button
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors rounded-lg min-h-[44px]"
                      >
                        <LogOut size={18} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden min-w-0">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: brandColors.secondary 
                          ? `linear-gradient(to right, ${primaryColor}, ${brandColors.secondary})`
                          : `linear-gradient(to right, ${primaryColor}, ${primaryColor})`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercentage}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      role="progressbar"
                      aria-valuenow={currentStep}
                      aria-valuemin={0}
                      aria-valuemax={totalSteps}
                      aria-label={`Step ${currentStep} of ${totalSteps}`}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 whitespace-nowrap flex-shrink-0">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
              </div>
            </div>
            {stepLabel && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1" aria-live="polite">
                {stepLabel}
              </p>
            )}
          </div>

          {children}
        </div>
      </main>
    </div>
  );
}
