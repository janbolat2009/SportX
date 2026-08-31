import React from 'react';

interface MuscleIconProps {
  className?: string;
  size?: number;
}

export const ChestIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body Contour */}
    <path d="M10 5L16 8L22 5L26 12L23 27H9L6 12L10 5Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Pectoral Highlights */}
    <path d="M10 11C12 10.5 15.5 10.5 15.5 15C13 15.5 10 14 10 11Z" fill="#10B981" />
    <path d="M22 11C20 10.5 16.5 10.5 16.5 15C19 15.5 22 14 22 11Z" fill="#10B981" />
  </svg>
);

export const BackIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Body Contour */}
    <path d="M9 6L16 8L23 6L26 13L22 27H10L6 13L9 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Lats and Upper Back Highlights */}
    <path d="M11 11L15.5 11L14 19L10 16L11 11Z" fill="#10B981" />
    <path d="M21 11L16.5 11L18 19L22 16L21 11Z" fill="#10B981" />
    <line x1="16" y1="9" x2="16" y2="24" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const ShouldersIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Torso Base */}
    <path d="M11 7L16 9L21 7L24 14L22 26H10L8 14L11 7Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Deltoid Highlights */}
    <path d="M7 11C8 8.5 11 8 12 11C11.5 14 8.5 14.5 7 11Z" fill="#10B981" />
    <path d="M25 11C24 8.5 21 8 20 11C20.5 14 23.5 14.5 25 11Z" fill="#10B981" />
  </svg>
);

export const BicepsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Flexed Arm Contour */}
    <path d="M7 25V18C7 14 10 11 14 10C17 9 20 10 22 13L25 18L21 24L16 20L11 25H7Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Biceps Peak Highlight */}
    <path d="M12 11C15 8.5 18.5 9.5 19 13C16.5 15 13 14 12 11Z" fill="#10B981" />
  </svg>
);

export const TricepsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Arm Posterior Contour */}
    <path d="M10 6L17 7L19 14L22 25H16L13 16L9 11L10 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Triceps Highlight */}
    <path d="M14 9C17 9 18.5 12 18 16C15.5 15 13.5 12 14 9Z" fill="#10B981" />
  </svg>
);

export const ForearmsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 6L21 6L19 26L13 26L11 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Forearm Brachioradialis Highlight */}
    <path d="M12.5 9C15 8 18 8 19.5 9L18 20C16 21 14 21 14 20L12.5 9Z" fill="#10B981" />
  </svg>
);

export const CoreIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Torso Contour */}
    <path d="M10 6H22L20 26H12L10 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Abdominal Grid Highlight */}
    <rect x="13" y="10" width="2.5" height="3" rx="0.8" fill="#10B981" />
    <rect x="16.5" y="10" width="2.5" height="3" rx="0.8" fill="#10B981" />
    <rect x="13" y="14.5" width="2.5" height="3" rx="0.8" fill="#10B981" />
    <rect x="16.5" y="14.5" width="2.5" height="3" rx="0.8" fill="#10B981" />
    <rect x="13" y="19" width="2.5" height="3" rx="0.8" fill="#10B981" />
    <rect x="16.5" y="19" width="2.5" height="3" rx="0.8" fill="#10B981" />
  </svg>
);

export const TrapsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 9L16 6L23 9L25 18L21 26H11L7 18L9 9Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Trapezius Diamond Highlight */}
    <path d="M16 8L20.5 12L18 19L16 21L14 19L11.5 12L16 8Z" fill="#10B981" />
  </svg>
);

export const NeckIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="9" r="4.5" stroke="#52525B" strokeWidth="1.5" fill="#18181B" />
    <path d="M13 14H19L23 25H9L13 14Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Neck Highlight */}
    <path d="M14 14.5H18L19.5 20H12.5L14 14.5Z" fill="#10B981" />
  </svg>
);

