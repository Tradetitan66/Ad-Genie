import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { tokenService } from '../services/tokenService';

interface TokenDisplayProps {
  userId: string;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function TokenDisplay({ 
  userId, 
  showLabel = true, 
  size = 'medium',
  className = '' 
}: TokenDisplayProps) {
  const [tokens, setTokens] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTokens();
    
    // Refresh tokens every 5 seconds
    const interval = setInterval(loadTokens, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadTokens = async () => {
    try {
      const balance = await tokenService.getUserTokens(userId);
      setTokens(balance);
    } catch (error) {
      console.error('Error loading Magic Tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTokenColor = (tokenCount: number): string => {
    if (tokenCount < 0) return 'text-red-600';
    if (tokenCount < 5) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Sparkles className="text-amber-400 animate-pulse" size={size === 'small' ? 16 : size === 'large' ? 20 : 18} />
        {showLabel && <span className={`${getSizeClasses()} text-slate-600`}>Loading...</span>}
      </div>
    );
  }

  const tokenCount = tokens ?? 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className="text-amber-400" size={size === 'small' ? 16 : size === 'large' ? 20 : 18} />
      {showLabel && (
        <span className={`${getSizeClasses()} text-slate-600`}>
          Magic Tokens:
        </span>
      )}
      <span className={`${getSizeClasses()} font-semibold ${getTokenColor(tokenCount)}`}>
        {tokenCount}
      </span>
      {tokenCount < 0 && (
        <span className="text-xs text-red-600 font-medium">(Test Mode)</span>
      )}
    </div>
  );
}

