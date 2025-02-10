import { use } from 'react';

import { ServerDataLoader } from '@makerkit/data-loader-supabase-nextjs';
import { PlusCircleIcon } from 'lucide-react';

import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';
import { Button } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';

import { AddTestimonialDialog } from '../components/add-testimonial-dialog';
import { TestimonialsTable } from '../components/testimonials-table';

interface TestimonialsPageSearchParams {
  page?: number;
}

export function TestimonialsPage(props: {
  searchParams: Promise<TestimonialsPageSearchParams>;
}) {
  const adminClient = getSupabaseServerAdminClient();

  const searchParams = use(props.searchParams);
  const page = Number(searchParams.page) || 1;

  return (
    <div className={'flex flex-1 flex-col'}>
      <PageHeader
        title={'Testimonials'}
        description={'View and manage your testimonials'}
      >
        <AddTestimonialDialog>
          <Button>
            <PlusCircleIcon className={'mr-2 h-4'} />
            <span>Add Testimonial</span>
          </Button>
        </AddTestimonialDialog>
      </PageHeader>

      <PageBody>
        <div className={'flex flex-col space-y-4'}>
          <ServerDataLoader
            client={adminClient}
            table={'testimonials'}
            page={page}
            sort={{
              created_at: 'desc',
            }}
          >
            {({ data, page, pageSize, pageCount }) => {
              return (
                <TestimonialsTable
                  data={data}
                  pageSize={pageSize}
                  pageIndex={page - 1}
                  pageCount={pageCount}
                />
              );
            }}
          </ServerDataLoader>
        </div>
      </PageBody>
    </div>
  );
}
