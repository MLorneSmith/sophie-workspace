"use client";

import { Button } from "@kit/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@kit/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@kit/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { cn } from "~/lib/utils";

interface ComboboxProps {
	options: { label: string; value: string }[];
	placeholder?: string;
	onSelect?: (value: string) => void;
	isLoading?: boolean;
}

export function Combobox({
	options,
	placeholder,
	onSelect,
	isLoading,
}: ComboboxProps) {
	const [open, setOpen] = React.useState(false);
	const [value, setValue] = React.useState("");

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					// biome-ignore lint/a11y/useSemanticElements: Custom combobox implementation following WAI-ARIA pattern
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={isLoading}
				>
					{isLoading
						? "Loading..."
						: value
							? options.find((option) => option.value === value)?.label
							: placeholder || "Select option..."}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0">
				<Command>
					<CommandInput placeholder="Search options..." />
					<CommandList>
						<CommandEmpty>
							{isLoading ? "Loading options..." : "No option found."}
						</CommandEmpty>
						<CommandGroup>
							{isLoading ? (
								<CommandItem disabled>Loading...</CommandItem>
							) : (
								options.map((option) => (
									<CommandItem
										key={option.value}
										onSelect={() => {
											const newValue =
												option.value === value ? "" : option.value;
											setValue(newValue);
											setOpen(false);
											if (onSelect && newValue) {
												onSelect(newValue);
											}
										}}
									>
										<Check
											className={cn(
												"mr-2 h-4 w-4",
												value === option.value ? "opacity-100" : "opacity-0",
											)}
										/>
										{option.label}
									</CommandItem>
								))
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
