import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input: React.FC<InputProps> = ({ error, className, ...props }) => (
  <input
    className={clsx('input', error && 'input-error', className)}
    {...props}
  />
);
