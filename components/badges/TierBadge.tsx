import React from 'react';

type Tier = 'Novice' | 'Contributor' | 'Expert' | 'Master' | 'Grandmaster';

interface TierBadgeProps {
  tier: Tier | string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const colorMap: Record<Tier | string, { 
    base: string; 
    light: string; 
    dark: string; 
    star: string; 
    shadow: string; 
    wings: string;
    wingLight: string;
}> = {
  'Novice': {
    base: '#94a3b8',   // slate-400
    light: '#cbd5e1',  // slate-300
    dark: '#64748b',   // slate-500
    star: '#f1f5f9',   // slate-100
    shadow: '#475569', // slate-600
    wings: '#cbd5e1',
    wingLight: '#e2e8f0'
  },
  'Contributor': {
    base: '#f87171',   // red-400
    light: '#fca5a5',  // red-300
    dark: '#ef4444',   // red-500
    star: '#fee2e2',   // red-100
    shadow: '#b91c1c', // red-700
    wings: '#fca5a5',
    wingLight: '#fecaca'
  },
  'Expert': {
    base: '#a78bfa',   // purple-400
    light: '#c4b5fd',  // purple-300
    dark: '#8b5cf6',   // purple-500
    star: '#ede9fe',   // purple-100
    shadow: '#6d28d9', // purple-700
    wings: '#c4b5fd',
    wingLight: '#ddd6fe'
  },
  'Master': {
    base: '#38bdf8',   // sky-400
    light: '#7dd3fc',  // sky-300
    dark: '#0ea5e9',   // sky-500
    star: '#e0f2fe',   // sky-100
    shadow: '#0369a1', // sky-700
    wings: '#7dd3fc',
    wingLight: '#bae6fd'
  },
  'Grandmaster': {
    base: '#fbbf24',   // amber-400
    light: '#fcd34d',  // amber-300
    dark: '#f59e0b',   // amber-500
    star: '#fef3c7',   // amber-100
    shadow: '#b45309', // amber-700
    wings: '#fcd34d',
    wingLight: '#fde68a'
  }
};

const defaultColors = colorMap['Novice'];

import { useId } from 'react';

export function TierBadge({ tier, className = '', size = 'md' }: TierBadgeProps) {
  const badgeId = useId();
  const colors = colorMap[tier] || defaultColors;
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  // Provide slightly different shapes based on tier complexity
  const hasWings = tier === 'Expert' || tier === 'Master' || tier === 'Grandmaster';
  const hasComplexWings = tier === 'Master' || tier === 'Grandmaster';
  const hasInnerShadow = tier === 'Grandmaster';

  const idSuffix = badgeId.replace(/:/g, ''); // For unique gradients, standardizing characters

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${className}`} title={tier}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        
        {/* Gradients */}
        <defs>
          <linearGradient id={`baseGrad-${idSuffix}`} x1="0" y1="0" x2="0" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.light} />
            <stop offset="1" stopColor={colors.dark} />
          </linearGradient>
          <linearGradient id={`wingGrad-${idSuffix}`} x1="0" y1="20" x2="0" y2="80" gradientUnits="userSpaceOnUse">
            <stop stopColor={colors.wingLight} />
            <stop offset="1" stopColor={colors.wings} />
          </linearGradient>
          <radialGradient id={`starGrad-${idSuffix}`} cx="50" cy="50" r="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor={colors.star} />
          </radialGradient>
        </defs>

        {/* Outer Wings (For higher tiers) */}
        {hasComplexWings && (
          <g transform="translate(0, 0)">
             {/* Base Wings */}
            <path d="M10 35 L30 25 L30 75 L10 65 Z" fill={`url(#wingGrad-${idSuffix})`} />
            <path d="M90 35 L70 25 L70 75 L90 65 Z" fill={`url(#wingGrad-${idSuffix})`} />
             {/* Small flair */}
            <path d="M5 45 L20 40 L20 60 L5 55 Z" fill={colors.light} />
            <path d="M95 45 L80 40 L80 60 L95 55 Z" fill={colors.light} />
          </g>
        )}

        {/* Regular Wings */}
        {hasWings && !hasComplexWings && (
          <g transform="translate(0, 0)">
            <path d="M15 40 L30 30 L30 70 L15 60 Z" fill={`url(#wingGrad-${idSuffix})`} />
            <path d="M85 40 L70 30 L70 70 L85 60 Z" fill={`url(#wingGrad-${idSuffix})`} />
          </g>
        )}

        {/* Main Base Hexagon/Shield Shadow */}
        <path d="M50 90 L20 75 L20 30 L50 15 L80 30 L80 75 Z" fill={colors.shadow} transform="translate(0, 4)" />
        
        {/* Main Base Hexagon/Shield */}
        <path d="M50 90 L20 75 L20 30 L50 15 L80 30 L80 75 Z" fill={`url(#baseGrad-${idSuffix})`} />
        
        {/* Inner Highlight Polygon */}
        <path d="M50 82 L26 70 L26 35 L50 23 L74 35 L74 70 Z" fill={colors.base} opacity="0.6"/>

        {/* Center Star */}
        <g transform="translate(50, 52) scale(0.6)">
           <path 
             d="M0 -30 L8 -10 L30 -10 L12 5 L18 25 L0 12 L-18 25 L-12 5 L-30 -10 L-8 -10 Z" 
             fill={`url(#starGrad-${idSuffix})`} 
             className="drop-shadow-sm"
           />
        </g>
      </svg>
    </div>
  );
}
