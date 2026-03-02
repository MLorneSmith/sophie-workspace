import { boldPitchTemplate } from "./bold-pitch";
import { consultingClassicTemplate } from "./consulting-classic";
import { corporateExecutiveTemplate } from "./corporate-executive";
import { dataStorytellerTemplate } from "./data-storyteller";
import { modernMinimalTemplate } from "./modern-minimal";

export {
	boldPitchTemplate,
	consultingClassicTemplate,
	corporateExecutiveTemplate,
	dataStorytellerTemplate,
	modernMinimalTemplate,
};

export const CURATED_TEMPLATES = [
	consultingClassicTemplate,
	modernMinimalTemplate,
	boldPitchTemplate,
	corporateExecutiveTemplate,
	dataStorytellerTemplate,
] as const;
