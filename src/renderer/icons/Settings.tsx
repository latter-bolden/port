import React from 'react';

export const SettingsIcon = ({ className = '', primary = '', secondary = '' }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}><path className={primary} d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2zm11 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-8 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path className={secondary} d="M9.73 14H17a1 1 0 0 1 0 2H9.73a2 2 0 0 0 0-2zm4.54-6a2 2 0 0 0 0 2H7a1 1 0 1 1 0-2h7.27z"/></svg>
)
