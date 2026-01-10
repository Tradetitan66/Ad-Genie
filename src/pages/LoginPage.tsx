import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { userService } from '../services/database';
import { useToast } from '../contexts/ToastContext';
import { tokenService } from '../services/tokenService';

export default function LoginPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async () => {
    const newErrors = { name: '', email: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (newErrors.name || newErrors.email) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      let user = await userService.getByEmail(email);

      if (!user) {
        user = await userService.create(email, name);
        await tokenService.initializeWelcomeTokens(user.id);
      } else {
        await tokenService.initializeWelcomeTokens(user.id);
      }

      localStorage.setItem('currentUser', email);

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('lastEmail', email);
      }

      if (user.has_completed_onboarding) {
        navigate('/dashboard/campaign-hub');
      } else {
        navigate('/onboarding/welcome');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'Failed to login. Please try again.';
      showError(`Login failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section - Centered above card */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-orange-500 shadow-md bg-white flex-shrink-0">
            <img
              src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
              alt="Ad-Genie Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-2xl font-bold text-slate-900">
            Ad-Genie
          </span>
          <Sparkles className="text-amber-400 w-4 h-4" />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 lg:p-12">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2D3142] mb-2">Welcome Back</h1>
          <p className="text-sm sm:text-base text-[#6B7280] mb-6 sm:mb-8">Sign in to continue to Ad-Genie</p>

          <div className="space-y-6">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#2D3142] mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
                } text-[#2D3142] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all`}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2D3142] mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border text-base ${
                  errors.email ? 'border-[#EF4444]' : 'border-[#E5E7EB]'
                } text-[#2D3142] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all min-h-[44px]`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 accent-orange-500 cursor-pointer"
              />
              <label htmlFor="rememberMe" className="text-sm text-[#6B7280] cursor-pointer">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg shadow-md hover:from-orange-500 hover:to-orange-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[44px] text-base"
            >
              {loading ? (
                'Please wait...'
              ) : (
                <>
                  Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            {/* Test Mode Notice */}
            <div className="text-center pt-4 border-t border-[#E5E7EB]">
              <p className="text-xs text-[#6B7280]">
                Test Mode - No password required
              </p>
            </div>

            {/* Back to Home Link */}
            <div className="text-center">
              <Link
                to="/"
                className="text-sm text-[#6B7280] hover:text-orange-500 transition-colors inline-flex items-center gap-1"
              >
                <ArrowRight size={16} className="rotate-180" />
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
