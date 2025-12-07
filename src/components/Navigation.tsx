import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, LogIn, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Signup from './Signup';

interface NavigationProps {
  onLoginSuccess?: () => void;
  onLoginClick?: () => void;
}

export default function Navigation({ onLoginSuccess, onLoginClick }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/95 backdrop-blur-lg shadow-2xl' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <motion.div
            className="relative group cursor-pointer flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>

            <div className="relative flex items-center gap-3">
              <motion.div
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 shadow-lg bg-white flex-shrink-0"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                    '0 0 40px rgba(251, 191, 36, 0.6)',
                    '0 0 20px rgba(251, 191, 36, 0.3)',
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img
                  src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                  alt="Ad-Genie"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </motion.div>

              <motion.div
                className="absolute -top-1 left-12"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="text-amber-400" size={16} />
              </motion.div>

              <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-transparent bg-clip-text">
                Ad-Genie
              </span>
            </div>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-white hover:text-amber-400 transition-colors font-medium">
              How It Works
            </a>
            <a href="#features" className="text-white hover:text-amber-400 transition-colors font-medium">
              Features
            </a>
            <a href="#faq" className="text-white hover:text-amber-400 transition-colors font-medium">
              FAQ
            </a>
            <motion.a
              href="/waitlist"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-full shadow-lg hover:shadow-amber-500/50 transition-shadow"
            >
              Join Waitlist
            </motion.a>

            {user ? (
              <div className="relative">
                <motion.button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
                >
                  <User size={20} />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-medium text-slate-900">{user.email}</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full px-4 py-3 flex items-center gap-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => onLoginClick ? onLoginClick() : setShowLogin(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white hover:bg-white/20 transition-all"
              >
                <LogIn size={20} />
                <span className="font-medium">Login</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogin && (
          <Login
            onClose={() => setShowLogin(false)}
            onSwitchToSignup={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignup && (
          <Signup
            onClose={() => setShowSignup(false)}
            onSwitchToLogin={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
