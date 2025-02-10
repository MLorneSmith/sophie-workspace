'use client';

import Link from 'next/link';

import { ColumnDef } from '@tanstack/react-table';

import { Tables } from '@kit/supabase/database';
import { Avatar, AvatarFallback, AvatarImage } from '@kit/ui/avatar';
import { Button } from '@kit/ui/button';
import { DataTable } from '@kit/ui/enhanced-data-table';

import { Rating } from './rating';
import { TestimonialsStatus } from './testimonials-status';

export function TestimonialsTable(props: {
  data: Tables<'testimonials'>[];
  pageSize: number;
  pageIndex: number;
  pageCount: number;
}) {
  return <DataTable {...props} columns={getColumns()} />;
}

function getColumns(): ColumnDef<Tables<'testimonials'>>[] {
  return [
    {
      header: 'Customer Name',
      accessorKey: 'customer_name',
      cell: ({ row }) => {
        return (
          <div className={'flex items-center space-x-2'}>
            <Avatar>
              <AvatarImage src={row.original.customer_avatar_url!} />
              <AvatarFallback>
                {row.original.customer_name[0]}
                {row.original.customer_name[1]}
              </AvatarFallback>
            </Avatar>

            <Link
              className={'hover:underline'}
              href={`testimonials/${row.original.id}`}
            >
              {row.original.customer_name}
            </Link>
          </div>
        );
      },
    },
    {
      header: 'Rating',
      cell: ({ row }) => {
        return <Rating rating={row.original.rating} />;
      },
    },
    {
      header: 'Status',
      cell: (row) => {
        return <TestimonialsStatus status={row.row.original.status} />;
      },
    },
    {
      header: 'Created At',
      cell: (row) => {
        return new Date(row.row.original.created_at).toLocaleString();
      },
    },
    {
      header: '',
      id: 'actions',
      cell: (row) => {
        return (
          <div className={'flex justify-end'}>
            <Button asChild variant={'outline'}>
              <Link href={`testimonials/${row.row.original.id}`}>
                View Testimonial
              </Link>
            </Button>
          </div>
        );
      },
    },
  ];
}
