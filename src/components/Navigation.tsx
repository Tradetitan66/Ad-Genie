import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, User, LogOut, ArrowRight, Sparkles, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Login from './Login';
import Signup from './Signup';
import { Link } from 'react-router-dom';

interface NavigationProps {
  onLoginSuccess?: () => void;
  onLoginClick?: () => void;
}

export default function Navigation({ onLoginSuccess, onLoginClick }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
          <Link
            to="/"
            className="flex items-center gap-3 cursor-pointer"
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

          {/* Desktop Menu */}
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
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/waitlist"
                className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-full shadow-lg hover:shadow-orange-500/50 transition-all inline-block"
              >
                Join Waitlist
              </Link>
            </motion.div>

            {user && (
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
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:text-amber-400 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
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
                <div className="flex items-center justify-between p-6 border-b border-white/10">
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
                    className="p-2 text-white hover:text-amber-400 transition-colors"
                    aria-label="Close menu"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 py-6">
                  <div className="flex flex-col">
                    <a
                      href="#how-it-works"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-6 py-4 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      How It Works
                    </a>
                    <a
                      href="#features"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-6 py-4 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      Features
                    </a>
                    <a
                      href="#faq"
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-6 py-4 text-white hover:bg-white/10 hover:text-amber-400 transition-colors font-medium min-h-[44px] flex items-center"
                    >
                      FAQ
                    </a>
                    <div className="px-6 py-4">
                      <Link
                        to="/waitlist"
                        onClick={() => setMobileMenuOpen(false)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-full shadow-lg hover:shadow-orange-500/50 transition-all inline-block text-center min-h-[44px] flex items-center justify-center"
                      >
                        Join Waitlist
                      </Link>
                    </div>

                    {user && (
                      <div className="px-6 py-4 border-t border-white/10 mt-4">
                        <div className="px-4 py-3 bg-white/10 rounded-lg mb-3">
                          <p className="text-sm text-white/80 mb-1">Signed in as</p>
                          <p className="text-sm font-medium text-white">{user.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="w-full px-6 py-3 flex items-center justify-center gap-2 text-white hover:bg-white/10 transition-colors rounded-lg min-h-[44px]"
                        >
                          <LogOut size={18} />
                          <span>Sign Out</span>
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
    </motion.nav>
  );
}
