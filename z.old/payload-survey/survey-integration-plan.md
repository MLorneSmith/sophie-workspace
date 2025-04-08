# Survey Integration Plan

This document outlines the plan for implementing two new surveys and integrating them into specific course lessons.

## Current System Overview

The survey system consists of:

1. **Payload CMS Collections**:

   - `Surveys`: Stores survey metadata (title, slug, description, etc.)
   - `SurveyQuestions`: Stores questions with options, categories, and scoring logic

2. **Supabase Tables**:

   - `survey_responses`: Stores user responses to surveys
   - `survey_progress`: Tracks user progress through surveys

3. **Content Migration System**:

   - Raw survey data is defined in YAML files
   - Migration scripts process these files and populate the database

4. **Frontend Components**:
   - Survey pages with question display and navigation
   - Response handling and progress tracking

## Requirements

We need to create two new surveys and integrate them into specific course lessons:

1. **Three Quick Questions Survey**

   - To be integrated into lesson 103 "Before we begin..."
   - Contains a mix of text fields and rating scale questions

2. **Feedback Survey**
   - To be integrated into lesson 802 "Before you go..."
   - Contains rating scales and an open text field

## Implementation Plan

### 1. Create New Survey YAML Files

Create two new YAML files in `packages/content-migrations/src/data/raw/surveys/`:

**three-quick-questions.yaml**:

```yaml
title: Three Quick Questions
slug: three-quick-questions
description: A quick survey to help understand your goals
status: published
language: en
questions:
  - question: 'Fill in the blank: After taking this course, I will be able to ________________________.'
    answers: []
    questioncategory: goals
    questionspin: positive
    type: text_field
  - question: "How experienced do you feel in this course's subject matter?"
    answers:
      - answer: '1 - Very inexperienced'
      - answer: '2'
      - answer: '3'
      - answer: '4'
      - answer: '5 - Very experienced'
    questioncategory: experience
    questionspin: positive
    type: scale
  - question: "What's the biggest roadblock you have with this course's subject matter right now?"
    answers: []
    questioncategory: roadblocks
    questionspin: positive
    type: text_field
```

**feedback.yaml**:

```yaml
title: Course Feedback
slug: feedback
description: Please share your thoughts on the course
status: published
language: en
questions:
  - question: "Did 'Decks for Decision Makers' meet your expectations?"
    answers:
      - answer: 'Very dissatisfied'
      - answer: 'Somewhat dissatisfied'
      - answer: 'Neither satisfied nor dissatisfied'
      - answer: 'Somewhat Satisfied'
      - answer: 'Very satisfied'
    questioncategory: satisfaction
    questionspin: positive
    type: scale
  - question: 'How would you rate the quality of the training?'
    answers:
      - answer: 'Unacceptable'
      - answer: 'Poor'
      - answer: 'Satisfactory'
      - answer: 'Good'
      - answer: 'Outstanding'
    questioncategory: quality
    questionspin: positive
    type: scale
  - question: 'How likely are you to recommend this course to a friend, partner, or colleague?'
    answers:
      - answer: '1 - Unlikely'
      - answer: '2'
      - answer: '3'
      - answer: '4'
      - answer: '5'
      - answer: '6'
      - answer: '7'
      - answer: '8'
      - answer: '9'
      - answer: '10 - Extremely likely'
    questioncategory: recommendation
    questionspin: positive
    type: scale
  - question: 'Do you have any suggestions to improve this course?'
    answers: []
    questioncategory: improvement
    questionspin: positive
    type: text_field
```

### 2. Update Payload CMS Collections

#### 2.1 Modify SurveyQuestions Collection

Update `apps/payload/src/collections/SurveyQuestions.ts` to support new question types:

```typescript
// Add to the type options
{
  name: 'type',
  type: 'select',
  options: [
    { label: 'Multiple Choice', value: 'multiple_choice' },
    { label: 'Text Field', value: 'text_field' },
    { label: 'Scale', value: 'scale' },
  ],
  defaultValue: 'multiple_choice',
  required: true,
  admin: {
    description: 'The type of question',
  },
}
```

#### 2.2 Update CourseLessons Collection

Modify `apps/payload/src/collections/CourseLessons.ts` to add a survey relationship:

```typescript
// Add to CourseLessons.ts fields array
{
  name: 'survey_id',
  type: 'relationship',
  relationTo: 'surveys' as any,
  hasMany: false,
  admin: {
    description: 'The survey associated with this lesson (if any)',
  },
}
```

### 3. Update Migration Scripts

#### 3.1 Modify Survey Questions Migration

Update `packages/content-migrations/src/scripts/core/migrate-survey-questions-direct.ts` to handle new question types:

