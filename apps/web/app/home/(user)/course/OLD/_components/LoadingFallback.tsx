import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { PageBody } from '@kit/ui/page';
import { Skeleton } from '@kit/ui/skeleton';

export function LoadingFallback() {
  return (
    <PageBody>
      <div className={'container flex flex-col space-y-6 py-12'}>
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="mb-6 text-3xl font-bold">Course Dashboard</h1>
        </div>
      </div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    </PageBody>
  );
}
