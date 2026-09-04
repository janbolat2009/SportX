import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconDimensions = {
    sm: { width: 22, height: 22 },
    md: { width: 28, height: 28 },
    lg: { width: 38, height: 38 },
  }[size];

  const textStyles = {
    sm: 'text-sm font-black tracking-tight',
    md: 'text-lg font-black tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Minimalist Abstract Kinetic Motion Vector Symbol */}
      <svg
        width={iconDimensions.width}
        height={iconDimensions.height}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Precision Kinetic Track */}
        <rect
          width="36"
          height="36"
          rx="10"
          className="fill-white dark:fill-[#0A0A0C] stroke-stone-300 dark:stroke-[#27272A] transition-colors"
          strokeWidth="1.5"
        />
        
        {/* Abstract Dynamic Kinetic Form Line (Biomechanical Angle & Vector) */}
        <path
          d="M9 25L15 13L21 21L27 10"
          className="stroke-emerald-600 dark:stroke-brand-500 transition-colors"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Focal Motion Node */}
        <circle cx="27" cy="10" r="2.5" className="fill-sky-600 dark:fill-[#38BDF8]" />
        <circle cx="15" cy="13" r="2" className="fill-emerald-600 dark:fill-[#10B981]" />
      </svg>

      {showText && (
        <div className="flex items-center">
          <span className={`${textStyles} text-stone-900 dark:text-white transition-colors`}>SportX</span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 dark:text-brand-400 ml-1.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold">
            AI
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
