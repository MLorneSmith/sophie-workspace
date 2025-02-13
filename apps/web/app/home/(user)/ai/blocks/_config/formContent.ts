import { FormData } from '../_components/SetupFormContext';

type PresentationTypeId = 'general' | 'sales' | 'consulting' | 'fundraising';

type QuestionOption = {
  id: string;
  label: string;
  description: string;
};

type BaseQuestion = {
  field: keyof FormData;
  label: string;
  labels?: Record<PresentationTypeId, string>;
  type: 'input' | 'textarea' | 'select' | 'multiple_choice';
  section: string;
  description: string;
  image?: string;
  options?: QuestionOption[];
};

type QuestionWithPaths = BaseQuestion & {
  descriptions?: Record<PresentationTypeId, string>;
  paths?: PresentationTypeId[];
};

export type QuestionType = QuestionWithPaths;

export type PresentationType = {
  id: PresentationTypeId;
  label: string;
  description: string;
};

export const presentationTypes: PresentationType[] = [
  {
    id: 'general',
    label: 'General Business Presentation',
    description:
      'For internal meetings, updates, or general business communications',
  },
  {
    id: 'sales',
    label: 'Sales Presentation',
    description: 'For pitching products or services to potential customers',
  },
  {
    id: 'consulting',
    label: 'Consulting Presentation',
    description: 'For delivering analysis, recommendations, or project updates',
  },
  {
    id: 'fundraising',
    label: 'Fundraising Presentation',
    description: 'For pitching to investors or securing funding',
  },
];

const placeholderImage = '/images/posts/blog-post-placeholder.png';

export const questions = {
  presentation_type: {
    field: 'presentation_type' as const,
    label: 'What type of Presentation do you want to create?',
    type: 'select' as const,
    section: 'Setup our presentation narrative',
    description:
      'Choose the type of presentation that best matches your needs. Each type has a specialized structure to help you create the most effective presentation.',
    image: placeholderImage,
  },
  question_type: {
    field: 'question_type' as const,
    label: 'What type of question are you answering?',
    type: 'multiple_choice' as const,
    section: 'Define your question type',
    description:
      'Select the type of question that best matches what you are trying to answer.',
    options: [
      {
        id: 'strategy',
        label: 'What should we do?',
        description: 'A strategy or plan',
      },
      {
        id: 'assessment',
        label: 'Should we do what we are thinking of doing?',
        description: 'An assessment of a plan',
      },
      {
        id: 'implementation',
        label: 'How do we implement the solution',
        description: 'An implementation plan',
      },
      {
        id: 'diagnostic',
        label: 'Do we have a problem?',
        description: 'A strategy assessment, A diagnostic',
      },
      {
        id: 'alternatives',
        label: 'Which alternative should we choose',
        description: 'An alternatives assessment',
      },
      {
        id: 'postmortem',
        label: "Why didn't it work?",
        description: 'A post mortem. An evaluation',
      },
    ],
    image: placeholderImage,
  },
  title: {
    field: 'title' as const,
    label: 'Enter your presentation title',
    type: 'input' as const,
    section: 'Setup our presentation narrative',
    description: 'Create a title that clearly communicates your main message.',
    descriptions: {
      general: 'Keep it clear and informative for internal stakeholders.',
      sales: 'Focus on the value proposition or key benefit.',
      consulting: 'Highlight the analysis or recommendation topic.',
      fundraising: 'Emphasize your company and growth potential.',
    },
    image: placeholderImage,
  },
  audience: {
    field: 'audience' as const,
    label: 'Who is your audience?',
    labels: {
      general: 'Who is your audience?',
      sales: 'Who is your prospect?',
      consulting: 'Who are your stakeholders?',
      fundraising: 'Who are your potential investors?',
    },
    type: 'input' as const,
    section: 'Define your audience',
    description:
      'Describe your audience, their background, and what matters to them.',
    descriptions: {
      general:
        'Which team members or departments will attend? What is their level of familiarity with the topic?',
      sales:
        'Who are the decision-makers? What are their pain points and priorities?',
      consulting:
        'Who are the key stakeholders? What is their level of technical expertise?',
      fundraising:
        'Which investors are you targeting? What is their investment focus?',
    },
    image: placeholderImage,
  },
  situation: {
    field: 'situation' as const,
    label: 'Describe the current situation',
    type: 'textarea' as const,
    section: 'Build your narrative',
    description: 'Describe the current state or context.',
    descriptions: {
      general: '',
      sales:
        'What challenges or inefficiencies is your prospect currently facing?',
      consulting: 'What is the current state of the business or problem area?',
      fundraising: '',
    },
    paths: ['sales', 'consulting'],
    image: placeholderImage,
  },
  complication: {
    field: 'complication' as const,
    label: 'What has changed or created urgency?',
    type: 'textarea' as const,
    section: 'Build your narrative',
    description: 'Explain what has changed to create the need for action.',
    descriptions: {
      general: '',
      sales:
        'What market changes or new challenges make solving this problem urgent?',
      consulting:
        'What new factors or changes have made the current situation problematic?',
      fundraising: '',
    },
    paths: ['sales', 'consulting'],
    image: placeholderImage,
  },
  answer: {
    field: 'answer' as const,
    label: 'What is your solution or recommendation?',
    type: 'textarea' as const,
    section: 'Present your solution',
    description: 'Present your solution and its benefits clearly.',
    descriptions: {
      general: '',
      sales:
        'How does your product or service solve their specific challenges?',
      consulting:
        'What are your key recommendations and their expected impact?',
      fundraising: '',
    },
    paths: ['sales', 'consulting'],
    image: placeholderImage,
  },
} as const;

