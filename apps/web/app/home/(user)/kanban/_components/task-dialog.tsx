"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@kit/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@kit/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@kit/ui/form";
import { Input } from "@kit/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@kit/ui/select";
import { Textarea } from "@kit/ui/textarea";
import { Trans } from "@kit/ui/trans";
import { cn } from "@kit/ui/utils";
import { ImageIcon, Loader2Icon, TrashIcon } from "lucide-react";
import Image from "next/image";
import { useCallback, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { _useCreateTask, _useUpdateTask } from "../_lib/hooks/use-tasks";
import type { Task } from "../_lib/schema/task.schema";
import {
	CreateTaskSchema,
	TaskPriorityEnum,
	TaskStatusEnum,
} from "../_lib/schema/task.schema";

interface TaskDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: Task;
}

export function TaskDialog({ open, onOpenChange, task }: TaskDialogProps) {
	const { t } = useTranslation();
	const createTask = _useCreateTask();
	const updateTask = _useUpdateTask();
	const [imagePreview, setImagePreview] = useState<string | null>(
		task?.image_url ?? null,
	);
	const imageUploadId = useId();

	const form = useForm({
		resolver: zodResolver(CreateTaskSchema),
		defaultValues: {
			title: task?.title ?? "",
			description: task?.description ?? "",
			status: task?.status ?? "do",
			priority: task?.priority ?? "medium",
			subtasks: task?.subtasks ?? [],
			image: undefined,
			image_url: task?.image_url,
		},
	});

	const onSubmit = useCallback(
		async (data: z.infer<typeof CreateTaskSchema>) => {
			try {
				if (task) {
					await updateTask.mutateAsync({ ...data, id: task.id });
				} else {
					await createTask.mutateAsync(data);
				}
				form.reset();
				setImagePreview(null);
				onOpenChange(false);
			} catch (_error) {
				// TODO: Async logger needed
				// TODO: Fix logger call - was: error
			}
		},
		[createTask, updateTask, task, form, onOpenChange],
	);

	const handleImageChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Check file size (1MB)
			if (file.size > 1024 * 1024) {
				form.setError("image", {
					message: "Image must be less than 1MB",
				});
				return;
			}

			// Create preview
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result as string);
			};
			reader.readAsDataURL(file);

			form.setValue("image", file);
		},
		[form],
	);

	const handleRemoveImage = useCallback(() => {
		form.setValue("image", undefined);
		form.setValue("image_url", undefined);
		setImagePreview(null);
	}, [form]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{task ? (
							<Trans i18nKey="kanban:task.edit" />
						) : (
							<Trans i18nKey="kanban:task.create" />
						)}
					</DialogTitle>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<Trans i18nKey="kanban:task.form.title" />
									</FormLabel>
									<FormControl>
										<Input
											placeholder={t("kanban:task.form.titlePlaceholder")}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<Trans i18nKey="kanban:task.form.description" />
									</FormLabel>
									<FormControl>
										<Textarea
											placeholder={t("kanban:task.form.descriptionPlaceholder")}
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="status"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<Trans i18nKey="kanban:task.form.status" />
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{TaskStatusEnum.options.map((status) => (
													<SelectItem key={status} value={status}>
														<Trans i18nKey={`kanban:task.status.${status}`} />
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="priority"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											<Trans i18nKey="kanban:task.form.priority" />
										</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{TaskPriorityEnum.options.map((priority) => (
													<SelectItem
														key={priority}
														value={priority}
														className={cn(
															priority === "high" && "text-destructive",
															priority === "medium" && "text-warning",
															priority === "low" && "text-success",
														)}
													>
														<Trans
															i18nKey={`kanban:task.priority.${priority}`}
														/>
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="image"
							render={({
								field: { value: _value, onChange: _onChange, ...field },
							}) => (
								<FormItem>
									<FormLabel>
										<Trans i18nKey="kanban:task.form.image" />
									</FormLabel>
									<FormControl>
										<div className="space-y-2">
											{imagePreview ? (
												<div className="relative">
													<Image
														src={imagePreview}
														alt="Task attachment preview"
														className="h-40 w-full rounded-lg object-cover"
														width={400}
														height={160}
													/>
													<Button
														type="button"
														variant="destructive"
														size="icon"
														className="absolute top-2 right-2"
														onClick={handleRemoveImage}
													>
														<TrashIcon className="h-4 w-4" />
													</Button>
												</div>
											) : (
												<label
													htmlFor="image-upload"
													className={cn(
														"bg-muted hover:bg-muted/80 flex h-40 cursor-pointer items-center justify-center rounded-lg border border-dashed transition-colors",
														form.formState.errors.image && "border-destructive",
													)}
												>
													<div className="text-muted-foreground flex flex-col items-center gap-2">
														<ImageIcon className="h-8 w-8" />
														<span>
															<Trans i18nKey="kanban:task.form.imagePlaceholder" />
														</span>
													</div>
													<input
														id={imageUploadId}
														type="file"
														accept="image/*"
														className="hidden"
														onChange={handleImageChange}
														{...field}
													/>
												</label>
											)}
											<FormMessage />
										</div>
									</FormControl>
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="subtasks"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										<Trans i18nKey="kanban:task.form.subtasks" />
									</FormLabel>
									<FormControl>
										<div className="space-y-2">
											{field.value?.map((subtask, index) => (
												<div
													key={`subtask-${index}-${subtask.title || "empty"}`}
													className="flex items-center gap-2"
												>
													<Input
														placeholder={t(
															"kanban:task.form.subtaskPlaceholder",
														)}
														value={subtask.title}
														onChange={(e) => {
															const newSubtasks = [...(field.value || [])];
															newSubtasks[index] = {
																...newSubtasks[index],
																title: e.target.value,
																is_completed:
																	newSubtasks[index]?.is_completed ?? false,
															};
															field.onChange(newSubtasks);
														}}
													/>
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => {
															const newSubtasks = [...(field.value || [])];
															newSubtasks.splice(index, 1);
															field.onChange(newSubtasks);
														}}
													>
														<TrashIcon className="h-4 w-4" />
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												className="w-full"
												onClick={() => {
													field.onChange([
														...(field.value || []),
														{ title: "", is_completed: false } as const,
													]);
												}}
											>
												<Trans i18nKey="kanban:task.form.addSubtask" />
											</Button>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								<Trans i18nKey="common:cancel" />
							</Button>
							<Button
								type="submit"
								disabled={createTask.isPending || updateTask.isPending}
							>
								{(createTask.isPending || updateTask.isPending) && (
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
								)}
								{task ? (
									<Trans i18nKey="kanban:task.actions.update" />
								) : (
									<Trans i18nKey="kanban:task.actions.create" />
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
