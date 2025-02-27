import { Metadata } from 'next';

import { headers } from 'next/headers';

/**
 * @name generateRootMetadata
 * @description Generates the root metadata for the application
 */
export const generateRootMetadata = async (): Promise<Metadata> => {
  const headersStore = await headers();
  const csrfToken = headersStore.get('x-csrf-token') ?? '';

  // Use environment variables directly with fallbacks
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://2025slideheroes-web.vercel.app';
  const siteName = process.env.NEXT_PUBLIC_PRODUCT_NAME || 'SlideHeroes';
  const siteTitle =
    process.env.NEXT_PUBLIC_SITE_TITLE ||
    'SlideHeroes - AI Tools & Video Training';
  const siteDescription =
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Rapidly Create Smart + Impactful Business Presentations';

  return {
    title: siteTitle,
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    other: {
      'csrf-token': csrfToken,
    },
    openGraph: {
      url: siteUrl,
      siteName: siteName,
      title: siteTitle,
      description: siteDescription,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description: siteDescription,
    },
    icons: {
      icon: '/images/favicon/favicon.ico',
      apple: '/images/favicon/apple-touch-icon.png',
    },
  };
};
