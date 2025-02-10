import { Tables } from '@kit/supabase/database';
import { Badge } from '@kit/ui/badge';

export function TestimonialsStatus(props: {
  status: Tables<'testimonials'>['status'];
}) {
  switch (props.status) {
    case 'approved':
      return <Badge variant={'success'}>Approved</Badge>;

    case 'pending':
      return <Badge variant={'warning'}>Pending</Badge>;

    case 'rejected':
      return <Badge variant={'destructive'}>Rejected</Badge>;
  }
}
