import React from 'react';

import { cn } from '../../lib/utils';

export const FeatureGrid: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  function FeatureGridComponent({ className, children, ...props }) {
    return (
      <div
        className={cn(
          'grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 grid grid-cols-1 gap-4 mt-2 md:grid-cols-3 md:mt-6',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  };
