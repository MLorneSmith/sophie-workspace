'use client';

import { useActionState } from 'react';

import { useFormStatus } from 'react-dom';

import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import { type AIResponse, type ConfigType, testAI } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Testing...' : 'Test AI Integration'}
    </Button>
  );
}

const configDescriptions: Record<ConfigType, string> = {
  basic: 'Basic configuration with OpenAI GPT-3.5',
  loadBalance: 'Load balancing between GPT-3.5 and GPT-4',
  fallback: 'Fallback strategy with automatic retries',
  reliable: 'High reliability with semantic caching and retries',
  costOptimized: 'Cost optimization with caching and load balancing',
};

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
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Configuration Type
            </label>
            <Select name="configType" defaultValue="basic">
              <SelectTrigger>
                <SelectValue placeholder="Select a configuration" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(configDescriptions).map(
                  ([type, description]) => (
                    <SelectItem key={type} value={type}>
                      {description}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

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
          <div className="mb-4">
            <h2 className="mb-2 font-semibold">Active Configuration:</h2>
            <p className="text-muted-foreground text-sm">
              {state.configType
                ? configDescriptions[state.configType as ConfigType]
                : 'No configuration selected'}
            </p>
          </div>

          <div>
            <h2 className="mb-2 font-semibold">AI Response:</h2>
            <p className="whitespace-pre-wrap">{state.message}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
