import type { ComponentType, SVGProps } from "react";

import {
	BookOpen,
	ClipboardCheck,
	HelpCircle,
	Presentation,
} from "lucide-react";

import type { ActivityItem } from "../types/activity.types";

interface ActivityIconConfig {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	colorClass: string;
}

const activityIconMap: Record<
	ActivityItem["activity_type"],
	ActivityIconConfig
> = {
	lesson_completed: {
		icon: BookOpen,
		colorClass: "text-blue-500",
	},
	quiz_score: {
		icon: HelpCircle,
		colorClass: "text-amber-500",
	},
	assessment_completed: {
		icon: ClipboardCheck,
		colorClass: "text-emerald-500",
	},
	presentation_created: {
		icon: Presentation,
		colorClass: "text-violet-500",
	},
};

export function getActivityIcon(
	activityType: ActivityItem["activity_type"],
): ActivityIconConfig {
	return activityIconMap[activityType];
}
