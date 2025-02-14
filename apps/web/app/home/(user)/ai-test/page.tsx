'use client';

import { useActionState } from 'react';

import { useFormStatus } from 'react-dom';

import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';

import { type AIResponse, testAI } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Testing...' : 'Test AI Integration'}
    </Button>
  );
}

export default function AITestPage() {
  const initialState: AIResponse = {
    message: null,
    error: null,
  };

  const [state, formAction] = useActionState(testAI, initialState);

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Portkey AI Test</h1>

      <Card className="mb-4 p-4">
        <form action={formAction}>
          <SubmitButton />
        </form>
      </Card>

      {state?.error && (
        <Card className="bg-destructive/10 mb-4 p-4">
          <p className="text-destructive">Error: {state.error}</p>
        </Card>
      )}

      {state?.message && (
        <Card className="p-4">
          <h2 className="mb-2 font-semibold">AI Response:</h2>
          <p className="whitespace-pre-wrap">{state.message}</p>
        </Card>
      )}
    </div>
  );
}
