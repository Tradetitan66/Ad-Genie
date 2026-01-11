import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Plus,
  FolderOpen,
  Settings,
  LogOut,
  User,
  Sparkles,
  ChevronDown,
  X as CloseIcon,
  Menu as MenuIcon,
  Building2,
  Palette,
  Calendar,
  Bell
} from 'lucide-react';
import TokenDisplay from './TokenDisplay';
import { userService } from '../services/database';

const navItems = [
  { label: 'Dashboard', icon: Home, href: '/dashboard/campaign-hub' },
  { label: 'New Campaign', icon: Plus, href: '/dashboard/content-selection' },
  { label: 'My Campaigns', icon: FolderOpen, href: '/dashboard/campaigns' },
];

const settingsSubItems = [
  { label: 'Account', icon: User, tab: 'account' },
  { label: 'Brand Profile', icon: Building2, tab: 'brand' },
  { label: 'Preferences', icon: Palette, tab: 'preferences' },
  { label: 'Seasonal Events', icon: Calendar, tab: 'events' },
  { label: 'Notifications', icon: Bell, tab: 'notifications' },
];

export default function DashboardSidebar({ mobileOpen = false, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (open: boolean) => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const currentUserEmail = localStorage.getItem('currentUser');
      if (currentUserEmail) {
        try {
          const user = await userService.getByEmail(currentUserEmail);
          if (user) {
            setUserEmail(user.email);
            setUserName(user.display_name || 'User');
            setUserId(user.id);
          }
        } catch {
          // ignore
        }
      }
    })();
  }, []);

  const isActive = (href: string) => location.pathname === href;
  const isSettingsActive = () => location.pathname === '/dashboard/settings';
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/');
  };
  const handleCloseDrawer = () => setMobileOpen && setMobileOpen(false);

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-white border-r border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 h-16 px-6 border-b border-slate-100 relative">
        {/* #region agent log */}
        <Link
          to="/"
          className="flex items-center gap-2"
          aria-label="Ad-Genie"
          onClick={() => {
            fetch('http://127.0.0.1:7243/ingest/1f05fac3-9d5b-456a-b58e-d045d6d2998f', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'DashboardSidebar.tsx:75', message: 'Logo clicked', data: { component: 'DashboardSidebar', currentPath: location.pathname, targetPath: '/' }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'A' }) }).catch(() => {});
          }}
        >
          {/* #endregion */}
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-genie-primary shadow-md bg-white flex-shrink-0">
            <img
              src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
              alt="Ad-Genie Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-genie-primary via-genie-secondary to-genie-accent text-transparent bg-clip-text">
            Ad-Genie
          </span>
          <Sparkles className="text-genie-accent w-4 h-4 ml-1" />
        </Link>
        {/* Close button on mobile */}
        {setMobileOpen && (
          <button className="md:hidden absolute right-4 top-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center" onClick={handleCloseDrawer} aria-label="Close sidebar">
            <CloseIcon size={24} className="text-slate-600" />
          </button>
        )}
      </div>
      <div className="py-6 flex-1 flex flex-col gap-2">
        <nav className="flex-1 flex flex-col gap-1 px-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-base min-h-[44px] ${
                  active
                    ? 'bg-blue-50 text-[#2563EB] shadow-inner'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                aria-current={active ? 'page' : undefined}
                onClick={handleCloseDrawer}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
          
          {/* Settings with expandable sub-menu */}
          <div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-base ${
                isSettingsActive()
                  ? 'bg-blue-50 text-[#2563EB] shadow-inner'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Settings size={20} />
              <span className="flex-1 text-left">Settings</span>
              <ChevronDown
                size={16}
                className={`text-slate-400 transition-transform ${settingsOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {settingsOpen && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-2">
                {settingsSubItems.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const subActive = isSettingsActive() && new URLSearchParams(location.search).get('tab') === subItem.tab;
                  return (
                    <Link
                      key={subItem.tab}
                      to={`/dashboard/settings?tab=${subItem.tab}`}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm min-h-[44px] ${
                        subActive
                          ? 'bg-blue-50 text-[#2563EB] font-semibold'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      onClick={handleCloseDrawer}
                    >
                      <SubIcon size={16} />
                      {subItem.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
        {/* Magic Tokens Badge */}
        <div className="flex items-center justify-center mt-6">
          {userId && <TokenDisplay userId={userId} size="medium" />}
        </div>
      </div>
      {/* Account Section */}
      <div className="border-t border-slate-100 px-6 py-4">
        <div className="mb-3">
          <div className="text-sm font-semibold text-slate-900">{userName}</div>
          <div className="text-xs text-slate-500">{userEmail}</div>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            to="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px]"
            onClick={handleCloseDrawer}
          >
            <Settings size={18} />
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors w-full min-h-[44px]"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-50 bg-white border-r border-slate-200 shadow-sm">
        {sidebarContent}
      </aside>
      {/* Mobile sidebar as drawer */}
      {setMobileOpen && (
        <>
          <div className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? 'block' : 'pointer-events-none hidden'}`}>{/* Backdrop */}
            <div
              className={`absolute inset-0 bg-slate-900/50 transition-opacity duration-200 ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden="true"
              onClick={handleCloseDrawer}
            />
            <div
              className={`fixed top-0 left-0 w-64 h-full z-50 bg-white border-r border-slate-200 shadow-sm transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
              tabIndex={-1}
              role="dialog"
            >
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </>
  );
}
