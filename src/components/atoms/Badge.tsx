import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'draft';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'primary', className, children }) => (
  <span className={clsx('badge', `badge-${variant}`, className)}>
    {children}
  </span>
);
