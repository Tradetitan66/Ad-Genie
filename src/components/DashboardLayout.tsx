import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { Menu as MenuIcon } from 'lucide-react';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <DashboardSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Hamburger button (only visible on mobile) */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-lg border border-slate-200 shadow-md p-2 flex items-center justify-center"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon size={28} className="text-slate-700" />
        </button>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm">
                  <li>
                    <Link to="/dashboard/campaign-hub" className="text-slate-600 hover:text-slate-900 transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-slate-400">/</span>
                      {crumb.href ? (
                        <Link to={crumb.href} className="text-slate-600 hover:text-slate-900 transition-colors">
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
      </div>
    </div>
  );
}
