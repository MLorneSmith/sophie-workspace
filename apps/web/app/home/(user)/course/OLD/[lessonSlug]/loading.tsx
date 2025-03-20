export default function LessonLoadingPage() {
  return (
    <div className="flex-grow">
      <div className="container mx-auto sm:max-w-none sm:p-0">
        <div className="container mx-auto flex max-w-3xl flex-col space-y-6 py-8">
          <div className="animate-pulse">
            <div className="mb-8">
              <div className="h-8 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-4 flex space-x-4">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-4 w-full rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-700" />
              <div className="h-4 w-4/6 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
            {/* Video placeholder */}
            <div className="mt-8 aspect-video w-full rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </div>
    </div>
  );
}
