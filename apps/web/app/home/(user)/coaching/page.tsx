import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../_components/home-page-header';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.coaching');

  return {
    title,
  };
};

function CoachingPage() {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.coaching'} />}
        description={<Trans i18nKey={'common:coachingTabDescription'} />}
      />

      <PageBody>{/* Content will be added here */}</PageBody>
    </>
  );
}

export default withI18n(CoachingPage);
