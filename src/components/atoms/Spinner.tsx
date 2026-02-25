import React from 'react';
import clsx from 'clsx';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => (
  <span
    className={clsx(
      'spinner',
      size === 'sm' && 'spinner--sm',
      size === 'lg' && 'spinner--lg',
      className
    )}
    aria-label="Loading"
  />
);
