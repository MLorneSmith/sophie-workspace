'use client';

import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { ContainerScroll as BaseContainerScroll } from '@kit/ui/container-scroll-animation';

interface ContainerScrollProps {
  children: ReactNode;
}

// Simple loading state that maintains layout and positioning
const LoadingState = () => (
  <div className="relative h-[100vh]">
    <div className="sticky top-0 flex h-screen items-center justify-center">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="relative">
          <div className="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] bg-transparent p-2 md:h-[40rem] md:p-6">
            <div className="h-full w-full rounded-2xl bg-transparent" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ContainerScroll({ children }: ContainerScrollProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <BaseContainerScroll>{children}</BaseContainerScroll>
    </Suspense>
  );
}
