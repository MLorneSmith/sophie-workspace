'use client';

import { useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { presentationTypes } from '../_config/formContent';

interface PresentationTypeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function PresentationTypeSelect({
  value,
  onChange,
  disabled,
  error,
}: PresentationTypeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleValueChange = (newValue: string) => {
    onChange(newValue);
    // Don't automatically close the select
    setIsOpen(true);
  };

  return (
    <div>
      <Select
        value={value}
        onValueChange={handleValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={error ? 'border-red-500' : ''}>
          <SelectValue placeholder="Select a presentation type" />
        </SelectTrigger>
        <SelectContent>
          {presentationTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="mt-2 text-sm text-gray-500">
        Click Next to continue after making your selection
      </p>
    </div>
  );
}
