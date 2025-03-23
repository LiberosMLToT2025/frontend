'use client';

import React from 'react';
import useStore from '../lib/store';

export default function Logo() {
  const { user } = useStore();

  const handleLogoClick = async () => {
    if (user.xpriv) {
      // Dispatch a custom event to refresh the dashboard
      window.dispatchEvent(new Event('dashboardRefresh'));
    }
  };

  return (
    <a href="/" className="font-bold text-xl cursor-pointer flex items-center" onClick={handleLogoClick}>
      <svg 
        className="w-6 h-6 mr-2" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
      <span>Stellum</span>
    </a>
  );
}