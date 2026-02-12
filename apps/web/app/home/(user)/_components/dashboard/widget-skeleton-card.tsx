'use client';

import { Card } from '@kit/ui/card';
import { Skeleton } from '@kit/ui/skeleton';

import { useEffect, useState } from 'react';

interface WidgetSkeletonCardProps {
  height?: string;
  label?: string;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mql.matches);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

export function WidgetSkeletonCard({
  height = 'h-64',
  label,
}: WidgetSkeletonCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <Card
      className={`flex ${height} flex-col p-6`}
      role="status"
      aria-label={label ? `Loading ${label}` : 'Loading widget'}
    >
      <Skeleton
        className={`mb-3 h-5 w-1/3 ${prefersReducedMotion ? 'animate-none' : ''}`}
      />
      <Skeleton
        className={`flex-1 w-full ${prefersReducedMotion ? 'animate-none' : ''}`}
      />
    </Card>
  );
}
