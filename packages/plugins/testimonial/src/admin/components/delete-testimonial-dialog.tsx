'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';

import { deleteTestimonialAction } from '../server/server-actions';

export function DeleteTestimonialDialog(
  props: React.PropsWithChildren<{
    id: string;
  }>,
) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to delete this testimonial?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form
          onSubmit={() =>
            deleteTestimonialAction({
              id: props.id,
            })
          }
        >
          <AlertDialogFooter>
            <AlertDialogCancel type={'button'}>Cancel</AlertDialogCancel>

            <Button variant={'destructive'}>Delete Testimonial</Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
