'use client';

import { useCallback } from 'react';

import { Check, X } from 'lucide-react';

import { type BaseImprovement } from '@kit/ai-gateway/src/prompts/types/improvements';
import { Button } from '@kit/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@kit/ui/card';

export interface ImprovementCardProps {
  improvement: BaseImprovement;
  isAccepted: boolean;
  onAccept: (improvement: BaseImprovement) => void;
  onReject?: (improvement: BaseImprovement) => void;
}

export function ImprovementCard({
  improvement,
  isAccepted,
  onAccept,
  onReject,
}: ImprovementCardProps) {
  const handleAccept = useCallback(() => {
    onAccept(improvement);
  }, [improvement, onAccept]);

  const handleReject = useCallback(() => {
    onReject?.(improvement);
  }, [improvement, onReject]);

  return (
    <Card className="bg-card/50">
      <CardHeader className="pb-2">
        <div className="border-primary border-l-2 pl-3">
          <h3 className="text-base font-medium">
            {improvement.improvementHeadline}
          </h3>
          <p className="text-muted-foreground text-xs">
            {improvement.improvementDescription}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <div className="bg-muted/30 rounded-md p-3">
          <p className="text-sm font-medium">
            {improvement.implementedSummaryPoint}
          </p>
          <ul className="mt-2 space-y-1">
            {improvement.implementedSupportingPoints.map((point, index) => (
              <li key={index} className="text-muted-foreground text-xs">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-1 pt-0">
        <Button
          onClick={handleReject}
          variant="ghost"
          size="icon"
          className="h-6 w-6"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          onClick={handleAccept}
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          disabled={isAccepted}
        >
          <Check className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
