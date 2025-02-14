/**
 * Example implementation showing how to use the AI Gateway
 * with Next.js 15 Server Actions and React components.
 *
 * Key features demonstrated:
 * 1. Client/Server separation
 * 2. Type-safe responses
 * 3. Loading states
 * 4. Error handling
 */

'use client';

import { type ReactNode } from 'react';
import { useActionState } from 'react';

import { useFormStatus } from 'react-dom';

import { type AIResponse, generateAIResponse } from './actions';

/**
 * Example implementation showing how to use the AI Gateway
 * with Next.js 15 Server Actions and React components.
 *
 * Key features demonstrated:
 * 1. Client/Server separation
 * 2. Type-safe responses
 * 3. Loading states
 * 4. Error handling
 */

/**
 * Example implementation showing how to use the AI Gateway
 * with Next.js 15 Server Actions and React components.
 *
 * Key features demonstrated:
 * 1. Client/Server separation
 * 2. Type-safe responses
 * 3. Loading states
 * 4. Error handling
 */

// Note: In a real implementation, you would import these from your UI library
type ButtonProps = {
  type?: 'submit' | 'button';
  disabled?: boolean;
  children: ReactNode;
};

type CardProps = {
  className?: string;
  children: ReactNode;
};

// Mock UI components - replace with your actual UI components
function Button({ type = 'button', disabled, children }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className="rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Card({ className = '', children }: CardProps) {
  return (
    <div className={`rounded-lg border p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/**
 * Submit button component that shows loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Generating...' : 'Generate Response'}
    </Button>
  );
}

/**
 * Main component that demonstrates:
 * 1. Using Server Actions with useActionState
 * 2. Handling loading states
 * 3. Displaying success/error states
 * 4. Type-safe responses
 */
export default function AIExamplePage() {
  // Initialize state for the AI response
  const initialState: AIResponse = {
    message: null,
    error: null,
  };

  // Use Next.js 15's useActionState for form handling
  const [state, formAction] = useActionState(generateAIResponse, initialState);

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">AI Response Generator</h1>

      {/* Form with Server Action */}
      <Card className="mb-4">
        <form action={formAction}>
          <SubmitButton />
        </form>
      </Card>

      {/* Error Display */}
      {state?.error && (
        <Card className="mb-4 bg-red-50">
          <p className="text-red-600">Error: {state.error}</p>
        </Card>
      )}

      {/* Success Display */}
      {state?.message && (
        <Card>
          <h2 className="mb-2 font-semibold">AI Response:</h2>
          <p className="whitespace-pre-wrap">{state.message}</p>
        </Card>
      )}
    </div>
  );
}
