import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../_components/home-page-header';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.aiStoryboard');

  return {
    title,
  };
};

function StoryboardPage() {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.aiStoryboard'} />}
        description={<Trans i18nKey={'common:aiStoryboardTabDescription'} />}
      />

      <PageBody>
        <div>
          <h1>Storyboard Content</h1>
          <p>This is the main content area for the storyboard.</p>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(StoryboardPage);
