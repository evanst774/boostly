// components/icons/BikeIcon.tsx
import React from 'react';

interface BikeIconProps {
  className?: string;
  width?: number;
  height?: number;
}

export const BikeIcon: React.FC<BikeIconProps> = ({
  className = '',
  width = 30,
  height = 22,
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 30 22"
    fill="none"
    className={className}
  >
    <circle cx="5.5" cy="18" r="3.5" fill="#475569" />
    <circle cx="24.5" cy="18" r="3.5" fill="#475569" />
    <path
      d="M5.5 18 L9 11 L20 10 L24 15 L24.5 18"
      stroke="#64748b"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M13 10.5 Q15.5 5.5 20 7 Q23.5 8 24 13"
      fill="#334155"
      opacity="0.6"
    />
  </svg>
);
