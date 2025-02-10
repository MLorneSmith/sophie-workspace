'use client';

import { useState } from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@kit/ui/alert-dialog';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@kit/ui/form';
import { Input } from '@kit/ui/input';
import {
  MultiStepForm,
  MultiStepFormContextProvider,
  MultiStepFormHeader,
  MultiStepFormStep,
  useMultiStepFormContext,
} from '@kit/ui/multi-step-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Stepper } from '@kit/ui/stepper';
import { Textarea } from '@kit/ui/textarea';

import { StarRating } from '../../components/star-rating';
import { AddManualTestimonialSchema } from '../../schema/add-manual-testimonial.schema';
import { addManualTestimonialAction } from '../server/server-actions';

export function AddTestimonialDialog(props: React.PropsWithChildren) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{props.children}</AlertDialogTrigger>

      <AlertDialogContent className={'flex flex-col space-y-2'}>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Testimonial</AlertDialogTitle>

          <AlertDialogDescription>
            Add a new testimonial to your website.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AddTestimonialForm
          onSubmit={() => {
            setIsOpen(false);
          }}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

function AddTestimonialForm(props: { onSubmit: () => void }) {
  const form = useForm({
    resolver: zodResolver(AddManualTestimonialSchema),
    mode: 'onBlur',
    defaultValues: {
      customer: {
        name: '',
      },
      source: {
        source: '',
      },
      content: {
        text: '',
        rating: 5,
      },
    },
  });

  return (
    <MultiStepForm
      className={'space-y-6 p-0.5'}
      form={form}
      schema={AddManualTestimonialSchema}
      onSubmit={async (data) => {
        await addManualTestimonialAction(data);
        props.onSubmit();
      }}
    >
      <MultiStepFormHeader>
        <MultiStepFormContextProvider>
          {(ctx) => {
            return (
              <Stepper
                variant={'numbers'}
                steps={['Customer', 'Source', 'Content']}
                currentStep={ctx.currentStepIndex}
              />
            );
          }}
        </MultiStepFormContextProvider>
      </MultiStepFormHeader>

      <MultiStepFormStep name={'customer'}>
        <CustomerFormStep />
      </MultiStepFormStep>

      <MultiStepFormStep name={'source'}>
        <SourceFormStep />
      </MultiStepFormStep>

      <MultiStepFormStep name={'content'}>
        <ContentStep />
      </MultiStepFormStep>
    </MultiStepForm>
  );
}

function SourceFormStep() {
  const { form, nextStep, prevStep } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-4'}>
        <FormField
          name={'source.source'}
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Source</FormLabel>

                <FormControl>
                  <Select
                    value={form.getValues(field.name)}
                    onValueChange={(value) => form.setValue(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={'Choose Source'} />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={'Manual'}>Manual</SelectItem>
                      <SelectItem value={'Website'}>Website</SelectItem>
                      <SelectItem value={'Email'}>Email</SelectItem>
                      <SelectItem value={'Phone'}>Twitter/X</SelectItem>
                      <SelectItem value={'Twitter'}>Facebook</SelectItem>
                      <SelectItem value={'Facebook'}>Instagram</SelectItem>
                      <SelectItem value={'Instagram'}>LinkedIn</SelectItem>
                      <SelectItem value={'LinkedIn'}>Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>

                <FormDescription>
                  Where did the testimonial come from?
                </FormDescription>

                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>External Link</FormLabel>

                <FormControl>
                  <Input {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'source.externalLink'}
        />

        <div className={'flex justify-between space-x-2.5'}>
          <div>
            <AlertDialogCancel type={'button'}>Cancel</AlertDialogCancel>
          </div>

          <div className={'flex space-x-2'}>
            <Button variant={'outline'} onClick={prevStep}>
              Back
            </Button>

            <Button onClick={nextStep}>Continue</Button>
          </div>
        </div>
      </div>
    </Form>
  );
}

function ContentStep() {
  const { form, prevStep } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-4'}>
        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Rating</FormLabel>

                <FormControl>
                  <StarRating
                    rating={form.getValues('content.rating')}
                    onRatingChange={(value) => {
                      form.setValue(field.name, value);
                    }}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'content.rating'}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Content</FormLabel>

                <FormControl>
                  <Textarea {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'content.text'}
        />

        <div className={'flex justify-between space-x-2.5'}>
          <AlertDialogCancel type={'button'}>Cancel</AlertDialogCancel>

          <div className={'flex space-x-2'}>
            <Button variant={'outline'} onClick={prevStep}>
              Back
            </Button>

            <Button type={'submit'}>Add Testimonial</Button>
          </div>
        </div>
      </div>
    </Form>
  );
}

function CustomerFormStep() {
  const { form, nextStep } = useMultiStepFormContext();

  return (
    <Form {...form}>
      <div className={'flex flex-col space-y-4'}>
        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Customer Name</FormLabel>

                <FormControl>
                  <Input {...field} />
                </FormControl>

                <FormDescription>
                  Add the name of the customer who gave the testimonial.
                </FormDescription>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'customer.name'}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Customer Company</FormLabel>

                <FormControl>
                  <Input {...field} />
                </FormControl>

                <FormDescription>
                  Add the company name of the customer. This can raise the
                  credibility of the testimonial.
                </FormDescription>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'customer.company'}
        />

        <FormField
          render={({ field }) => {
            return (
              <FormItem>
                <FormLabel>Customer Avatar URL</FormLabel>

                <FormControl>
                  <Input type={'url'} {...field} />
                </FormControl>

                <FormDescription>
                  Enter the URL to the customer&apos;s avatar image.
                </FormDescription>

                <FormMessage />
              </FormItem>
            );
          }}
          name={'customer.avatarUrl'}
        />

        <div className={'flex justify-between space-x-2.5'}>
          <AlertDialogCancel type={'button'}>Cancel</AlertDialogCancel>

          <Button onClick={nextStep}>Continue</Button>
        </div>
      </div>
    </Form>
  );
}
