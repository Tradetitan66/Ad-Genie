import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/database';
import { useToast } from '../contexts/ToastContext';

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
        success('Welcome! Let\'s set up your account.');
      } else {
        success('Welcome back!');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="login">
        <h1 className="h1">
          <span className="ui">Ad Genie</span>
        </h1>
        
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors({ ...errors, name: '' });
          }}
          placeholder="Name"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1 ml-4">{errors.name}</p>
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors({ ...errors, email: '' });
          }}
          placeholder="Email"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1 ml-4">{errors.email}</p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 accent-[#af40ff]"
          />
          <label htmlFor="rememberMe" className="text-sm text-white/70 cursor-pointer">
            Remember me
          </label>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn"
        >
          {loading ? 'Please wait...' : 'Continue →'}
        </button>

        <div className="text-center mt-6">
          <p className="text-xs text-white/50">
            Test Mode - No password required
          </p>
        </div>

        <div className="text-center mt-4">
          <button
            onClick={() => navigate('/')}
            className="text-white/70 hover:text-white transition-colors text-sm underline"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}
