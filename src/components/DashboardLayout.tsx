import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Home,
  Plus,
  FolderOpen,
  Settings,
  LogOut,
  User,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';
import { userService } from '../services/database';
import TokenDisplay from './TokenDisplay';

interface DashboardLayoutProps {
  children: ReactNode;
  currentPage?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function DashboardLayout({
  children,
  currentPage = 'Dashboard',
  breadcrumbs = [],
}: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { success } = useToast();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const currentUserEmail = localStorage.getItem('currentUser');
      if (currentUserEmail) {
        try {
          const user = await userService.getByEmail(currentUserEmail);
          if (user) {
            setUserEmail(user.email);
            setUserName(user.display_name || 'User');
            setUserId(user.id);
          }
        } catch (error) {
          console.error('Error loading user:', error);
        }
      }
    };
    loadUser();
  }, []);

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

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard/campaign-hub' },
    { label: 'New Campaign', icon: Plus, href: '/dashboard/content-selection' },
    { label: 'My Campaigns', icon: FolderOpen, href: '/dashboard/campaigns' },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link
                to="/dashboard/campaign-hub"
                className="flex items-center gap-2 group"
                aria-label="Go to dashboard home"
              >
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 shadow-md bg-white flex-shrink-0">
                  <img
                    src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
                    alt="Ad-Genie Logo"
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-transparent bg-clip-text hidden sm:inline">
                  Ad-Genie
                </span>
                <Sparkles className="text-amber-400 w-4 h-4 hidden sm:inline" />
              </Link>

              <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-50 text-[#2563EB] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3">
              {userId && (
                <div className="hidden sm:flex items-center px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <TokenDisplay userId={userId} size="small" />
                </div>
              )}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                  aria-expanded={showUserMenu}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <User size={18} className="text-slate-600" />
                  <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                    Account
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-slate-600 transition-transform ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-200">
                        <p className="text-sm font-semibold text-slate-900">My Account</p>
                      </div>
                      <Link
                        to="/dashboard/settings"
                        className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings size={18} />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-expanded={showMobileMenu}
                aria-label="Toggle mobile menu"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white"
            >
              <nav className="px-4 py-3 space-y-1" aria-label="Mobile navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setShowMobileMenu(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-50 text-[#2563EB] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-16">
        {breadcrumbs.length > 0 && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm">
                  <li>
                    <Link
                      to="/dashboard/campaign-hub"
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Dashboard
                    </Link>
                  </li>
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-slate-400">/</span>
                      {crumb.href ? (
                        <Link
                          to={crumb.href}
                          className="text-slate-600 hover:text-slate-900 transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-slate-900 font-medium">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
