import React from 'react';
import clsx from 'clsx';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ className, children, hoverable = false, onClick = () => {} }) => (
  <div className={clsx('card', hoverable && 'card-hover', className)} onClick={onClick}>
    {children}
  </div>
);
