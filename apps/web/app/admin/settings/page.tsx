import { AdminGuard } from "@kit/admin/components/admin-guard";

import { AdminSettingsPageClient } from "./_components/AdminSettingsPageClient";

function AdminSettingsPage() {
	return <AdminSettingsPageClient />;
}

export default AdminGuard(AdminSettingsPage);
