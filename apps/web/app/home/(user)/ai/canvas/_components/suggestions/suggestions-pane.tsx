'use client';

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import { type SituationImprovement } from '@kit/ai-gateway/src/configs/use-cases/situation-improvements/types';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Spinner } from '@kit/ui/spinner';

import { generateSituationImprovementsAction } from '../../actions/generate-situation-improvements';
import { ImprovementCard } from './improvement-card';

interface SuggestionsPaneProps {
  content: string;
  onAcceptImprovement: (improvement: {
    summaryPoint: string;
    supportingPoints: string[];
  }) => void;
}

export function SuggestionsPane({
  content,
  onAcceptImprovement,
}: SuggestionsPaneProps) {
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());

  const { mutate, isPending, data, error } = useMutation({
    mutationFn: () => generateSituationImprovementsAction({ content }),
    onSuccess: () => {
      // Reset accepted improvements when generating new ones
      setAcceptedIds(new Set());
    },
  });

  const handleGenerateImprovements = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleAcceptImprovement = useCallback(
    (improvement: {
      id: string;
      summaryPoint: string;
      supportingPoints: string[];
    }) => {
      setAcceptedIds((prev) => new Set([...prev, improvement.id]));
      onAcceptImprovement({
        summaryPoint: improvement.summaryPoint,
        supportingPoints: improvement.supportingPoints,
      });
    },
    [onAcceptImprovement],
  );

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI Suggestions</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerateImprovements}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Generating suggestions...
              </>
            ) : (
              'Generate Suggestions'
            )}
          </Button>
        </CardContent>
      </Card>

      {(error instanceof Error || data?.success === false) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : (data?.error ?? 'An error occurred')}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-auto">
        {data?.success &&
          data.data?.improvements?.map((improvement) => (
            <ImprovementCard
              key={improvement.id}
              improvement={improvement}
              isAccepted={acceptedIds.has(improvement.id)}
              onAccept={handleAcceptImprovement}
            />
          ))}
      </div>
    </div>
  );
}
