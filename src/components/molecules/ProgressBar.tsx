import React from 'react';
import clsx from 'clsx';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max = 100, label, className }) => {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);
  return (
    <div className={clsx('progress-bar', className)}>
      <div className="progress-bar__fill" style={{ width: `${percent}%` }} />
      {label && <div className="progress-bar__label">{label}</div>}
      <div className="progress-bar__percentage">{percent}%</div>
    </div>
  );
};
