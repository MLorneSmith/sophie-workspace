import { cache } from 'react';

import type { Metadata } from 'next';

import { notFound } from 'next/navigation';

import { createCmsClient } from '@kit/cms';

import { withI18n } from '~/lib/i18n/with-i18n';

import { Post } from '../../blog/_components/post';

interface PrivatePageProps {
  params: Promise<{ slug: string }>;
}

const getPrivatePostBySlug = cache(privatePostLoader);

async function privatePostLoader(slug: string) {
  const client = await createCmsClient();

  return client.getContentItemBySlug({ slug, collection: 'private' });
}

export async function generateMetadata({
  params,
}: PrivatePageProps): Promise<Metadata> {
  const slug = (await params).slug;
  const post = await getPrivatePostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { title, publishedAt, description, image } = post;

  return Promise.resolve({
    title,
    description,
    // Add noindex directive to prevent search engines from indexing
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      publishedAt: publishedAt,
      url: post.url,
      images: image
        ? [
            {
              url: image,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  });
}

async function PrivatePost({ params }: PrivatePageProps) {
  const slug = (await params).slug;
  const post = await getPrivatePostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className={'container sm:max-w-none sm:p-0'}>
      <Post post={post} content={post.content} />
    </div>
  );
}

export default withI18n(PrivatePost);
