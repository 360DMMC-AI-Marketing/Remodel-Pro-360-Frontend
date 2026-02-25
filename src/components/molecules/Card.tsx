import React from 'react';
import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, hoverable = false }) => (
  <div className={clsx('card', hoverable && 'card-hover', className)}>
    {children}
  </div>
);
