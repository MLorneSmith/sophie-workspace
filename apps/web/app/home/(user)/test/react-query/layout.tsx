import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

import { prefetchAccounts } from './actions';

export default async function ReactQueryTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = await prefetchAccounts();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
