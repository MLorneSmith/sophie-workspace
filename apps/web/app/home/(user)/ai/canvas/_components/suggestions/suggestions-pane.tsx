'use client';

import { useCallback, useState } from 'react';

import { useMutation } from '@tanstack/react-query';

import {
  type BaseImprovement,
  type ImprovementType,
} from '@kit/ai-gateway/src/prompts/types/improvements';
import { Button } from '@kit/ui/button';
import { Spinner } from '@kit/ui/spinner';

import { generateImprovementsAction } from '../../actions/generate-improvements';
import { ImprovementCard } from './improvement-card';

interface SuggestionsPaneProps {
  content: string;
  submissionId: string;
  type: ImprovementType;
  onAcceptImprovement: (improvement: BaseImprovement) => void;
}

export function SuggestionsPane({
  content,
  submissionId,
  type,
  onAcceptImprovement,
}: SuggestionsPaneProps) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const { mutate, isPending, data, error } = useMutation({
    mutationFn: () =>
      generateImprovementsAction({ content, submissionId, type }),
    onSuccess: (data) => {
      if (data?.success && data.data?.improvements) {
        // Set all new improvements as visible
        setVisibleIds(
          new Set(data.data.improvements.map((imp: BaseImprovement) => imp.id)),
        );
      }
    },
  });

  const handleGenerateImprovements = useCallback(() => {
    mutate();
  }, [mutate]);

  const handleAcceptImprovement = useCallback(
    (improvement: BaseImprovement) => {
      // Remove the card when accepted
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(improvement.id);
        return next;
      });
      onAcceptImprovement(improvement);
    },
    [onAcceptImprovement],
  );

  const handleRejectImprovement = useCallback(
    (improvement: BaseImprovement) => {
      // Remove the card when rejected
      setVisibleIds((prev) => {
        const next = new Set(prev);
        next.delete(improvement.id);
        return next;
      });
    },
    [],
  );

  return (
    <div className="bg-background/50 relative flex h-full flex-col rounded-md border">
      {(error instanceof Error || data?.success === false) && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {error instanceof Error
            ? error.message
            : (data?.error ?? 'An error occurred')}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-auto p-4">
        {data?.success &&
          data.data?.improvements
            ?.filter((improvement: BaseImprovement) =>
              visibleIds.has(improvement.id),
            )
            .map((improvement: BaseImprovement) => (
              <ImprovementCard
                key={improvement.id}
                improvement={improvement}
                isAccepted={false}
                onAccept={handleAcceptImprovement}
                onReject={handleRejectImprovement}
              />
            ))}
      </div>

      <div className="bg-muted/5 border-t p-4">
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
      </div>
    </div>
  );
}
