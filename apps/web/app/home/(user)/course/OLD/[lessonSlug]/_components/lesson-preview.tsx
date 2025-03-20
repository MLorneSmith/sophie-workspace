import Link from 'next/link';
import { Cms } from '@kit/cms';
import { If } from '@kit/ui/if';
import { CoverImage } from '~/(marketing)/blog/_components/cover-image';

type Props = {
  post: Cms.ContentItem;
  preloadImage?: boolean;
  imageHeight?: string | number;
};

const DEFAULT_IMAGE_HEIGHT = 250;

export function LessonPreview({
  post,
  preloadImage,
  imageHeight,
}: React.PropsWithChildren<Props>) {
  const { title, image, description } = post;
  const height = imageHeight ?? DEFAULT_IMAGE_HEIGHT;

  const slug = `/home/course/${post.slug}`;
  console.log('LessonPreview: Creating link with slug:', slug);

  return (
    <div className="flex flex-col space-y-4 rounded-lg transition-shadow duration-500">
      <If condition={image}>
        {(imageUrl) => (
          <div className="relative mb-2 w-full" style={{ height }}>
            <Link href={slug}>
              <CoverImage
                preloadImage={preloadImage}
                title={title}
                src={imageUrl}
              />
            </Link>
          </div>
        )}
      </If>

      <div className={'flex flex-col space-y-4 px-1'}>
        <div className={'flex flex-col space-y-2'}>
          <h2 className="text-2xl font-semibold leading-snug tracking-tight">
            <Link href={slug} className="hover:underline">
              {title}
            </Link>
          </h2>
        </div>

        <p
          className="mb-4 text-sm leading-relaxed text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: description ?? '' }}
        />
      </div>
    </div>
  );
}
