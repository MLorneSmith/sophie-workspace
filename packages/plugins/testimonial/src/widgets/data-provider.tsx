import { useQuery } from '@tanstack/react-query';

import { Tables } from '@kit/supabase/database';
import { Spinner } from '@kit/ui/spinner';

export function TestimonialsDataProvider(props: {
  children: (data: {
    data: Tables<'testimonials'>[];
    count: number;
  }) => React.ReactNode;
  limit?: number;
}) {
  const query = useFetchTestimonials({
    limit: props.limit,
  });

  if (query.isError) {
    return null;
  }

  if (query.isPending) {
    return (
      <div className={'flex flex-col items-center space-y-8'}>
        <p>Loading testimonials...</p>

        <Spinner />
      </div>
    );
  }

  return props.children(query.data);
}

function useFetchTestimonials(props: { limit?: number }) {
  const queryFn = async () => {
    const searchParams = new URLSearchParams({
      limit: props.limit?.toString() ?? '',
    });

    const url = `/api/testimonials?${searchParams.toString()}`;

    return fetch(url).then(
      (res) =>
        res.json() as Promise<{
          data: Tables<'testimonials'>[];
          count: number;
        }>,
    );
  };

  return useQuery({
    queryFn,
    queryKey: ['testimonials'],
  });
}
