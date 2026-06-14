/**
 * Material Symbols Outlined icon wrapper.
 */

import React from 'react';

interface MaterialIconProps {
  name: string;
  className?: string;
  filled?: boolean;
  weight?: number;
}

export const MaterialIcon: React.FC<MaterialIconProps> = ({
  name,
  className = '',
  filled = false,
  weight,
}) => (
  <span
    className={`material-symbols-outlined ${filled ? 'material-symbols-filled' : ''} ${className}`}
    style={weight != null ? { fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}` } : undefined}
    aria-hidden
  >
    {name}
  </span>
);
