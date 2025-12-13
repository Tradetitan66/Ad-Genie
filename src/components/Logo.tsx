import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { brandProfileService } from '../services/database';
import { userService } from '../services/database';

interface LogoProps {
  to?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  showSparkle?: boolean;
}

export default function Logo({ 
  to = '/dashboard/campaign-hub', 
  className = '',
  size = 'md',
  showText = true,
  showSparkle = true
}: LogoProps) {
  const [brandColors, setBrandColors] = useState<{
    primary?: string;
    secondary?: string;
    accent?: string;
  }>({});

  useEffect(() => {
    const loadBrandColors = async () => {
      try {
        const currentUserEmail = localStorage.getItem('currentUser');
        if (!currentUserEmail) {
          return;
        }

        const user = await userService.getByEmail(currentUserEmail);
        if (!user) {
          return;
        }

        const brandProfile = await brandProfileService.getByUserId(user.id);
        if (brandProfile?.brand_colors) {
          setBrandColors(brandProfile.brand_colors);
        }
      } catch (error) {
        console.error('Error loading brand colors:', error);
      }
    };

    loadBrandColors();
  }, []);

  // Default colors if brand colors not set
  const primaryColor = brandColors.primary || '#F97316'; // orange-500
  const accentColor = brandColors.accent || brandColors.secondary || '#FBBF24'; // amber-400

  // Size configurations
  const sizeConfig = {
    sm: { logo: 'w-8 h-8', text: 'text-lg', sparkle: 'w-3 h-3' },
    md: { logo: 'w-10 h-10', text: 'text-xl', sparkle: 'w-4 h-4' },
    lg: { logo: 'w-12 h-12', text: 'text-2xl', sparkle: 'w-5 h-5' }
  };

  const config = sizeConfig[size];

  const LogoContent = (
    <div className={`flex items-center gap-2 group ${className}`}>
      <div 
        className={`${config.logo} rounded-full overflow-hidden border-2 shadow-md bg-white flex-shrink-0 transition-transform duration-300 group-hover:scale-110`}
        style={{ borderColor: primaryColor }}
      >
        <img
          src="/enhanced_design_a_contemporary_professional_logo_combining_a_streamlined_genie_figure_with_modern_tech_symbo_g4d4ei5j85xa3vwd3mit_1 (1).png"
          alt="Ad-Genie Logo"
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <>
          <span 
            className={`${config.text} font-bold`}
            style={{ color: primaryColor }}
          >
            Ad-Genie
          </span>
          {showSparkle && (
            <Sparkles 
              className={config.sparkle} 
              style={{ color: accentColor }}
            />
          )}
        </>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} aria-label="Ad-Genie" className="flex items-center">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}
