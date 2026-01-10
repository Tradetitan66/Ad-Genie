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
    <div className="min-h-screen bg-[#FAFAFA] flex">
      <DashboardSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />
      <div className="flex-1 ml-0 md:ml-64">
        {/* Hamburger button (only visible on mobile) */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 bg-white rounded-lg border border-[#E5E7EB] shadow-md p-2 flex items-center justify-center min-w-[44px] min-h-[44px]"
          onClick={() => setMobileSidebarOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon size={24} className="text-[#2D3142]" />
        </button>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="bg-white border-b border-[#E5E7EB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <nav aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm">
                  <li>
                    <Link to="/dashboard/campaign-hub" className="text-[#6B7280] hover:text-orange-500 transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  {breadcrumbs.map((crumb, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-[#E5E7EB]">/</span>
                      {crumb.href ? (
                        <Link to={crumb.href} className="text-[#6B7280] hover:text-orange-500 transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-[#2D3142] font-medium">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">{children}</div>
      </div>
    </div>
  );
}
