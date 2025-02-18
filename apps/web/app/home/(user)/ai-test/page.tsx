'use client';

import { useActionState } from 'react';

import { useFormStatus } from 'react-dom';

import { Button } from '@kit/ui/button';
import { Card } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';

import {
  type AIResponse,
  type ConfigType,
  type TestType,
  testAI,
} from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? 'Testing...' : 'Test AI Integration'}
    </Button>
  );
}

const configDescriptions: Record<ConfigType, string> = {
  speedOptimized:
    'Fast responses using Groq (llama-3.1-8b-instant) with GPT-3.5 fallback',
  qualityOptimized:
    'High-quality responses using GPT-4 with Claude-3-Opus fallback',
  reasoningOptimized:
    'Balanced reasoning using o3-mini with Claude-3-Sonnet fallback',
  balancedOptimized:
    'Speed/quality balance using llama-3.3-70b with Claude-3-Haiku fallback',
  outlineGeneration:
    'Optimized for presentation outline creation with Claude-3',
};

const testTypeDescriptions: Record<TestType, string> = {
  simple: 'Simple response test',
  outline: 'Presentation outline generation test',
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
            <label className="mb-2 block text-sm font-medium">Test Type</label>
            <Select name="testType" defaultValue="simple">
              <SelectTrigger>
                <SelectValue placeholder="Select a test type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(testTypeDescriptions).map(
                  ([type, description]) => (
                    <SelectItem key={type} value={type}>
                      {description}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium">
              Configuration Type
            </label>
            <Select name="configType" defaultValue="balancedOptimized">
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

          {state?.testType === 'outline' && (
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Presentation Topic
              </label>
              <Input
                name="topic"
                placeholder="Enter presentation topic"
                defaultValue="AI Technology"
              />
            </div>
          )}

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

          <div className="mb-4">
            <h2 className="mb-2 font-semibold">Test Type:</h2>
            <p className="text-muted-foreground text-sm">
              {state.testType
                ? testTypeDescriptions[state.testType as TestType]
                : 'Simple test'}
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
