"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@kit/ui/alert";
import { Button } from "@kit/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@kit/ui/card";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@kit/ui/form";
import { PageBody, PageHeader } from "@kit/ui/page";
import { Switch } from "@kit/ui/switch";
import { CheckCircle, Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import {
	AdminSettingsSchema,
	type AdminSettingsInput,
} from "../_lib/schemas/settings.schema";
import { updateConfigAction } from "../_lib/server/update-config-server-actions";

export function AdminSettingsPageClient() {
	const [isPending, startTransition] = useTransition();
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const form = useForm<AdminSettingsInput>({
		resolver: zodResolver(AdminSettingsSchema),
		defaultValues: {
			enableCourses: false,
		},
	});

	// Load current config on mount
	useEffect(() => {
		async function loadConfig() {
			try {
				const response = await fetch("/api/admin/config");
				if (response.ok) {
					const data = await response.json();
					form.reset({
						enableCourses: data.enableCourses ?? false,
					});
				}
			} catch {
				// Silently fail - will use default values
			} finally {
				setIsLoading(false);
			}
		}
		loadConfig();
	}, [form]);

	const onSubmit = (data: AdminSettingsInput) => {
		setSuccessMessage(null);
		setErrorMessage(null);

		startTransition(async () => {
			const result = await updateConfigAction(data);

			if (result.success) {
				setSuccessMessage("Settings saved successfully!");
				setTimeout(() => setSuccessMessage(null), 3000);
			} else {
				setErrorMessage(result.error ?? "Failed to save settings");
			}
		});
	};

	return (
		<>
			<PageHeader
				title="Settings"
				description="Manage system-wide feature flags and configuration."
			/>

			<PageBody>
				<div className="max-w-2xl space-y-6">
					{successMessage && (
						<Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
							<CheckCircle className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-800 dark:text-green-200">
								{successMessage}
							</AlertDescription>
						</Alert>
					)}

					{errorMessage && (
						<Alert variant="destructive">
							<AlertDescription>{errorMessage}</AlertDescription>
						</Alert>
					)}

					<Card>
						<CardHeader>
							<CardTitle>Feature Flags</CardTitle>
							<CardDescription>
								Control which features are visible to users. Changes take effect
								immediately.
							</CardDescription>
						</CardHeader>
						<CardContent>
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
								</div>
							) : (
								<Form {...form}>
									<form
										onSubmit={form.handleSubmit(onSubmit)}
										className="space-y-6"
									>
										<FormField
											control={form.control}
											name="enableCourses"
											render={({ field }) => (
												<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
													<div className="space-y-0.5">
														<FormLabel className="text-base">
															Enable Courses
														</FormLabel>
														<FormDescription>
															Show Course and Assessment navigation items and
															pages. When disabled, users are redirected to the
															dashboard if they try to access course pages
															directly.
														</FormDescription>
													</div>
													<FormControl>
														<Switch
															checked={field.value}
															onCheckedChange={field.onChange}
														/>
													</FormControl>
												</FormItem>
											)}
										/>

										<Button type="submit" disabled={isPending}>
											{isPending && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Save Changes
										</Button>
									</form>
								</Form>
							)}
						</CardContent>
					</Card>
				</div>
			</PageBody>
		</>
	);
}
