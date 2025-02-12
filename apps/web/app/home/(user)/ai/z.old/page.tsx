'use client';

import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Check, ChevronsUpDown, Maximize2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@kit/ui/popover';
import { Spinner } from '@kit/ui/spinner';
import { cn } from '@kit/ui/utils';

import { SetupFormModal } from './_components/SetupFormModal';
import { type CanvasState } from './canvas/types';
import { useOutlines } from './hooks/use-outlines';
import { SetupFormProvider } from './setup/_components/SetupFormContext';
import { ErrorProvider } from './setup/context/error/ErrorContext';

export default function AiHomePage() {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [generateValue, setGenerateValue] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get outlines data
  const { outlines, isLoading } = useOutlines();

  const handleCreatePresentation = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleEditPresentation = useCallback(
    (id: string) => {
      setEditValue(id);
      setOpenEdit(false);
      router.push(`/home/ai/canvas-next/${id}`);
    },
    [router],
  );

  const handleGeneratePresentation = useCallback(
    (id: string) => {
      setGenerateValue(id);
      setOpenGenerate(false);
      router.push(`/home/ai/generator?id=${id}`);
    },
    [router],
  );

  const selectedEditTitle = outlines?.find(
    (p: CanvasState) => p.id === editValue,
  )?.title;
  const selectedGenerateTitle = outlines?.find(
    (p: CanvasState) => p.id === generateValue,
  )?.title;

  return (
    <div className="flex min-h-screen flex-col">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => console.log('Fullscreen toggle clicked')}
      >
        <Maximize2 className="h-6 w-6" />
        <span className="sr-only">Toggle fullscreen</span>
      </Button>

      <main className="flex flex-grow flex-col items-center justify-center p-4">
        <div className="mb-8 [&>svg]:h-[100px] [&>svg]:w-[200px]">
          <svg
            className="fill-[#24a9e0] dark:fill-white"
            viewBox="0 0 1216 1216"
            version="1.0"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <g transform="translate(0.000000,1216.000000) scale(0.100000,-0.100000)">
              <path d="M10 7082 l0 -3628 994 0 c547 1 998 4 1002 9 4 4 8 229 8 500 l1 492 -502 0 -501 -1 0 2627 0 2627 4071 -2 4072 -1 0 -500 0 -499 493 -1 c272 0 497 2 501 5 4 3 7 454 7 1003 l0 997 -5073 0 -5073 0 0 -3628z" />
              <path d="M2019 8706 c-1 -1 -3 -954 -4 -2119 -1 -1480 2 -2120 9 -2125 6 -4 232 -7 501 -7 l490 -1 0 -489 c0 -270 3 -495 7 -501 5 -7 1086 -10 3570 -10 l3563 1 0 2125 0 2125 -492 0 c-270 0 -495 4 -500 8 -4 5 -9 228 -9 495 -1 268 -2 489 -3 492 -1 4 -7121 9 -7132 6z m7136 -2624 c0 -1434 -2 -1623 -15 -1626 -8 -2 -1390 -3 -3070 -2 l-3055 1 -1 1620 c0 891 1 1622 2 1625 1 3 1383 5 3071 5 l3068 0 0 -1623z" />
              <path d="M10159 8706 c-1 -1 -2 -223 -3 -494 0 -320 3 -496 9 -500 6 -4 228 -7 495 -8 267 -1 488 -2 491 -3 3 0 6 -1182 6 -2625 l0 -2624 -4071 2 -4071 1 0 500 0 500 -500 0 -501 0 0 -1003 0 -1002 5073 0 5073 0 0 3628 0 3628 -1000 0 c-550 0 -1000 0 -1001 0z" />
            </g>
          </svg>
        </div>

        <h1 className="mb-12 text-3xl font-bold">
          What would you like to write today?
        </h1>

        <div className="grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center">
            <Button
              variant="secondary"
              size="lg"
              className="mb-4 w-full py-8 text-lg"
              onClick={handleCreatePresentation}
            >
              Build New Presentation
            </Button>
            <p className="text-muted-foreground text-sm">
              Start by assembling the building blocks of a presentation
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Popover open={openEdit} onOpenChange={setOpenEdit}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  role="combobox"
                  aria-expanded={openEdit}
                  className="mb-4 w-full justify-between py-8 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner className="h-4 w-4" />
                  ) : selectedEditTitle ? (
                    selectedEditTitle
                  ) : (
                    'Edit Existing Presentation'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {!outlines?.length ? (
                    <div className="text-muted-foreground p-2 text-sm">
                      No presentations yet
                    </div>
                  ) : (
                    outlines.map((presentation: CanvasState) => (
                      <Button
                        key={presentation.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleEditPresentation(presentation.id)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            editValue === presentation.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {presentation.title}
                      </Button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-muted-foreground text-sm">
              Use our Canvas editor to refine your outline
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <Popover open={openGenerate} onOpenChange={setOpenGenerate}>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="lg"
                  role="combobox"
                  aria-expanded={openGenerate}
                  className="mb-4 w-full justify-between py-8 text-lg"
                  disabled
                >
                  {selectedGenerateTitle || 'Generate PowerPoint'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {!outlines?.length ? (
                    <div className="text-muted-foreground p-2 text-sm">
                      No presentations yet
                    </div>
                  ) : (
                    outlines.map((presentation: CanvasState) => (
                      <Button
                        key={presentation.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() =>
                          handleGeneratePresentation(presentation.id)
                        }
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            generateValue === presentation.id
                              ? 'opacity-100'
                              : 'opacity-0',
                          )}
                        />
                        {presentation.title}
                      </Button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <p className="text-muted-foreground text-sm">
              Transform your outline into a PowerPoint file (Coming Soon)
            </p>
          </div>
        </div>
      </main>

      <ErrorProvider>
        <SetupFormProvider>
          <SetupFormModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </SetupFormProvider>
      </ErrorProvider>
    </div>
  );
}
