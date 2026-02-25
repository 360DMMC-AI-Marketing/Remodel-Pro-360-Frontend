import React from 'react';
import clsx from 'clsx';

interface AvatarProps {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt = 'Avatar', size = 64, className }) => (
  <img
    src={src}
    alt={alt}
    className={clsx('contractor-card__avatar', className)}
    style={{ width: size, height: size }}
  />
);
