import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '../payload.config'

// Cache the Payload instance
let cachedPayloadClient: Payload | null = null

// Function to get the Payload client
export const getPayloadClient = async (): Promise<Payload> => {
  if (cachedPayloadClient) {
    return cachedPayloadClient
  }

  // Ensure PAYLOAD_SECRET is set
  if (!process.env.PAYLOAD_SECRET) {
    process.env.PAYLOAD_SECRET = 'your-payload-secret-key'
  }

  // Initialize Payload
  const payload = await getPayload({ config })

  // Cache the Payload instance
  cachedPayloadClient = payload

  return payload
}
