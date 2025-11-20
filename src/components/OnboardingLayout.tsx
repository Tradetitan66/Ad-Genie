import { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
      success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/onboarding/welcome"
              className="flex items-center gap-2 group"
              aria-label="Ad-Genie"
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-white flex-shrink-0">
                <img
                  src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                  alt="Ad-Genie Logo"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text">
                Ad-Genie
              </span>
              <Sparkles className="text-amber-400 w-4 h-4" />
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <motion.div
                      className="bg-gradient-to-r from-[#2563EB] to-[#8B5CF6] h-full rounded-full"
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
                  <span className="text-sm font-semibold text-slate-600 whitespace-nowrap">
                    Step {currentStep} of {totalSteps}
                  </span>
                </div>
              </div>
            </div>
            {stepLabel && (
              <p className="text-sm text-slate-500 mt-1" aria-live="polite">
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
