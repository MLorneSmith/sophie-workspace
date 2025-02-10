'use client';

import dynamic from 'next/dynamic';
import { StickyScrollReveal as BaseStickyScrollReveal } from '@kit/ui/sticky-scroll-reveal';

// Define the content item type
interface ContentItem {
  title: string;
  description: string[];
  imageSrc: string;
  content: React.ReactNode;
}

// Define the component props
interface StickyScrollRevealProps {
  content: ContentItem[];
}

const StickyScrollReveal = dynamic<StickyScrollRevealProps>(() => 
  import('@kit/ui/sticky-scroll-reveal').then(mod => {
    const { StickyScrollReveal } = mod;
    return StickyScrollReveal;
  }), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-[60vh] bg-gray-200 dark:bg-gray-800 rounded-lg" />
      <div className="h-[60vh] bg-gray-200 dark:bg-gray-800 rounded-lg" />
    </div>
  ),
});

export default StickyScrollReveal;