export type QuestionField = keyof typeof questions;

type PathConfig = {
  [K in PresentationTypeId]: QuestionField[];
};

export const presentationPaths: PathConfig = {
  general: [
    'presentation_type',
    'title',
    'audience',
    'question_type',
    'situation',
    'complication',
    'answer',
  ],
  sales: [
    'presentation_type',
    'title',
    'audience',
    'situation',
    'complication',
    'answer',
  ],
  consulting: [
    'presentation_type',
    'title',
    'audience',
    'situation',
    'complication',
    'answer',
  ],
  fundraising: [
    'presentation_type',
    'title',
    'audience',
    'situation',
    'complication',
    'answer',
  ],
} as const;

export type PresentationPathType = keyof typeof presentationPaths;

// Helper function to get the question for a specific field
export function getQuestion(field: QuestionField): QuestionType {
  return questions[field] as QuestionType;
}

// Helper function to get the full path for a presentation type
export function getPath(type: PresentationPathType): QuestionField[] {
  return presentationPaths[type];
}

// Helper function to get the next question in a path
export function getNextQuestion(
  currentField: QuestionField,
  type: PresentationPathType,
): QuestionField | undefined {
  const path = presentationPaths[type];
  if (!path) return undefined;

  const currentIndex = path.indexOf(currentField);
  if (currentIndex === -1 || currentIndex === path.length - 1) return undefined;

  return path[currentIndex + 1];
}

// Helper function to check if a field is valid for the current presentation type
export function isFieldInPath(
  field: QuestionField,
  type: PresentationPathType,
): boolean {
  const path = presentationPaths[type];
  return path ? path.includes(field) : false;
}

// Helper function to get the description for a specific presentation type
export function getQuestionDescription(
  field: QuestionField,
  type: PresentationPathType,
): string {
  const question = questions[field] as QuestionType;
  if (question.descriptions && question.descriptions[type]) {
    return question.descriptions[type];
  }
  return question.description;
}

// Helper function to get the label for a specific presentation type
export function getQuestionLabel(
  field: QuestionField,
  type: PresentationPathType,
): string {
  const question = questions[field] as QuestionType;
  if (question.labels && question.labels[type]) {
    return question.labels[type];
  }
  return question.label;
}
