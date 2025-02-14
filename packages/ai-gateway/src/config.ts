import OpenAI from 'openai';
import { Portkey } from 'portkey-ai';

if (!process.env.PORTKEY_API_KEY) {
  throw new Error('PORTKEY_API_KEY environment variable is not set');
}

if (!process.env.PORTKEY_VIRTUAL_KEY) {
  throw new Error('PORTKEY_VIRTUAL_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: '', // Can be left blank when using virtual keys
  baseURL: 'https://api.portkey.ai/v1/proxy',
  defaultHeaders: {
    'x-portkey-api-key': process.env.PORTKEY_API_KEY,
    'x-portkey-virtual-key': process.env.PORTKEY_VIRTUAL_KEY,
    'x-portkey-provider': 'openai',
  },
});

export default openai;
