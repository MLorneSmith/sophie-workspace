'use client';

import { CheckCircle, PauseIcon, XCircle } from 'lucide-react';

import { Tables } from '@kit/supabase/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { updateTestimonialStatusAction } from '../server/server-actions';

export function UpdateTestimonialStatusSelect(props: {
  status: Tables<'testimonials'>['status'];
  id: string;
}) {
  const onStatusChange = async (status: Tables<'testimonials'>['status']) => {
    await updateTestimonialStatusAction({
      id: props.id,
      status,
    });
  };

  return (
    <Select
      value={props.status ?? ''}
      onValueChange={(value) => {
        return onStatusChange(value as Tables<'testimonials'>['status']);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={'Update Status'} />
      </SelectTrigger>

      <SelectContent>
        <SelectItem value={'approved'}>
          <span className={'flex items-center space-x-1'}>
            <CheckCircle className={'h-4 text-green-500'} />
            <span>Approved</span>
          </span>
        </SelectItem>

        <SelectItem value={'pending'}>
          <span className={'flex items-center space-x-1'}>
            <PauseIcon className={'h-4 text-orange-500'} />
            <span>Pending</span>
          </span>
        </SelectItem>

        <SelectItem value={'rejected'}>
          <span className={'flex items-center space-x-1'}>
            <XCircle className={'text-destructive h-4'} />
            <span>Rejected</span>
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
