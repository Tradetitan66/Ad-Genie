import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, FolderOpen, Filter, Search, Calendar, Image, Video, Sparkles } from 'lucide-react';

interface CampaignSidebarProps {
  onFilterChange?: (filters: FilterState) => void;
  onSearchChange?: (query: string) => void;
}

interface FilterState {
  status: string;
  contentType: string;
  dateRange: string;
}

export default function CampaignSidebar({ onFilterChange, onSearchChange }: CampaignSidebarProps) {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    contentType: 'all',
    dateRange: 'all',
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const navItems = [
    { label: 'Dashboard', icon: Home, href: '/dashboard/campaign-hub' },
    { label: 'New Campaign', icon: Plus, href: '/dashboard/content-selection' },
    { label: 'My Campaigns', icon: FolderOpen, href: '/dashboard/campaigns' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <aside className="hidden lg:block w-[280px] fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-[#E5E7EB] overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
                  active
                    ? 'bg-orange-50 text-orange-600 border border-orange-200'
                    : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#2D3142]'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Search</label>
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#2D3142] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-[#6B7280]" />
            <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Filters</h3>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#2D3142]">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#2D3142] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="generating">Generating</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Content Type Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#2D3142]">Content Type</label>
            <select
              value={filters.contentType}
              onChange={(e) => handleFilterChange('contentType', e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#2D3142] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="all">All Types</option>
              <option value="image-only">Images Only</option>
              <option value="ugc-only">Videos Only</option>
              <option value="image-ugc">Images + Videos</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#2D3142]">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg text-sm text-[#2D3142] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>
      </div>
    </aside>
  );
}