```typescript
// Add handling for text_field and scale question types
const questionType = q.type || 'multiple_choice';

// Insert the question with the correct type
const questionResult = await client.query(
  `INSERT INTO payload.survey_questions (
    id, 
    question, 
    type, 
    questionspin, 
    category, 
    position, 
    updated_at, 
    created_at
  ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
  RETURNING id`,
  [
    q.question,
    questionType, // Use the question type from the YAML
    q.questionspin === 'positive'
      ? 'Positive'
      : q.questionspin === 'negative'
        ? 'Negative'
        : 'Positive',
    q.questioncategory || '',
    i, // Use the array index as the position
  ],
);
```

#### 3.2 Create Lesson-Survey Association Script

Create a new script `packages/content-migrations/src/scripts/core/associate-lessons-surveys.ts`:

```typescript
/**
 * Script to associate surveys with specific lessons
 */
import dotenv from 'dotenv';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(__dirname, `../../../${envFile}`) });

async function associateLessonsSurveys() {
  // Get the database connection string
  const databaseUri = process.env.DATABASE_URI;
  if (!databaseUri) {
    throw new Error('DATABASE_URI environment variable is not set');
  }

  console.log(`Connecting to database: ${databaseUri}`);

  // Create a connection pool
  const pool = new Pool({
    connectionString: databaseUri,
  });

  try {
    const client = await pool.connect();
    try {
      console.log('Connected to database');

      // Get survey IDs
      const threeQuestionsResult = await client.query(
        `SELECT id FROM payload.surveys WHERE slug = 'three-quick-questions'`,
      );
      const feedbackResult = await client.query(
        `SELECT id FROM payload.surveys WHERE slug = 'feedback'`,
      );

      if (
        threeQuestionsResult.rows.length === 0 ||
        feedbackResult.rows.length === 0
      ) {
        console.error('Could not find one or both surveys');
        return;
      }

      const threeQuestionsId = threeQuestionsResult.rows[0].id;
      const feedbackId = feedbackResult.rows[0].id;

      // Associate surveys with lessons
      await client.query(
        `UPDATE payload.course_lessons SET survey_id = $1 WHERE lesson_number = 103`,
        [threeQuestionsId],
      );

      await client.query(
        `UPDATE payload.course_lessons SET survey_id = $1 WHERE lesson_number = 802`,
        [feedbackId],
      );

      console.log('Successfully associated surveys with lessons');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error associating lessons with surveys:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the association
associateLessonsSurveys().catch((error) => {
  console.error('Lesson-survey association failed:', error);
  process.exit(1);
});
```

#### 3.3 Update Main Migration Script

Update `packages/content-migrations/src/scripts/core/migrate-all-direct-fixed.ts` to include the new association script:

```typescript
// Add to the imports
import { associateLessonsSurveys } from './associate-lessons-surveys';

// Add to the migration sequence
await migrateSurveysToDatabase();
await migrateSurveyQuestionsToDatabase();
await associateLessonsSurveys();
```

### 4. Create New Survey Components

#### 4.1 Create Text Field Question Component

Create `apps/web/app/home/(user)/assessment/survey/_components/text-field-question.tsx`:

```tsx
'use client';

import { useState } from 'react';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { Textarea } from '@kit/ui/textarea';
import { Trans } from '@kit/ui/trans';

type TextFieldQuestionProps = {
  question: any;
  onAnswer: (questionId: string, answer: string, score: number) => void;
  isLoading: boolean;
};

export function TextFieldQuestion({
  question,
  onAnswer,
  isLoading,
}: TextFieldQuestionProps) {
  const [answer, setAnswer] = useState<string>('');

  const handleSubmit = () => {
    if (answer.trim()) {
      // For text fields, we don't have a score, so we use 0
      onAnswer(question.id, answer, 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{question.text}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="answer">Your Answer</Label>
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer here..."
          className="min-h-[100px]"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!answer.trim() || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Trans i18nKey="assessment:saving" />
        ) : (
          <Trans i18nKey="assessment:nextQuestion" />
        )}
      </Button>
    </div>
  );
}
```

#### 4.2 Create Scale Question Component

Create `apps/web/app/home/(user)/assessment/survey/_components/scale-question.tsx`:

```tsx
'use client';

import { useState } from 'react';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import { Trans } from '@kit/ui/trans';

type ScaleQuestionProps = {
  question: any;
  onAnswer: (questionId: string, answer: string, score: number) => void;
  isLoading: boolean;
};

export function ScaleQuestion({
  question,
  onAnswer,
  isLoading,
}: ScaleQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedOption) {
      const option = question.options.find(
        (opt: any) => opt.id === selectedOption,
      );

      if (option) {
        // For scale questions, we extract the numeric value from the option
        // This assumes the option text starts with a number (e.g., "1 - Very inexperienced")
        const numericValue = parseInt(option.text.split(' ')[0], 10);
        const score = isNaN(numericValue) ? 0 : numericValue;

        onAnswer(question.id, option.text, score);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{question.text}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
      </div>

      <RadioGroup
        value={selectedOption || ''}
        onValueChange={setSelectedOption}
        className="space-y-3"
      >
        {question.options?.map((option: any) => (
          <div
            key={option.id}
            className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4"
            onClick={() => setSelectedOption(option.id)}
          >
            <RadioGroupItem value={option.id} id={option.id} />
            <Label
              htmlFor={option.id}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Button
        onClick={handleSubmit}
        disabled={!selectedOption || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Trans i18nKey="assessment:saving" />
        ) : (
          <Trans i18nKey="assessment:nextQuestion" />
        )}
      </Button>
    </div>
  );
}
```

#### 4.3 Update Question Card Component

Modify `apps/web/app/home/(user)/assessment/survey/_components/question-card.tsx` to handle different question types:

```tsx
'use client';

import { useState } from 'react';

import { Button } from '@kit/ui/button';
import { Label } from '@kit/ui/label';
import { RadioGroup, RadioGroupItem } from '@kit/ui/radio-group';
import { Trans } from '@kit/ui/trans';

import { ScaleQuestion } from './scale-question';
import { TextFieldQuestion } from './text-field-question';

type QuestionCardProps = {
  question: any;
  onAnswer: (questionId: string, answer: string, score: number) => void;
  isLoading: boolean;
};

export function QuestionCard({
  question,
  onAnswer,
  isLoading,
}: QuestionCardProps) {
  // Render different question types based on the question type
  if (question.type === 'text_field') {
    return (
      <TextFieldQuestion
        question={question}
        onAnswer={onAnswer}
        isLoading={isLoading}
      />
    );
  }

  if (question.type === 'scale') {
    return (
      <ScaleQuestion
        question={question}
        onAnswer={onAnswer}
        isLoading={isLoading}
      />
    );
  }

  // Default to multiple choice question
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSubmit = () => {
    if (selectedOption) {
      // Log the selected option and available options for debugging
      console.log('Selected option:', selectedOption);
      console.log('Available options:', question.options);

      const option = question.options.find(
        (opt: any) => opt.id === selectedOption,
      );

      if (option) {
        onAnswer(question.id, option.text, option.score || 0);
      } else {
        console.error('Selected option not found:', selectedOption);
        console.error('Question options:', question.options);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{question.text}</h2>
        {question.description && (
          <p className="text-muted-foreground">{question.description}</p>
        )}
      </div>

      <RadioGroup
        value={selectedOption || ''}
        onValueChange={setSelectedOption}
        className="space-y-3"
      >
        {question.options?.map((option: any) => (
          <div
            key={option.id}
            className="hover:bg-accent flex cursor-pointer items-center space-x-2 rounded-md border p-4"
            onClick={() => setSelectedOption(option.id)}
          >
            <RadioGroupItem value={option.id} id={option.id} />
            <Label
              htmlFor={option.id}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>

      <Button
        onClick={handleSubmit}
        disabled={!selectedOption || isLoading}
        className="w-full"
      >
        {isLoading ? (
          <Trans i18nKey="assessment:saving" />
        ) : (
          <Trans i18nKey="assessment:nextQuestion" />
        )}
      </Button>
    </div>
  );
}
```

### 5. Update Lesson View to Display Surveys

#### 5.1 Update LessonDataProvider

Modify `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonDataProvider.tsx` to fetch survey data:

```tsx
// Add survey fetching to the data provider
const { data: survey } = await supabase
  .from('surveys')
  .select('*')
  .eq('id', lesson.survey_id)
  .single();

// Add survey to the returned data
return {
  quiz,
  quizAttempts,
  lessonProgress,
  userId,
  survey: survey || null,
};
```

#### 5.2 Update LessonViewClient

Modify `apps/web/app/home/(user)/course/lessons/[slug]/_components/LessonViewClient.tsx` to display surveys:

```tsx
// Add survey state
const [showSurvey, setShowSurvey] = useState(false);
const [surveyCompleted, setSurveyCompleted] = useState(false);

// Add survey check
const hasSurvey = !!lesson.survey_id;

// Add survey button to the UI
{
  !showQuiz && !showSurvey && hasSurvey && !surveyCompleted && (
    <Button
      onClick={() => {
        markLessonAsViewed();
        setShowSurvey(true);
      }}
      disabled={isPending}
    >
      Take Survey
      <ChevronRight className="ml-2 h-4 w-4" />
    </Button>
  );
}

// Add survey component
{
  showSurvey && (
    <SurveyComponent
      surveyId={lesson.survey_id}
      onComplete={() => {
        setShowSurvey(false);
        setSurveyCompleted(true);
        // Mark lesson as completed when survey is completed
        markLessonAsCompleted();
      }}
    />
  );
}
```

#### 5.3 Create SurveyComponent for Lessons

Create `apps/web/app/home/(user)/course/lessons/[slug]/_components/SurveyComponent.tsx`:

```tsx
'use client';

import { useEffect, useState, useTransition } from 'react';

import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Card } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';

import { saveResponseAction } from '../../../../assessment/_lib/server/server-actions';
import { QuestionCard } from '../../../../assessment/survey/_components/question-card';
import { SurveySummary } from '../../../../assessment/survey/_components/survey-summary';

type SurveyComponentProps = {
  surveyId: string;
  onComplete: () => void;
};

export function SurveyComponent({
  surveyId,
  onComplete,
}: SurveyComponentProps) {
  const [isPending, startTransition] = useTransition();
  const supabase = useSupabase();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [showSummary, setShowSummary] = useState(false);

  // Fetch survey data
  const { data: surveyData, isLoading: isSurveyLoading } = useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();
      return data;
    },
  });

  // Fetch survey questions
  const { data: questionsData, isLoading: isQuestionsLoading } = useQuery({
    queryKey: ['survey-questions', surveyId],
    queryFn: async () => {
      const { data } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('position', { ascending: true });
      return data;
    },
    enabled: !!surveyId,
  });

  // Set questions when data is loaded
  useEffect(() => {
    if (questionsData) {
      setQuestions(questionsData);
    }
  }, [questionsData]);

  // Get user ID
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  const userId = userData?.id;

  // Calculate progress
  const progress = (currentQuestionIndex / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentQuestion = questions[currentQuestionIndex];

  // Handle answer submission
  const handleAnswer = (questionId: string, answer: string, score: number) => {
    // Save the response
    const category = currentQuestion.category || 'general';

    // Save the response locally
    setResponses({
      ...responses,
      [questionId]: { answer, score, category },
    });

    // Save the response to the server
    startTransition(async () => {
      try {
        await saveResponseAction({
          surveyId,
          questionId,
          questionIndex: currentQuestionIndex,
          response: answer,
          category,
          score,
          totalQuestions: questions.length,
        });

        // Move to the next question or complete the survey
        if (isLastQuestion) {
          setShowSummary(true);
          onComplete();
        } else {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
      } catch (error) {
        toast.error('Failed to save response. Please try again.');
      }
    });
  };

  // Loading state
  if (isSurveyLoading || isQuestionsLoading) {
    return <div>Loading survey...</div>;
  }

  // No survey found
  if (!surveyData) {
    return <div>Survey not found.</div>;
  }

  // No questions found
  if (!questions || questions.length === 0) {
    return <div>No questions found for this survey.</div>;
  }

  // Show summary
  if (showSummary) {
    return (
      <SurveySummary survey={surveyData} totalQuestions={questions.length} />
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4">
      <Card className="bg-card mb-8 overflow-hidden shadow-lg">
        <div className="p-1">
          <Progress value={progress} className="h-2 w-full" />
        </div>

        <div className="p-6">
          <div className="text-muted-foreground mb-2 flex justify-between text-sm">
            <span>
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <span>
              {currentQuestionIndex === 0 ? '0' : Math.round(progress)}%
              Complete
            </span>
          </div>

          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            onAnswer={handleAnswer}
            isLoading={isPending}
          />
        </div>
      </Card>
    </div>
  );
}
```

### 6. Update Database Schema

Create a migration file to add the survey_id column to the course_lessons table:

```sql
-- Add survey_id column to course_lessons table
ALTER TABLE payload.course_lessons ADD COLUMN IF NOT EXISTS survey_id UUID;

-- Add foreign key constraint
ALTER TABLE payload.course_lessons
ADD CONSTRAINT fk_course_lessons_survey
FOREIGN KEY (survey_id)
REFERENCES payload.surveys(id)
ON DELETE SET NULL;
```

## Migration Process

1. Add the new YAML files to `packages/content-migrations/src/data/raw/surveys/`
2. Update the Payload CMS collections
3. Create the database migration file
4. Update the migration scripts
5. Run the reset-and-migrate.ps1 script

## Testing Plan

1. Verify the new surveys are created in Payload CMS
2. Verify the surveys are associated with the correct lessons
3. Test the survey functionality in the lessons
4. Verify the responses are saved correctly
5. Test different question types (text field, scale)

## Timeline

1. Create YAML files and update Payload CMS collections (1 day)
2. Update migration scripts (1 day)
3. Create new survey components (2 days)
4. Update lesson view to display surveys (1 day)
5. Testing and refinement (1 day)

Total estimated time: 6 days
