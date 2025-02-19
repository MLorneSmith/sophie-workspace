import { createI18nServerInstance } from '~/lib/i18n/i18n.server';

import { CanvasPage } from './_components/canvas-page';

interface CanvasServerPageProps {
  searchParams: {
    id?: string;
  };
}

export default async function CanvasServerPage({
  searchParams,
}: CanvasServerPageProps) {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.aiCanvas');
  const description = i18n.t('common:aiCanvasTabDescription');

  return <CanvasPage title={title} description={description} />;
}
