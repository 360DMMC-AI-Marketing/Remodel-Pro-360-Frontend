import React from 'react';
import clsx from 'clsx';

interface ToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  icon?: React.ReactNode;
  title: string;
  description?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'info',
  icon,
  title,
  description,
  onClose,
  className,
}) => (
  <div className={clsx('toast', `toast--${variant}`, className)}>
    {icon && <span className="toast__icon">{icon}</span>}
    <div>
      <div className="font-semibold mb-1">{title}</div>
      {description && <div className="text-sm text-neutral-500">{description}</div>}
    </div>
    {onClose && (
      <button className="toast__close" onClick={onClose} aria-label="Close">
        ×
      </button>
    )}
  </div>
);
