'use client';

import { useState } from 'react';

import { Star } from 'lucide-react';

import { cn } from '@kit/ui/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
}

export function StarRating({ rating, onRatingChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hoverRating || rating);

        return (
          <Star
            className={cn('h-6 w-6 cursor-pointer', {
              ['border-transparent fill-yellow-500']: filled,
            })}
            key={star}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        );
      })}
    </div>
  );
}
