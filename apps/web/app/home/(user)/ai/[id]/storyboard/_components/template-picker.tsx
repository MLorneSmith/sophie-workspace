"use client";

import { CheckIcon } from "@radix-ui/react-icons";
import {
	RadioGroup,
	RadioGroupItem,
	RadioGroupItemLabel,
} from "@kit/ui/radio-group";
import { cn } from "@kit/ui/utils";

import {
	DEFAULT_TEMPLATE_ID,
	PRESENTATION_TEMPLATES,
	getTemplateById,
} from "../../../_lib/config/presentation-templates.config";
import type { TemplateId } from "../../../_lib/schemas/presentation-template.schema";

import { TemplateColorSwatches } from "./template-color-swatches";

interface TemplatePickerProps {
	/** Current selected template ID */
	value?: string;
	/** Callback when template selection changes */
	onChange?: (templateId: TemplateId) => void;
	/** Additional CSS classes */
	className?: string;
}

/**
 * Template picker component that displays 5 curated templates as selectable cards
 */
export function TemplatePicker({
	value,
	onChange,
	className,
}: TemplatePickerProps) {
	const selectedId = value ?? DEFAULT_TEMPLATE_ID;

	const handleValueChange = (newValue: string) => {
		if (onChange) {
			onChange(newValue as TemplateId);
		}
	};

	return (
		<div className={cn("space-y-3", className)}>
			<div>
				<h3 className="text-lg font-semibold">Choose a template</h3>
				<p className="text-muted-foreground text-sm">
					Select a visual theme for your presentation
				</p>
			</div>

			<RadioGroup
				value={selectedId}
				onValueChange={handleValueChange}
				className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
			>
				{PRESENTATION_TEMPLATES.map((template) => {
					const isSelected = selectedId === template.id;
					const templateData = getTemplateById(template.id);

					return (
						<RadioGroupItemLabel
							key={template.id}
							selected={isSelected}
							className={cn(
								"relative cursor-pointer rounded-lg border-2 border-border p-4 transition-all",
								"hover:border-primary/50 hover:bg-muted/50",
								isSelected && "border-primary bg-primary/5",
							)}
						>
							<RadioGroupItem
								value={template.id}
								id={template.id}
								className="sr-only"
							/>

							<div className="space-y-3">
								{/* Template preview placeholder */}
								<div className="aspect-video w-full overflow-hidden rounded-md bg-muted">
									<div
										className="h-full w-full"
										style={{
											background: templateData
												? `linear-gradient(135deg, ${templateData.colors[0]?.startsWith("#") ? templateData.colors[0] : `#${templateData.colors[0]}`} 0%, ${templateData.colors[3]?.startsWith("#") ? templateData.colors[3] : `#${templateData.colors[3]}`} 100%)`
												: "#e5e7eb",
										}}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<span className="font-medium">{template.name}</span>
										{isSelected && (
											<CheckIcon className="h-4 w-4 text-primary" />
										)}
									</div>

									<p className="text-muted-foreground text-xs">
										{template.description}
									</p>

									<TemplateColorSwatches
										colors={template.colors}
										className="pt-1"
									/>
								</div>
							</div>
						</RadioGroupItemLabel>
					);
				})}
			</RadioGroup>
		</div>
	);
}
