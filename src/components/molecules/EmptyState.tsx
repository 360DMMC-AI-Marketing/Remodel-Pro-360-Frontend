import React from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, className, children }) => (
  <div className={clsx('empty-state', className)}>
    {icon && <div className="empty-state__icon">{icon}</div>}
    <div className="empty-state__title">{title}</div>
    {description && <div className="empty-state__description">{description}</div>}
    {children}
  </div>
);
