import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({ name: '', email: '' });

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = () => {
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

    const existingUsers = JSON.parse(localStorage.getItem('users') || '{}');

    if (existingUsers[email]) {
      localStorage.setItem('currentUser', email);

      if (existingUsers[email].hasCompletedOnboarding) {
        navigate('/dashboard/campaign-hub');
      } else {
        navigate('/onboarding/welcome');
      }
    } else {
      const newUser = {
        userId: Date.now().toString(),
        displayName: name,
        email: email,
        isNewUser: true,
        hasCompletedOnboarding: false,
        createdAt: new Date().toISOString(),
        preferences: null,
        brandProfile: null,
        campaigns: []
      };

      existingUsers[email] = newUser;
      localStorage.setItem('users', JSON.stringify(existingUsers));
      localStorage.setItem('currentUser', email);

      navigate('/onboarding/welcome');
    }

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('lastEmail', email);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 mb-4"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="text-[#2563EB]" size={32} />
              <h1 className="text-3xl font-bold text-slate-900">Ad Genie</h1>
            </motion.div>
            <p className="text-slate-600">Create amazing campaigns with AI</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.name ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
                placeholder="Enter your name"
              />
              {errors.name && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: '' });
                }}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.email ? 'border-[#EF4444]' : 'border-slate-300'
                } focus:outline-none focus:border-[#2563EB] transition-colors`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="text-[#EF4444] text-sm mt-1">{errors.email}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#2563EB] border-slate-300 rounded focus:ring-[#2563EB]"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-slate-600">
                Remember me
              </label>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              className="w-full px-6 py-3 bg-[#2563EB] text-white font-semibold rounded-lg shadow-md hover:bg-[#1d4ed8] transition-all"
            >
              Continue →
            </motion.button>

            <div className="text-center">
              <p className="text-sm text-slate-500">
                Test Mode - No password required
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-white hover:text-[#2563EB] transition-colors"
          >
            ← Back to home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
