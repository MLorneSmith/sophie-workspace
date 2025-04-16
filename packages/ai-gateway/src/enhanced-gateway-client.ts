import OpenAI from 'openai';

interface PortkeyHeadersOptions {
  userId?: string;
  teamId?: string;
  feature?: string;
  sessionId?: string;
}

/**
 * Creates headers for the Portkey API with tracking metadata
 *
 * @param options Tracking metadata options
 * @returns Record<string, string> Headers object
 */
export function createPortkeyHeaders(options: PortkeyHeadersOptions = {}) {
  const { userId, teamId, feature, sessionId } = options;

  const headers: Record<string, string> = {
    'x-portkey-api-key': process.env.PORTKEY_API_KEY || '',
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY || '',
    'x-portkey-provider': 'openai',
  };

  // Add tracking metadata for analytics
  if (userId) headers['x-portkey-request-metadata-user-id'] = userId;
  if (teamId) headers['x-portkey-request-metadata-team-id'] = teamId;
  if (feature) headers['x-portkey-request-metadata-feature'] = feature;
  if (sessionId) headers['x-portkey-trace-id'] = sessionId;

  return headers;
}

/**
 * Creates an OpenAI client configured to use Portkey with tracking metadata
 *
 * @param options Tracking metadata options
 * @returns OpenAI Configured OpenAI client
 */
export function createGatewayClient(options: PortkeyHeadersOptions = {}) {
  const headers = createPortkeyHeaders(options);

  return new OpenAI({
    apiKey: '', // Can be left blank when using virtual keys
    baseURL: 'https://api.portkey.ai/v1/proxy',
    defaultHeaders: headers,
  });
}
