import { CmsClient } from '@kit/cms-types';

/**
 * Creates a new Payload client instance.
 */
export async function createPayloadClient(): Promise<CmsClient> {
  const { PayloadClient } = await import('./payload-client');
  return new PayloadClient();
}
