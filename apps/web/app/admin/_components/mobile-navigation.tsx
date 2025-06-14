import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@kit/ui/dropdown-menu";

import { Menu } from "lucide-react";
import Link from "next/link";

export function AdminMobileNavigation() {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<Menu className={"h-8 w-8"} />
			</DropdownMenuTrigger>

			<DropdownMenuContent>
				<DropdownMenuItem>
					<Link href={"/admin"}>Home</Link>
				</DropdownMenuItem>

				<DropdownMenuItem>
					<Link href={"/admin/accounts"}>Accounts</Link>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
