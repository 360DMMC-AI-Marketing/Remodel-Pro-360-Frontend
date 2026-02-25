import React from 'react';
import clsx from 'clsx';

interface ContainerProps {
  className?: string;
  children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ className, children }) => (
  <div className={clsx('container-custom', className)}>
    {children}
  </div>
);
