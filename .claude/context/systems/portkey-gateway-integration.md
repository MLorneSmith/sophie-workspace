# Documentation for Portkey AI Gateway Integration

This document outlines the steps to integrate Portkey AI Gateway into the codebase, focusing on secure API key handling and utilizing the Universal API approach.

## Steps for Integration

1. **Sign up for Portkey Account and Get API Key**:

   - If you haven't already, sign up for a Portkey AI account at [https://portkey.ai/](https://portkey.ai/).
   - Obtain your Portkey API key from the Portkey dashboard. This key will be used to authenticate your application with the Portkey Gateway.

2. **Install Portkey SDK**:

   - Install the Portkey Node.js SDK in your project:

     ```bash
     pnpm add portkey-ai
     ```

3. **Integrate Portkey SDK**:

   - **Update `packages/ai/src/config.ts`**:

     - Modify the configuration file to initialize the OpenAI client to use the Portkey Gateway URL and include `defaultHeaders` for authentication.
     - Ensure you are using environment variables to store your Portkey API key securely.

       ```typescript
       import OpenAI from 'openai';
       import { PORTKEY_GATEWAY_URL, createHeaders } from 'portkey-ai';

       if (!process.env.PORTKEY_API_KEY) {
         throw new Error('PORTKEY_API_KEY environment variable is not set');
       }

       const openai = new OpenAI({
         baseURL: PORTKEY_GATEWAY_URL,
         defaultHeaders: createHeaders({
           provider: 'openai', // Default provider, can be overridden in function calls
           apiKey: process.env.PORTKEY_API_KEY, // Portkey API Key for Gateway auth
         }),
       });

       export default openai;
       ```

   - **Update AI Service Functions**:

     - Modify `getChatCompletion` and `getStreamingChatCompletion` functions in `packages/ai/src/index.ts` to use the configured `openai` client.
     - Optionally, accept a `provider` parameter in `ChatCompletionOptions` to dynamically switch providers via the Universal API.

       ```typescript
       import { z } from 'zod';

       import openai from './config';

       // Import the configured OpenAI client

       // ... (rest of the code, including types and schemas)

       export async function getChatCompletion(
         messages: ChatMessage[],
         options: ChatCompletionOptions = {},
       ): Promise<string> {
         try {
           // Validate messages
           ChatMessagesSchema.parse(messages);

           const {
             model = 'gpt-3.5-turbo',
             provider,
             temperature = 0.7,
           } = options;

           const response = await openai.chat.completions.create({
             // Use the configured openai client
             messages,
             model,
             provider, // provider can be dynamically passed
             temperature,
           });

           // ... (rest of the function)
         } catch (error) {
           console.error('Error in getChatCompletion:', error);
           throw error;
         }
       }

       export async function* getStreamingChatCompletion(
         messages: ChatMessage[],
         options: ChatCompletionOptions = {},
       ): AsyncGenerator<string> {
         try {
           // Validate messages
           ChatMessagesSchema.parse(messages);

           const {
             model = 'gpt-3.5-turbo',
             provider,
             temperature = 0.7,
           } = options;

           const response = await openai.chat.completions.create({
             // Use the configured openai client
             messages,
             model,
             provider, // provider can be dynamically passed
             temperature,
             stream: true,
           });

           // ... (rest of the function)
         } catch (error) {
           console.error('Error in getStreamingChatCompletion:', error);
           throw error;
         }
       }
       ```

4. **Set up Environment Variables**:

   - Ensure you have the `PORTKEY_API_KEY` environment variable set in your `.env.local` file within the `apps/web` directory.
   - Example `.env.local`:

     ```
     PORTKEY_API_KEY=YOUR_PORTKEY_API_KEY_HERE
     ```

5. **Basic Configuration and Universal API Usage**:

   - After these code changes, your application will be configured to use Portkey AI Gateway's Universal API.
   - You can further configure routing, fallbacks, caching, and other features directly in the Portkey dashboard without needing to alter your codebase.

6. **Testing**:

   - Run your application and test the AI features to ensure they are working correctly with the Portkey AI Gateway integration.

7. **Run and Test**:
   - Redeploy your application with these changes and thoroughly test all AI functionalities.

This documentation should help you implement the Portkey AI Gateway integration securely and effectively. Remember to replace `YOUR_PORTKEY_API_KEY_HERE` with your actual Portkey API key from your Portkey account dashboard.
