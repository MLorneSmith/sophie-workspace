'use client';

import dynamic from 'next/dynamic';
import { LogoCloudMarquee as BaseLogoCloudMarquee } from '@kit/ui/logo-marquee';

const LogoCloudMarquee = dynamic<React.ComponentProps<typeof BaseLogoCloudMarquee>>(() => 
  import('@kit/ui/logo-marquee').then(mod => mod.LogoCloudMarquee), {
  ssr: true,
  loading: () => (
    <div className="h-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-lg" />
  ),
});

export default LogoCloudMarquee;
