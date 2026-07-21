// src/components/icons/StudentIcons3D.tsx
'use client';

import React from 'react';

// Individual icon components - each exported separately
export const StudentProfileIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Main figure with 3D effect */}
    <circle cx="12" cy="8" r="4.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="12" cy="8" r="4" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="8" r="3.5" fill="currentColor" fillOpacity="0.5" />
    <circle cx="12" cy="8" r="3" fill="currentColor" />
    
    {/* Body with depth */}
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M20 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.2"
    />
    
    {/* 3D effects - shadows */}
    <circle cx="9" cy="7" r="1" fill="white" fillOpacity="0.6" />
    <circle cx="15" cy="7" r="1" fill="white" fillOpacity="0.6" />
  </svg>
);

export const AdmissionIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document base with depth */}
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <rect
      x="5"
      y="3"
      width="14"
      height="18"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.2"
    />
    
    {/* Document lines */}
    <line x1="8" y1="7" x2="16" y2="7" stroke="currentColor" strokeWidth="1.5" />
    <line x1="8" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
    <line x1="8" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" />
    
    {/* Plus sign for admission */}
    <circle cx="18" cy="18" r="3" fill="currentColor" fillOpacity="0.2" />
    <path d="M18 16v4M16 18h4" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

export const GuardianIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Adult figure */}
    <circle cx="12" cy="8" r="3.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="12" cy="8" r="3" fill="currentColor" fillOpacity="0.5" />
    <circle cx="12" cy="8" r="2.5" fill="currentColor" />
    
    <path
      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
      stroke="currentColor"
      strokeWidth="1.5"
      fill="currentColor"
      fillOpacity="0.1"
    />
    
    {/* Child figure (smaller) */}
    <circle cx="17" cy="14" r="2.5" fill="currentColor" fillOpacity="0.2" />
    <circle cx="17" cy="14" r="2" fill="currentColor" fillOpacity="0.5" />
    
    {/* Connecting line */}
    <line x1="14" y1="12" x2="17" y2="14" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

export const TransferIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* First arrow with depth */}
    <path
      d="M4 17l4 4 4-4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 21v-8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    
    {/* Second arrow with depth */}
    <path
      d="M20 7l-4-4-4 4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 3v8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    
    {/* 3D shadow effects */}
    <path
      d="M5 18l3 3 3-3"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.3"
      transform="translate(1, 1)"
    />
    <path
      d="M19 6l-3-3-3 3"
      stroke="currentColor"
      strokeWidth="1"
      strokeOpacity="0.3"
      transform="translate(1, -1)"
    />
  </svg>
);

export const AcademicHistoryIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Graduation cap base */}
    <path
      d="M2 10l10-5 10 5-10 5z"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path
      d="M2 9l10-5 10 5-10 5z"
      fill="currentColor"
      fillOpacity="0.4"
    />
    <path
      d="M2 8l10-5 10 5-10 5z"
      fill="currentColor"
    />
    
    {/* Tassel */}
    <path
      d="M12 13v4"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
    
    {/* Stack of books/documents below */}
    <rect x="8" y="15" width="8" height="2" fill="currentColor" fillOpacity="0.3" />
    <rect x="8" y="16.5" width="8" height="2" fill="currentColor" fillOpacity="0.5" />
    <rect x="8" y="18" width="8" height="2" fill="currentColor" />
  </svg>
);

export const ParentPortalIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Phone/tablet device with depth */}
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    <rect
      x="5"
      y="3"
      width="14"
      height="18"
      rx="1.5"
      fill="currentColor"
      fillOpacity="0.2"
    />
    
    {/* Screen content - parent and child icons */}
    <circle cx="12" cy="8" r="2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="12" cy="8" r="1.5" fill="currentColor" />
    
    <circle cx="12" cy="14" r="1.5" fill="currentColor" fillOpacity="0.5" />
    
    {/* Connection lines */}
    <line x1="12" y1="10" x2="12" y2="12.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

export const EnrollmentIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Document base */}
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      fill="currentColor"
      fillOpacity="0.1"
      stroke="currentColor"
      strokeWidth="1.2"
    />
    
    {/* Checkmark with depth */}
    <path
      d="M16 8L10 14L7 11"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 7L10 13L7 10"
      stroke="currentColor"
      strokeWidth="2"
      strokeOpacity="0.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(1, 1)"
    />
    
    {/* Enrollment number */}
    <circle cx="16" cy="16" r="2" fill="currentColor" fillOpacity="0.2" />
    <text x="16" y="18" fontSize="8" textAnchor="middle" fill="currentColor">✓</text>
  </svg>
);