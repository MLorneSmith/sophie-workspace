'use client';

import { useCallback } from 'react';

import { useCostTracking } from '../contexts/cost-tracking-context';

// Generic type for the action function
type ActionFunction<T, R> = (data: T) => Promise<R>;

export function useActionWithCost<
  T extends Record<string, any>,
  R extends { success: boolean; metadata?: { cost?: number } },
>(action: ActionFunction<T, R>) {
  const { addCost, sessionId } = useCostTracking();

  const wrappedAction = useCallback(
    async (data: T) => {
      // Add session ID to the request data
      const dataWithSession = {
        ...data,
        sessionId,
      };

      // Call the original action
      const result = await action(dataWithSession as T);

      // If successful and cost is available, update the cost
      if (result.success && result.metadata?.cost) {
        addCost(result.metadata.cost);
      }

      return result;
    },
    [action, addCost, sessionId],
  );

  return wrappedAction;
}
