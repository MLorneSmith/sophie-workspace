export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 w-2/3 rounded bg-gray-200" />
          <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />
        </div>

        <div className="mt-8 space-y-6">
          {/* Simulate multiple quiz questions */}
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 h-4 w-3/4 rounded bg-gray-200" />
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, answerIndex) => (
                  <div
                    key={answerIndex}
                    className="flex items-center space-x-2"
                  >
                    <div className="h-4 w-4 rounded-full bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
