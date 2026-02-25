import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'avatar' | 'image';
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ variant = 'text', className }) => (
  <div className={clsx('skeleton', variant && `skeleton--${variant}`, className)} />
);
