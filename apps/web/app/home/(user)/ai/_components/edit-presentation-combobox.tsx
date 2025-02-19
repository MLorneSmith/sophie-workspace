'use client';

import { useRouter } from 'next/navigation';

import { useBuildingBlocksTitles } from '../_lib/hooks/use-building-blocks-titles';
import { Combobox } from './combobox';

export function EditPresentationCombobox() {
  const router = useRouter();
  const { data, isLoading } = useBuildingBlocksTitles();

  const presentationOptions =
    data?.data?.map((item: { id: string; title: string }) => ({
      label: item.title,
      value: item.id,
    })) ?? [];

  return (
    <Combobox
      options={presentationOptions}
      placeholder="Select a presentation"
      isLoading={isLoading}
      onSelect={(value) => router.push(`/home/ai/canvas?id=${value}`)}
    />
  );
}
