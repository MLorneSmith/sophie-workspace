import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../../_components/home-page-header';
import SetupMultistepForm from './BlocksMultistepForm';
import { getAIConfig } from './_components/AIConfigProvider';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.blocks');

  return {
    title,
  };
};

async function BlocksPage() {
  const aiConfig = await getAIConfig();

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.blocks'} />}
        description={<Trans i18nKey={'common:blocksTabDescription'} />}
      />

      <PageBody>
        <SetupMultistepForm aiConfig={aiConfig} />
      </PageBody>
    </>
  );
}

export default withI18n(BlocksPage);