export const GlutesIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 6H21L24 16L21 26H11L8 16L11 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Gluteal Lobes Highlight */}
    <circle cx="13.5" cy="17" r="3.5" fill="#10B981" />
    <circle cx="18.5" cy="17" r="3.5" fill="#10B981" />
  </svg>
);

export const QuadricepsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Legs Anterior Contour */}
    <path d="M10 6H22L20 26H17L16 14L15 26H12L10 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Quads Highlight */}
    <path d="M11.5 8C13 8 14.5 11 14 16C12.5 16 11 13 11.5 8Z" fill="#10B981" />
    <path d="M20.5 8C19 8 17.5 11 18 16C19.5 16 21 13 20.5 8Z" fill="#10B981" />
  </svg>
);

export const HamstringsIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M10 6H22L20 26H17L16 15L15 26H12L10 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Posterior Hamstring Highlight */}
    <rect x="11.5" y="9" width="3" height="8" rx="1.5" fill="#10B981" />
    <rect x="17.5" y="9" width="3" height="8" rx="1.5" fill="#10B981" />
  </svg>
);

export const CalvesIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11 6H21L19 26H13L11 6Z" stroke="#52525B" strokeWidth="1.5" strokeLinejoin="round" fill="#18181B" />
    {/* Calf Diamond Highlight */}
    <path d="M13 10C15 8.5 17 8.5 19 10C20 13 18 16 16 17C14 16 12 13 13 10Z" fill="#10B981" />
  </svg>
);

export const FullBodyIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="6" r="3" fill="#10B981" />
    <path d="M16 9V17M16 17L11 26M16 17L21 26M10 13L22 13" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CardioIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M16 28S4 20 4 11C4 6.5 7.5 3 12 3C14.5 3 16 4.5 16 4.5S17.5 3 20 3C24.5 3 28 6.5 28 11C28 20 16 28 16 28Z" stroke="#52525B" strokeWidth="1.5" fill="#18181B" />
    <path d="M7 13H12L14.5 8L17.5 18L20 13H25" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const MobilityIcon: React.FC<MuscleIconProps> = ({ className = '', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="16" cy="16" r="12" stroke="#52525B" strokeWidth="1.5" fill="#18181B" />
    <path d="M16 7V25M7 16H25M10 10L22 22M22 10L10 22" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const getMuscleIcon = (slug?: string, size = 24, className = '') => {
  const s = slug?.toLowerCase() || '';
  switch (s) {
    case 'chest':
      return <ChestIcon size={size} className={className} />;
    case 'back':
    case 'lats':
    case 'upper_back':
    case 'lower_back':
      return <BackIcon size={size} className={className} />;
    case 'shoulders':
    case 'front_delts':
    case 'lateral_delts':
    case 'rear_delts':
      return <ShouldersIcon size={size} className={className} />;
    case 'biceps':
      return <BicepsIcon size={size} className={className} />;
    case 'triceps':
      return <TricepsIcon size={size} className={className} />;
    case 'forearms':
      return <ForearmsIcon size={size} className={className} />;
    case 'core':
    case 'abs':
    case 'obliques':
      return <CoreIcon size={size} className={className} />;
    case 'traps':
      return <TrapsIcon size={size} className={className} />;
    case 'neck':
      return <NeckIcon size={size} className={className} />;
    case 'glutes':
      return <GlutesIcon size={size} className={className} />;
    case 'quadriceps':
    case 'legs':
    case 'adductors':
      return <QuadricepsIcon size={size} className={className} />;
    case 'hamstrings':
      return <HamstringsIcon size={size} className={className} />;
    case 'calves':
    case 'tibialis':
      return <CalvesIcon size={size} className={className} />;
    case 'cardio':
      return <CardioIcon size={size} className={className} />;
    case 'mobility':
      return <MobilityIcon size={size} className={className} />;
    default:
      return <FullBodyIcon size={size} className={className} />;
  }
};
