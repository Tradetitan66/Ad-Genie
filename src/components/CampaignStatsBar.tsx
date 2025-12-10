import { Link } from 'react-router-dom';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import TokenDisplay from './TokenDisplay';

interface CampaignStatsBarProps {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  userId: string | null;
  isLoading?: boolean;
}

export default function CampaignStatsBar({
  totalCampaigns,
  activeCampaigns,
  completedCampaigns,
  userId,
  isLoading = false,
}: CampaignStatsBarProps) {
  return (
    <div className="bg-white border-b border-[#E5E7EB] px-8 py-4">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-8">
        {/* Stats */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">Total Campaigns</span>
            {isLoading ? (
              <Loader2 size={20} className="text-[#6B7280] animate-spin" />
            ) : (
              <span className="text-2xl font-bold text-[#2D3142]">{totalCampaigns}</span>
            )}
          </div>
          
          <div className="h-8 w-px bg-[#E5E7EB]" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">Active</span>
            {isLoading ? (
              <Loader2 size={20} className="text-orange-500 animate-spin" />
            ) : (
              <span className="text-2xl font-bold text-orange-500">{activeCampaigns}</span>
            )}
          </div>
          
          <div className="h-8 w-px bg-[#E5E7EB]" />
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#6B7280]">Completed</span>
            {isLoading ? (
              <Loader2 size={20} className="text-[#10B981] animate-spin" />
            ) : (
              <span className="text-2xl font-bold text-[#10B981]">{completedCampaigns}</span>
            )}
          </div>
          
          {userId && (
            <>
              <div className="h-8 w-px bg-[#E5E7EB]" />
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-amber-500" />
                <TokenDisplay userId={userId} size="medium" showLabel={true} />
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Link
          to="/dashboard/content-selection"
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-400 to-orange-600 text-white font-bold rounded-lg hover:from-orange-500 hover:to-orange-700 transition-all shadow-md"
        >
          <Plus size={18} />
          <span>New Campaign</span>
        </Link>
      </div>
    </div>
  );
}

