

import { PersonalAccountSettingsContainer } from "@kit/accounts/personal-account-settings";
import { PageBody } from "@kit/ui/page";

const features = {
<<<<<<< HEAD
	enableAccountDeletion: featureFlagsConfig.enableAccountDeletion,
	enablePasswordUpdate: authConfig.providers.password,
=======
  enableAccountDeletion: featureFlagsConfig.enableAccountDeletion,
  enablePasswordUpdate: authConfig.providers.password,
  enableAccountLinking: authConfig.enableIdentityLinking,
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
};

const providers = authConfig.providers.oAuth;

const callbackPath = pathsConfig.auth.callback;
const accountHomePath = pathsConfig.app.accountHome;

const paths = {
	callback: `${callbackPath}?next=${accountHomePath}`,
};

export const generateMetadata = async () => {
	const i18n = await createI18nServerInstance();
	const title = i18n.t("account:settingsTab");

	return {
		title,
	};
};

function PersonalAccountSettingsPage() {
	const user = use(requireUserInServerComponent());

<<<<<<< HEAD
	return (
		<PageBody>
			<div className={"flex w-full flex-1 flex-col lg:max-w-2xl"}>
				<PersonalAccountSettingsContainer
					userId={user.id}
					features={features}
					paths={paths}
				/>
			</div>
		</PageBody>
	);
=======
  return (
    <PageBody>
      <div className={'flex w-full flex-1 flex-col lg:max-w-2xl'}>
        <PersonalAccountSettingsContainer
          userId={user.id}
          features={features}
          paths={paths}
          providers={providers}
        />
      </div>
    </PageBody>
  );
>>>>>>> ab0e1c994805d9ea7eaf1f1baceb38180cf47950
}

export default withI18n(PersonalAccountSettingsPage);
