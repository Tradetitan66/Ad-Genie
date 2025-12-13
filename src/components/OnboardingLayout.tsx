import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import Logo from './Logo';
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

  const primaryColor = brandColors.primary || '#F97316'; // orange-500 default

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('currentUser');
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
            <Logo to="/onboarding/welcome" size="md" />

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
