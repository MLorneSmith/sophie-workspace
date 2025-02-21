import { PageBody } from '@kit/ui/page';
import { Trans } from '@kit/ui/trans';

import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

import { HomeLayoutPageHeader } from '../_components/home-page-header';
import { KanbanBoard } from './_components/kanban-board';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('common:routes.kanban');

  return {
    title,
  };
};

function KanbanPage() {
  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey={'common:routes.kanban'} />}
        description={<Trans i18nKey={'common:kanbanTabDescription'} />}
      />

      <PageBody>
        <KanbanBoard />
      </PageBody>
    </>
  );
}

export default withI18n(KanbanPage);
