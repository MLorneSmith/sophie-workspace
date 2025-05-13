import path from 'path';
import { getPayload } from 'payload';
// Import getPayload
import type { Payload } from 'payload';

import config from '../../../apps/payload/src/payload.config';

// Re-add direct config import

let cached = (global as any).payload;

if (!cached) {
  cached = (global as any).payload = { client: null, promise: null };
}

export async function getPayloadClient(
  forceNew: boolean = false,
): Promise<Payload> {
  console.log('Attempting to get Payload client...'); // Added logging
  if (cached.client && !forceNew) {
    console.log('Using cached Payload client.'); // Added logging
    return cached.client;
  }

  if (!cached.promise || forceNew) {
    console.log('Initializing new Payload client...'); // Added logging
    cached.promise = getPayload({
      // Use getPayload
      config, // Pass the imported config again
    }); // getPayload returns the payload instance directly
  }

  try {
    console.log('Awaiting Payload initialization promise...'); // Added logging
    cached.client = await cached.promise;
    console.log('Payload client initialized successfully.'); // Added logging
  } catch (e) {
    console.error('Error initializing Payload client:', e); // Added logging
    cached.promise = null;
    throw e;
  }

  return cached.client;
}
