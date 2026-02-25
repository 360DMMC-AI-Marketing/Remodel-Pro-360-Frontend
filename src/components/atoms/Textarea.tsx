import React from 'react';
import clsx from 'clsx';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  className?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ error, className, ...props }) => (
  <textarea className={clsx('input', error && 'input-error', className)} {...props} />
);
