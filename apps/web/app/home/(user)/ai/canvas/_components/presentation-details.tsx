'use client';

import { useSearchParams } from 'next/navigation';

import { useBuildingBlocksPresentation } from '../_lib/hooks/use-building-blocks-presentation';

export function PresentationDetails() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { data, isLoading } = useBuildingBlocksPresentation(id);

  if (isLoading) return <div>Loading...</div>;
  if (!data?.data) return <div>No presentation found</div>;

  const { title, audience } = data.data;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div>
        <span className="font-medium">Audience:</span> {audience}
      </div>
    </div>
  );
}
