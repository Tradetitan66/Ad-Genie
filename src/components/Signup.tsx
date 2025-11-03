import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Lock, User, Chrome, Check, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../utils/passwordValidation';

interface SignupProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function Signup({ onClose, onSwitchToLogin }: SignupProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const passwordStrength = validatePassword(password);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up with Google');
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
        <p className="text-slate-600 mb-6">Join Ad-Genie and start creating magic</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
            Account created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRequirements(true)}
                onBlur={() => setShowPasswordRequirements(false)}
                className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.color === 'green'
                          ? 'bg-green-500'
                          : passwordStrength.color === 'amber'
                          ? 'bg-amber-500'
                          : passwordStrength.color === 'orange'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength.color === 'green'
                        ? 'text-green-600'
                        : passwordStrength.color === 'amber'
                        ? 'text-amber-600'
                        : passwordStrength.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-red-600'
                    }`}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              </div>
            )}

            {(showPasswordRequirements || password) && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.length ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400" />
                  )}
                  <span
                    className={passwordStrength.requirements.length ? 'text-green-600' : 'text-slate-500'}
                  >
                    At least 8 characters
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.uppercase ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400" />
                  )}
                  <span
                    className={passwordStrength.requirements.uppercase ? 'text-green-600' : 'text-slate-500'}
                  >
                    One uppercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.lowercase ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400" />
                  )}
                  <span
                    className={passwordStrength.requirements.lowercase ? 'text-green-600' : 'text-slate-500'}
                  >
                    One lowercase letter
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.number ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400" />
                  )}
                  <span
                    className={passwordStrength.requirements.number ? 'text-green-600' : 'text-slate-500'}
                  >
                    One number
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {passwordStrength.requirements.special ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <AlertCircle size={14} className="text-slate-400" />
                  )}
                  <span
                    className={passwordStrength.requirements.special ? 'text-green-600' : 'text-slate-500'}
                  >
                    One special character (!@#$%^&*)
                  </span>
                </div>
              </div>
            )}

            {password && passwordStrength.score >= 4 && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Your password is also checked against known leaked passwords to keep your account secure.
                  </span>
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold py-3 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignup}
          disabled={loading || success}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-300 text-slate-700 font-semibold py-3 rounded-lg hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Chrome size={20} />
          Sign up with Google
        </button>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-amber-600 hover:text-amber-700 font-semibold"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}
