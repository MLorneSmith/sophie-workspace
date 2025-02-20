'use client';

import { useCallback } from 'react';

import { CheckCircle } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@kit/ui/card';

interface Improvement {
  id: string;
  headline: string;
  rationale: string;
  summaryPoint: string;
  supportingPoints: string[];
}

export interface ImprovementCardProps {
  improvement: Improvement;
  isAccepted: boolean;
  onAccept: (improvement: Improvement) => void;
}

export function ImprovementCard({
  improvement,
  isAccepted,
  onAccept,
}: ImprovementCardProps) {
  const handleAccept = useCallback(() => {
    onAccept(improvement);
  }, [improvement, onAccept]);

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{improvement.headline}</h3>
        <p className="text-muted-foreground text-sm">{improvement.rationale}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <h4 className="font-medium">Suggested Content:</h4>
          <p className="mt-1">{improvement.summaryPoint}</p>
        </div>
        <div>
          <h4 className="font-medium">Supporting Points:</h4>
          <ul className="mt-1 list-inside list-disc">
            {improvement.supportingPoints.map((point, index) => (
              <li key={index} className="text-sm">
                {point}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleAccept}
          disabled={isAccepted}
          variant={isAccepted ? 'secondary' : 'default'}
          className="w-full"
        >
          {isAccepted ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Applied
            </>
          ) : (
            'Apply Suggestion'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
