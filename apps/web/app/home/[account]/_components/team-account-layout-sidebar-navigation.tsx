import type { NavigationConfigSchema } from "@kit/ui/navigation-schema";
import { SidebarNavigation } from "@kit/ui/shadcn-sidebar";
import type { z } from "zod";

export function TeamAccountLayoutSidebarNavigation({
	config,
}: React.PropsWithChildren<{
	config: z.infer<typeof NavigationConfigSchema>;
}>) {
	return <SidebarNavigation config={config} />;
}
