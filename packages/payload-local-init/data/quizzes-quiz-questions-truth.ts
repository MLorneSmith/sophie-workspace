// Adjusted import based on previous file update
import { v4 as uuidv4 } from 'uuid';

import {
  QuizDefinition,
  QuizQuestionDefinition,
} from './definitions/quiz-types.js';

// For generating new IDs

// Placeholder for Lexical JSON if a new question needs a default explanation
const defaultExplanation =
  '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Explanation placeholder.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":"ltr","format":"","indent":0,"type":"root","version":1}}';

/**
 * SINGLE SOURCE OF TRUTH for all unique quiz questions.
 */
export const ALL_QUIZ_QUESTIONS: Record<string, QuizQuestionDefinition> = {
  // --- Questions from basic-graphs-quiz.mdoc ---
  'b5b2c11f-9b7a-4f3e-8c1d-0e9f5a4b3c2d': {
    id: 'b5b2c11f-9b7a-4f3e-8c1d-0e9f5a4b3c2d',
    questionSlug: 'part-to-whole-relationship-chart',
    text: "There are many types of relationships that we use graphs to display. What chart type best communicates the 'Part-to-Whole' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Charts', isCorrect: false },
      { id: uuidv4(), text: 'Scatter Plots', isCorrect: false },
      { id: uuidv4(), text: 'Maps', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar charts', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e': {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
    questionSlug: 'correlation-relationship-chart',
    text: "What chart type best communicates the 'Correlation' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Charts', isCorrect: false },
      { id: uuidv4(), text: 'Scatter Plots', isCorrect: true },
      { id: uuidv4(), text: 'Maps', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar Charts', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a4321f': {
    id: 'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a4321f',
    questionSlug: 'time-series-relationship-chart',
    text: "What chart type best communicates the 'Time Series' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Charts', isCorrect: true },
      { id: uuidv4(), text: 'Scatter Plots', isCorrect: false },
      { id: uuidv4(), text: 'Maps', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar Charts', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e60': {
    id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e60',
    questionSlug: 'deviation-relationship-chart',
    text: "What chart types best communicates the 'Deviation' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Charts', isCorrect: true },
      { id: uuidv4(), text: 'Scatter Plots', isCorrect: false },
      { id: uuidv4(), text: 'Maps', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar Charts', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c61': {
    id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c61',
    questionSlug: 'distribution-relationship-chart',
    text: "What chart type best communicates the 'Distribution' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Charts', isCorrect: false },
      { id: uuidv4(), text: 'Scatter Plots', isCorrect: false },
      { id: uuidv4(), text: 'Maps', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: true },
      { id: uuidv4(), text: 'Bar Charts', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'd4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c62': {
    id: 'd4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c62',
    questionSlug: 'nominal-comparison-relationship-chart',
    text: "What chart type best communicates the 'Nominal Comparison' relationship",
    options: [
      { id: uuidv4(), text: 'Line Chart', isCorrect: false },
      { id: uuidv4(), text: 'Scatter Plot', isCorrect: false },
      { id: uuidv4(), text: 'Map', isCorrect: false },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar Chart', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c3': {
    id: 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c3',
    questionSlug: 'geospatial-relationship-chart',
    text: "What chart type best communicates the 'Geospatial' relationship?",
    options: [
      { id: uuidv4(), text: 'Line Chart', isCorrect: false },
      { id: uuidv4(), text: 'Scatter Plot', isCorrect: false },
      { id: uuidv4(), text: 'Map', isCorrect: true },
      { id: uuidv4(), text: 'Box Plot', isCorrect: false },
      { id: uuidv4(), text: 'Bar Chart', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1e': {
    id: 'a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1e',
    questionSlug: 'when-use-pie-charts',
    text: 'When should we use Pie Charts?',
    options: [
      {
        id: uuidv4(),
        text: 'For part-to-whole relationships.',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'For time series relationships', isCorrect: false },
      {
        id: uuidv4(),
        text: 'For nominal comparison relationships',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Never.', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '262b193c-b494-4aaa-868a-1b52cdd98c34': {
    id: '262b193c-b494-4aaa-868a-1b52cdd98c34',
    questionSlug: 'our-process-step-3',
    text: 'What is the 3rd step of our process?',
    options: [
      { id: uuidv4(), text: 'Who is our audience?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Why are we speaking to our audience (identify their question)?',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'What is our answer?', isCorrect: true },
      {
        id: uuidv4(),
        text: 'How will we deliver this presentation?',
        isCorrect: false,
      },
    ],
    explanation:
      '{"root":{"type":"root","format":"","indent":0,"version":1,"children":[{"type":"paragraph","format":"","indent":0,"version":1,"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Content placeholder","type":"text","version":1}]}],"direction":"ltr"},"format":"","version":1,"syncedChunksData":{},"chunks":[],"downloadedDataVersions":[],"config":{"theme":{"text":{"bold":"lexical-bold","code":"lexical-code","italic":"lexical-italic","strikethrough":"lexical-strikethrough","subscript":"lexical-subscript","superscript":"lexical-superscript","underline":"lexical-underline","underlineStrikethrough":"lexical-underlineStrikethrough"}},"namespace":"lexical"}}}',
  },
  // --- Questions from elements-of-design-detail-quiz.mdoc ---
  'edf6e1f0-7c1b-4f1e-8d1c-0e9f5a4b3c2d': {
    id: 'edf6e1f0-7c1b-4f1e-8d1c-0e9f5a4b3c2d',
    questionSlug: 'why-do-we-use-contrast',
    text: 'Why do we use contrast?',
    options: [
      {
        id: uuidv4(),
        text: 'To make our computer monitor easier to read',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'To fill up space', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Our eyes like it. It looks good',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'd8c5b02e-6a9f-4e2d-7c0b-1d2e3f4a5b6c': {
    id: 'd8c5b02e-6a9f-4e2d-7c0b-1d2e3f4a5b6c',
    questionSlug: 'how-important-is-alignment',
    text: 'How important is alignment?',
    options: [
      {
        id: uuidv4(),
        text: "Critically important (make sure you have learned how to use PowerPoint's alignment tools)",
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'c7b4a93d-598e-4d3c-6bfa-2c1d0e9f5a4b': {
    id: 'c7b4a93d-598e-4d3c-6bfa-2c1d0e9f5a4b',
    questionSlug: 'how-is-the-principle-of-proximity-helpful',
    text: 'How is the principle of proximity helpful?',
    options: [
      {
        id: uuidv4(),
        text: 'Helps us understand how groups are created (intentionally or unintentionally)',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Allows us to squeeze more onto the page',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Helps us get to know people', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'b6a3984c-487d-4c4b-5ae9-3b0c1d2e3f4a': {
    id: 'b6a3984c-487d-4c4b-5ae9-3b0c1d2e3f4a',
    questionSlug: 'how-many-different-font-types-should-you-use',
    text: 'How many different font types should you use in a single presentation?',
    options: [
      { id: uuidv4(), text: 'As many as you can', isCorrect: false },
      { id: uuidv4(), text: '4', isCorrect: false },
      { id: uuidv4(), text: '1', isCorrect: false },
      { id: uuidv4(), text: '2', isCorrect: true },
      { id: uuidv4(), text: '3', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'a592875b-376c-4b5a-49d8-4a1b0c1d2e3f': {
    id: 'a592875b-376c-4b5a-49d8-4a1b0c1d2e3f',
    questionSlug: 'how-many-colors-should-we-use',
    text: 'How many colors should we use in a presentation?',
    options: [
      {
        id: uuidv4(),
        text: '2 more than the number of fonts',
        isCorrect: false,
      },
      { id: uuidv4(), text: '7', isCorrect: false },
      { id: uuidv4(), text: '4 to 5', isCorrect: false },
      { id: uuidv4(), text: '2 to 3', isCorrect: true },
      { id: uuidv4(), text: '1', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '9481766a-265b-4a69-38c7-590a1b0c1d2e': {
    id: '9481766a-265b-4a69-38c7-590a1b0c1d2e',
    questionSlug: 'what-should-you-do-with-whitespace',
    text: 'What should you do with whitespace?',
    options: [
      {
        id: uuidv4(),
        text: 'Ensure you are using enough of it',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Color it blue, it is prettier', isCorrect: false },
      { id: uuidv4(), text: 'Fill it up with text!', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from fact-persuasion-quiz.mdoc ---
  '1f0e9d8c-7b6a-5f4e-3d2c-1b0a9f8e7d6c': {
    id: '1f0e9d8c-7b6a-5f4e-3d2c-1b0a9f8e7d6c',
    questionSlug: 'what-is-the-bare-assertion-fallacy',
    text: 'What is the bare assertion fallacy?',
    options: [
      {
        id: uuidv4(),
        text: 'A premise in an argument that is assumed to be true merely because it says that it is true',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'A Dan Brown novel', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Claiming to be right because you say you are right',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'A dream where you are presenting naked',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '2a1b0c9d-8e7f-6a5b-4c3d-2e1f0a9b8c7d': {
    id: '2a1b0c9d-8e7f-6a5b-4c3d-2e1f0a9b8c7d',
    questionSlug: 'what-is-graphical-excellence',
    text: 'What is graphical excellence?',
    options: [
      { id: uuidv4(), text: 'Beautiful', isCorrect: false },
      { id: uuidv4(), text: 'Honest', isCorrect: true },
      { id: uuidv4(), text: 'Multivariate', isCorrect: true },
      { id: uuidv4(), text: 'Efficient', isCorrect: true },
      { id: uuidv4(), text: 'Complicated', isCorrect: false },
      { id: uuidv4(), text: 'Curved', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from gestalt-principles-quiz.mdoc ---
  '3b2c1d0e-9f8e-7d6c-5b4a-3c2d1b0a9f8e': {
    id: '3b2c1d0e-9f8e-7d6c-5b4a-3c2d1b0a9f8e',
    questionSlug: 'why-repeated-principle-of-proximity',
    text: 'Why have we repeated the principle of proximity in this lesson and the previous lesson?',
    options: [
      {
        id: uuidv4(),
        text: "Didn't notice. The course is brilliant. Carry on!",
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Because repetition ad nauseum helps me learn?...',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Yo lazy', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '4c3d2e1f-0a9b-8c7d-6b5a-4c3d2e1f0a9b': {
    id: '4c3d2e1f-0a9b-8c7d-6b5a-4c3d2e1f0a9b',
    questionSlug: 'principle-of-similarity-characteristics',
    text: 'The principle of similarity states that we tend to group things which share visual characteristics such as:',
    options: [
      { id: uuidv4(), text: 'Size', isCorrect: true },
      { id: uuidv4(), text: 'Shape', isCorrect: true },
      { id: uuidv4(), text: 'Color', isCorrect: true },
      { id: uuidv4(), text: 'Orientation', isCorrect: true },
      { id: uuidv4(), text: 'Sound', isCorrect: false },
      { id: uuidv4(), text: 'Length', isCorrect: false },
      { id: uuidv4(), text: 'Distance', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '5d4e3f2a-1b0c-9d8e-7c6b-5d4e3f2a1b0c': {
    id: '5d4e3f2a-1b0c-9d8e-7c6b-5d4e3f2a1b0c',
    questionSlug: 'what-is-symmetry-associated-with',
    text: 'What is symmetry associated with?',
    options: [
      { id: uuidv4(), text: 'Stability', isCorrect: true },
      { id: uuidv4(), text: 'Consistency', isCorrect: true },
      { id: uuidv4(), text: 'Structure', isCorrect: true },
      { id: uuidv4(), text: 'Rhythm', isCorrect: false },
      { id: uuidv4(), text: 'Twins', isCorrect: false },
      { id: uuidv4(), text: 'Music', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '6e5f4a3b-2c1d-0e9f-8b7a-6e5f4a3b2c1d': {
    id: '6e5f4a3b-2c1d-0e9f-8b7a-6e5f4a3b2c1d',
    questionSlug: 'what-does-principle-of-connection-state',
    text: 'What does the principle of connection state?',
    options: [
      {
        id: uuidv4(),
        text: 'Elements that are visually connected are perceived as more related than elements with no connection',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'We need to connect our most important ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: "I just can't make no connection",
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from idea-generation-quiz.mdoc ---
  '7f6e5d4c-3b2a-109f-8e7d-7f6e5d4c3b2a': {
    id: '7f6e5d4c-3b2a-109f-8e7d-7f6e5d4c3b2a',
    questionSlug: 'key-to-effective-brainstorming',
    text: 'What is the key to making brainstorming as effective as possible?',
    options: [
      {
        id: uuidv4(),
        text: 'Conduct brainstorming sessions early in the day',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Eat lots of sugar', isCorrect: false },
      {
        id: uuidv4(),
        text: "Don't use brainstorming, it doesn't work",
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Engage in debate and dissent', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '8a7b6c5d-4e3f-210a-9f8e-8a7b6c5d4e3f': {
    id: '8a7b6c5d-4e3f-210a-9f8e-8a7b6c5d4e3f',
    questionSlug: 'cardinal-rules-of-brainstorming',
    text: 'What are our Cardinal Rules of brainstorming?',
    options: [
      { id: uuidv4(), text: 'Plan your participants', isCorrect: true },
      { id: uuidv4(), text: 'Focus on ideas', isCorrect: true },
      { id: uuidv4(), text: 'Structure the session', isCorrect: true },
      { id: uuidv4(), text: 'Establish rules in advance', isCorrect: true },
      { id: uuidv4(), text: 'Free associate', isCorrect: false },
      { id: uuidv4(), text: 'Only invite the single people', isCorrect: false },
      { id: uuidv4(), text: 'Focus on having fun', isCorrect: false },
      { id: uuidv4(), text: 'Eat, drink, and be merry', isCorrect: false },
      { id: uuidv4(), text: 'Conduct sessions on a Friday', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '9f8e7d6c-5b4a-3210-af9e-9f8e7d6c5b4a': {
    id: '9f8e7d6c-5b4a-3210-af9e-9f8e7d6c5b4a',
    questionSlug: 'golden-rule-in-this-lesson',
    text: 'What was the golden rule talked about in this lesson?',
    options: [
      {
        id: uuidv4(),
        text: 'Facts known by the audience go in the Introduction',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'We are creating our presentation to answer a question in the mind of our audience',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Our audience is the hero', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Our objective is to compel our audience to do something',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Follow a process', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Create ideas first, slides second',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from introductions-quiz.mdoc ---
  'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d6': {
    id: 'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d6',
    questionSlug: 'how-to-frame-finance-update-presentation',
    text: 'Hypothetical example: We are in the finance department and are giving an update. What is the best way for us to frame our presentation?',
    options: [
      { id: uuidv4(), text: 'Finance update', isCorrect: false },
      { id: uuidv4(), text: 'Cost cutting recommendations', isCorrect: false },
      { id: uuidv4(), text: 'Quarterly review', isCorrect: false },
      {
        id: uuidv4(),
        text: 'How did we perform last quarter, and what do we need to do differently?',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e7': {
    id: 'b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e7',
    questionSlug: 'why-are-we-creating-our-presentation',
    text: 'Why are we creating our presentation?',
    options: [
      {
        id: uuidv4(),
        text: 'To sell our product to a customer',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'To answer a question in the mind of our audience',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'To practice our PowerPoint skills',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'To raise money for our start-up',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Becuase we have been asked to by our boss',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'c2d3e4f5-a6b7-c8d9-e0f1-a2b3c4d5e6f8': {
    id: 'c2d3e4f5-a6b7-c8d9-e0f1-a2b3c4d5e6f8',
    questionSlug: 'four-parts-to-our-introduction',
    text: 'What are they four parts to our introduction?',
    options: [
      { id: uuidv4(), text: 'Context', isCorrect: true },
      { id: uuidv4(), text: 'Catalyst', isCorrect: true },
      { id: uuidv4(), text: 'Beginning', isCorrect: false },
      { id: uuidv4(), text: 'End', isCorrect: false },
      { id: uuidv4(), text: 'Middle', isCorrect: false },
      { id: uuidv4(), text: 'The Why', isCorrect: false },
      { id: uuidv4(), text: 'Answer', isCorrect: true },
      { id: uuidv4(), text: 'Question', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'd3e4f5a6-b7c8-d9e0-f1a2-b3c4d5e6f7a9': {
    id: 'd3e4f5a6-b7c8-d9e0-f1a2-b3c4d5e6f7a9',
    questionSlug: 'what-is-context-part-of-introduction',
    text: 'What is the Context part of the Introduction?',
    options: [
      {
        id: uuidv4(),
        text: 'The objective of the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'The background to the presentation that includes facts already known to your audience',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'The answer to the question', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'e4f5a6b7-c8d9-e0f1-a2b3-c4d5e6f7a8ba': {
    id: 'e4f5a6b7-c8d9-e0f1-a2b3-c4d5e6f7a8ba',
    questionSlug: 'what-is-catalyst-portion-of-introduction',
    text: 'What is the Catalyst portion of the Introduction?',
    options: [
      {
        id: uuidv4(),
        text: 'An event or trigger, sometimes referred to as the complication',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'The techniques that speed-up the development of a presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'A leading presentation development platform',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'What happened or changed that created the need for you to write this presentation',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'f5a6b7c8-d9e0-f1a2-b3c4-d5e6f7a8b9cb': {
    id: 'f5a6b7c8-d9e0-f1a2-b3c4-d5e6f7a8b9cb',
    questionSlug: 'what-is-question-portion-of-introduction',
    text: 'What is the Question portion of the Introduction?',
    options: [
      {
        id: uuidv4(),
        text: 'What we are trying to plant in the mind of the audience with the context and catalyst portions of the Introduction',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'The natural question that arises in the mind of the audience',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: "The 'topic' of the presentation",
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from our-process-quiz.mdoc ---
  '0a1b2c3d-4e5f-6a7b-8c9d-0a1b2c3d4e5f': {
    id: '0a1b2c3d-4e5f-6a7b-8c9d-0a1b2c3d4e5f',
    questionSlug: 'why-important-to-follow-process',
    text: 'Why is it important to follow a process to develop a presentation?',
    options: [
      {
        id: uuidv4(),
        text: "If you are really good, you don't need to follow a process!",
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Because creating presentations is all about left brain thinking',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Because there is not such thing as creativity',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Because it is very easy to focus on the wrong thing, and be led astray',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '1b2c3d4e-5f6a-7b8c-9d0a-1b2c3d4e5f6a': {
    id: '1b2c3d4e-5f6a-7b8c-9d0a-1b2c3d4e5f6a',
    questionSlug: 'what-is-1st-step-of-our-process',
    text: 'What is the 1st step of our process?',
    options: [
      { id: uuidv4(), text: 'Who is our audience?', isCorrect: true },
      {
        id: uuidv4(),
        text: 'Why are we speaking to our audience (identify their question)?',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'What is our answer?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'How will we deliver this presentation?',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '3d4e5f6a-7b8c-9d0a-1b2c-3d4e5f6a7b8c': {
    id: '3d4e5f6a-7b8c-9d0a-1b2c-3d4e5f6a7b8c',
    questionSlug: 'what-is-4th-step-of-our-process',
    text: 'What is the 4th step of our process?',
    options: [
      { id: uuidv4(), text: 'Who is our audience?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Why are we speaking to our audience (identify their question)?',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'What is our answer?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'How will we deliver this presentation?',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '4e5f6a7b-8c9d-0a1b-2c3d-4e5f6a7b8c9d': {
    id: '4e5f6a7b-8c9d-0a1b-2c3d-4e5f6a7b8c9d',
    questionSlug: 'our-first-step-the-who-meaning',
    text: "Our first step is 'The Who'. What do we mean by this?",
    options: [
      {
        id: uuidv4(),
        text: 'Determine who your audience truly is. Who are you speaking to?',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'The Who is a famous English rock band',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Determining our answer to a key question',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '5f6a7b8c-9d0a-1b2c-3d4e-5f6a7b8c9d0a': {
    id: '5f6a7b8c-9d0a-1b2c-3d4e-5f6a7b8c9d0a',
    questionSlug: 'second-step-the-why-meaning',
    text: "The second step in our process is 'The Why'. What do we mean by this?",
    options: [
      {
        id: uuidv4(),
        text: 'Determine the question inside the mind of our audience and what we want the audience to do a the end',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Determine our personal objective from creating the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'A process of deep existential soul searching to ensure you are a confident speaker',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '6a7b8c9d-0a1b-2c3d-4e5f-6a7b8c9d0a1b': {
    id: '6a7b8c9d-0a1b-2c3d-4e5f-6a7b8c9d0a1b',
    questionSlug: 'third-step-the-what-focus',
    text: "The third step in our process is 'The What'. What does 'The What' focus on?",
    options: [
      {
        id: uuidv4(),
        text: "Themes from Biggie Smalls' debut album 'Ready to Die' which featured 'The What' on track 9",
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Determining what types of slides we need to create',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Determining what it is we want our Audience to do as a result of the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Determining the answer to the question that has been planted in the mind of the audience',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '7b8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c': {
    id: '7b8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c',
    questionSlug: 'final-step-the-how-focus',
    text: "The final step in our process is 'The How'. What is the focus of 'The How'?",
    options: [
      {
        id: uuidv4(),
        text: 'How to create beautiful slides',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: "How to answer our audience's question",
        isCorrect: false,
      },
      { id: uuidv4(), text: 'This is how we do it!', isCorrect: false },
      {
        id: uuidv4(),
        text: 'How we will deliver the presentation',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '8c9d0a1b-2c3d-4e5f-6a7b-8c9d0a1b2c3d': {
    id: '8c9d0a1b-2c3d-4e5f-6a7b-8c9d0a1b2c3d',
    questionSlug: 'what-is-2nd-step-of-our-process',
    text: 'What is the 2nd step of our process?',
    options: [
      { id: uuidv4(), text: 'Who is our audience?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Why are we speaking to our audience (identify their question)?',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'What is our answer?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'How will we deliver this presentation?',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from overview-elements-of-design-quiz.mdoc ---
  '0b1c2d3e-4f5a-6b7c-8d9e-0b1c2d3e4f5a': {
    id: '0b1c2d3e-4f5a-6b7c-8d9e-0b1c2d3e4f5a',
    questionSlug: 'fundamental-elements-and-principles-of-design',
    text: 'What are some of the fundamental elements and principles of design?',
    options: [
      { id: uuidv4(), text: 'Shape & Form', isCorrect: true },
      { id: uuidv4(), text: 'Rick Astley', isCorrect: false },
      { id: uuidv4(), text: 'Color', isCorrect: true },
      { id: uuidv4(), text: 'Composition', isCorrect: true },
      { id: uuidv4(), text: 'Contrast', isCorrect: true },
      { id: uuidv4(), text: 'Line', isCorrect: true },
      { id: uuidv4(), text: 'Point', isCorrect: true },
      { id: uuidv4(), text: 'Negative Space', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from performance-quiz.mdoc ---
  '0c1d2e3f-4a5b-6c7d-8e9f-0c1d2e3f4a5b': {
    id: '0c1d2e3f-4a5b-6c7d-8e9f-0c1d2e3f4a5b',
    questionSlug: 'what-can-we-do-to-set-right-tone',
    text: 'What can we do to try and set the right tone?',
    options: [
      {
        id: uuidv4(),
        text: 'Send a well prepared agenda in advance',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Dress appropriately', isCorrect: true },
      {
        id: uuidv4(),
        text: 'Adopt the appropriate disposition for the meeting',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Tell a joke', isCorrect: false },
      { id: uuidv4(), text: 'Lead the group in song', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '1d2e3f4a-5b6c-7d8e-9f0a-1d2e3f4a5b6c': {
    id: '1d2e3f4a-5b6c-7d8e-9f0a-1d2e3f4a5b6c',
    questionSlug: 'things-to-do-to-manage-stress',
    text: 'What are some things you can do to manage stress?',
    options: [
      { id: uuidv4(), text: 'Quite your mind', isCorrect: true },
      { id: uuidv4(), text: 'Laugh', isCorrect: true },
      { id: uuidv4(), text: 'Primal therapy', isCorrect: false },
      { id: uuidv4(), text: 'Prepare', isCorrect: true },
      { id: uuidv4(), text: 'Breathe', isCorrect: true },
      {
        id: uuidv4(),
        text: "Don't worry about the presentation until the last minute",
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Talk to yourself like a crazy person',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '2e3f4a5b-6c7d-8e9f-0a1b-2e3f4a5b6c7d': {
    id: '2e3f4a5b-6c7d-8e9f-0a1b-2e3f4a5b6c7d',
    questionSlug: 'body-language-delivery-mistakes',
    text: 'What body language and delivery mistakes should you be on the lookout for?',
    options: [
      { id: uuidv4(), text: 'Verbal ticks', isCorrect: true },
      { id: uuidv4(), text: 'Talking to the screen', isCorrect: true },
      { id: uuidv4(), text: 'Closed posture', isCorrect: true },
      { id: uuidv4(), text: 'Being over prepared', isCorrect: false },
      { id: uuidv4(), text: 'Not displaying any emotion', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from preparation-practice-quiz.mdoc ---
  '3f4a5b6c-7d8e-9f0a-1b2c-3f4a5b6c7d8e': {
    id: '3f4a5b6c-7d8e-9f0a-1b2c-3f4a5b6c7d8e',
    questionSlug: 'four-factors-to-focus-on-preparation-practice',
    text: 'When preparing and practicing the delivery of your presentation, what four factors should you focus on?',
    options: [
      { id: uuidv4(), text: 'Timing of your jokes', isCorrect: false },
      { id: uuidv4(), text: 'Clarity', isCorrect: true },
      { id: uuidv4(), text: 'Hair, make-up and clothes', isCorrect: false },
      { id: uuidv4(), text: 'Pace', isCorrect: true },
      { id: uuidv4(), text: 'Engaging with the audience', isCorrect: true },
      { id: uuidv4(), text: 'Timbre of your voice', isCorrect: false },
      { id: uuidv4(), text: 'Smiling and making eye contact', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '4a5b6c7d-8e9f-0a1b-2c3d-4a5b6c7d8e9f': {
    id: '4a5b6c7d-8e9f-0a1b-2c3d-4a5b6c7d8e9f',
    questionSlug: 'first-step-recommended-preparation-process',
    text: 'What is the first step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '5b6c7d8e-9f0a-1b2c-3d4e-5b6c7d8e9f0a': {
    id: '5b6c7d8e-9f0a-1b2c-3d4e-5b6c7d8e9f0a',
    questionSlug: 'second-step-recommended-preparation-process',
    text: 'What is the second step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '6c7d8e9f-0a1b-2c3d-4e5f-6c7d8e9f0a1b': {
    id: '6c7d8e9f-0a1b-2c3d-4e5f-6c7d8e9f0a1b',
    questionSlug: 'third-step-recommended-preparation-process',
    text: 'What is the third step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '7d8e9f0a-1b2c-3d4e-5f6a-7d8e9f0a1b2c': {
    id: '7d8e9f0a-1b2c-3d4e-5f6a-7d8e9f0a1b2c',
    questionSlug: 'fourth-step-recommended-preparation-process',
    text: 'What is the fourth step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '8e9f0a1b-2c3d-4e5f-6a7b-8e9f0a1b2c3d': {
    id: '8e9f0a1b-2c3d-4e5f-6a7b-8e9f0a1b2c3d',
    questionSlug: 'fifth-step-recommended-preparation-process',
    text: 'What is the fifth step pf the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '9f0a1b2c-3d4e-5f6a-7b8c-9f0a1b2c3d4e': {
    id: '9f0a1b2c-3d4e-5f6a-7b8c-9f0a1b2c3d4e',
    questionSlug: 'sixth-step-recommended-preparation-process',
    text: 'What is the sixth step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '0a1b2c3d-4e5f-6a7b-8c9d-f0a1b2c3d4e5': {
    id: '0a1b2c3d-4e5f-6a7b-8c9d-f0a1b2c3d4e5',
    questionSlug: 'seventh-step-recommended-preparation-process',
    text: 'What is the seventh step of the recommended preparation process?',
    options: [
      {
        id: uuidv4(),
        text: 'Get a good night sleep and review the script once, maybe twice before the presentation',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Present to someone else. Get feedback',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the presentation two or three time working on length, simplifying language, and identifying likely questions',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Speak the presentation out loud and improvise. Test turns of phrases, identify key points that you want to make for each phrase',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Write down the verbal voice over and create a formal script',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Test the length of the presentation. Revise the deck, eliminating or combining slide ideas',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Run through the script a few more times and the put it aside',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from slide-composition-quiz.mdoc ---
  '0d1e2f3a-4b5c-6d7e-8f9a-0d1e2f3a4b5c': {
    id: '0d1e2f3a-4b5c-6d7e-8f9a-0d1e2f3a4b5c',
    questionSlug: 'what-goes-in-the-headline',
    text: 'What goes in the headline?',
    options: [
      { id: uuidv4(), text: 'Your footnotes', isCorrect: false },
      { id: uuidv4(), text: 'Your voice-over script', isCorrect: false },
      { id: uuidv4(), text: 'Your slide title', isCorrect: false },
      { id: uuidv4(), text: 'The main message of the slide', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '1e2f3a4b-5c6d-7e8f-9a0b-1e2f3a4b5c6d': {
    id: '1e2f3a4b-5c6d-7e8f-9a0b-1e2f3a4b5c6d',
    questionSlug: 'what-goes-in-the-body-of-the-slide',
    text: 'What goes in the body of the slide?',
    options: [
      {
        id: uuidv4(),
        text: 'The supporting evidence that supports the main message',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Text', isCorrect: false },
      { id: uuidv4(), text: 'Charts', isCorrect: false },
      { id: uuidv4(), text: 'Clip art', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '2f3a4b5c-6d7e-8f9a-0b1c-2f3a4b5c6d7e': {
    id: '2f3a4b5c-6d7e-8f9a-0b1c-2f3a4b5c6d7e',
    questionSlug: 'what-is-a-swipe-file',
    text: 'What is a swipe file?',
    options: [
      {
        id: uuidv4(),
        text: 'Collection of useful slide designs and frameworks that you can utilize for inspiration',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Hacker code to get free templates',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Where you store illicit data', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Another name for a garbage can',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '3a4b5c6d-7e8f-9a0b-1c2d-3a4b5c6d7e8f': {
    id: '3a4b5c6d-7e8f-9a0b-1c2d-3a4b5c6d7e8f',
    questionSlug: 'when-is-best-time-to-use-clip-art',
    text: 'When is the best time to use clip art?',
    options: [
      { id: uuidv4(), text: 'Never', isCorrect: true },
      {
        id: uuidv4(),
        text: 'In marketing and sales presentations, but not in finance presentations',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'No restrictions', isCorrect: false },
      {
        id: uuidv4(),
        text: 'When the clip art is of a cute cat',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '4b5c6d7e-8f9a-0b1c-2d3e-4b5c6d7e8f9a': {
    id: '4b5c6d7e-8f9a-0b1c-2d3e-4b5c6d7e8f9a',
    questionSlug: 'what-elements-can-be-repeated-on-all-slides',
    text: 'What elements can be repeated on all slides?',
    options: [
      { id: uuidv4(), text: 'Company logo', isCorrect: false },
      { id: uuidv4(), text: 'Location for a headline', isCorrect: true },
      { id: uuidv4(), text: 'Location for footnotes', isCorrect: true },
      {
        id: uuidv4(),
        text: 'Trademark and confidentiality messages',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Banners', isCorrect: false },
      { id: uuidv4(), text: 'Location  for page numbers', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from specialist-graphs-quiz.mdoc ---
  '5c6d7e8f-9a0b-1c2d-3e4f-5c6d7e8f9a0b': {
    id: '5c6d7e8f-9a0b-1c2d-3e4f-5c6d7e8f9a0b',
    questionSlug: 'what-do-we-use-tornado-diagrams-for',
    text: 'What do we use Tornado diagrams for?',
    options: [
      { id: uuidv4(), text: 'Composition of markets', isCorrect: false },
      { id: uuidv4(), text: 'Nominal comparison', isCorrect: false },
      { id: uuidv4(), text: 'Sensitivity analysis', isCorrect: true },
      {
        id: uuidv4(),
        text: 'To display how several variables change over time',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '6d7e8f9a-0b1c-2d3e-4f5a-6d7e8f9a0b1c': {
    id: '6d7e8f9a-0b1c-2d3e-4f5a-6d7e8f9a0b1c',
    questionSlug: 'when-do-we-use-a-bubble-chart',
    text: 'When do we use a Bubble Chart?',
    options: [
      { id: uuidv4(), text: 'For nominal comparisons', isCorrect: false },
      {
        id: uuidv4(),
        text: 'When your scatter plot is ugly',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'When you want to show three variables',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'To show a time series', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '7e8f9a0b-1c2d-3e4f-5a6b-7e8f9a0b1c2d': {
    id: '7e8f9a0b-1c2d-3e4f-5a6b-7e8f9a0b1c2d',
    questionSlug: 'what-chart-types-should-we-avoid',
    text: 'What chart types should we try and avoid using?',
    options: [
      { id: uuidv4(), text: 'Donut Chart', isCorrect: true },
      { id: uuidv4(), text: 'Waterfall Chart', isCorrect: false },
      { id: uuidv4(), text: 'Pie Chart', isCorrect: true },
      { id: uuidv4(), text: 'Circle chart', isCorrect: true },
      { id: uuidv4(), text: 'Anything 3-D', isCorrect: true },
      { id: uuidv4(), text: 'Merimekko Chart', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '8f9a0b1c-2d3e-4f5a-6b7c-8f9a0b1c2d3e': {
    id: '8f9a0b1c-2d3e-4f5a-6b7c-8f9a0b1c2d3e',
    questionSlug: 'best-use-of-waterfall-chart',
    text: 'What is the best use of a Waterfall Chart?',
    options: [
      { id: uuidv4(), text: 'To show a time series', isCorrect: false },
      {
        id: uuidv4(),
        text: 'To show how increases and decreases in a balance affect that balance over time',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'To show a part-to-whole relationship',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'As a fancy nominal comparison bar chart',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '9a0b1c2d-3e4f-5a6b-7c8d-9a0b1c2d3e4f': {
    id: '9a0b1c2d-3e4f-5a6b-7c8d-9a0b1c2d3e4f',
    questionSlug: 'common-uses-of-marimekko-chart',
    text: 'What is one of the more common uses of a Marimekko Chart?',
    options: [
      { id: uuidv4(), text: 'To confuse our audience', isCorrect: false },
      { id: uuidv4(), text: 'To show a time series', isCorrect: false },
      {
        id: uuidv4(),
        text: 'To show data on the Finnish textile industry',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'To display the composition of markets',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '0b1c2d3e-4f5a-6b7c-8d9e-f0a1b2c3d4e6': {
    id: '0b1c2d3e-4f5a-6b7c-8d9e-f0a1b2c3d4e6',
    questionSlug: 'what-are-motion-charts-used-for',
    text: 'What are Motion Charts used for?',
    options: [
      {
        id: uuidv4(),
        text: 'To explore how several variables change over time',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Sensitivity analysis', isCorrect: false },
      { id: uuidv4(), text: 'Nominal comparison', isCorrect: false },
      { id: uuidv4(), text: 'Composition of markets', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from storyboards-in-film-quiz.mdoc ---
  '0d1e2f3a-4b5c-6d7e-8f9a-1c2d3e4f5a6b': {
    id: '0d1e2f3a-4b5c-6d7e-8f9a-1c2d3e4f5a6b',
    questionSlug: 'what-is-a-storyboard',
    text: 'What is a storyboard?',
    options: [
      { id: uuidv4(), text: 'A blueprint of the movie', isCorrect: true },
      {
        id: uuidv4(),
        text: 'A cardboard board to pin up cartoon drawings',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'What happens when you are subject to a boring story',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'A Landyachts longboard design', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '1e2f3a4b-5c6d-7e8f-9a0b-2c1d0e9f5a6b': {
    id: '1e2f3a4b-5c6d-7e8f-9a0b-2c1d0e9f5a6b',
    questionSlug: 'who-invented-storyboards',
    text: 'Who invented storyboards?',
    options: [
      { id: uuidv4(), text: 'Steve Jobs', isCorrect: false },
      { id: uuidv4(), text: 'John Lasseter', isCorrect: false },
      { id: uuidv4(), text: 'Eric Goldberg', isCorrect: false },
      { id: uuidv4(), text: 'Walt Disney', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '2f3a4b5c-6d7e-8f9a-0b1c-3d2e1f0a9b8c': {
    id: '2f3a4b5c-6d7e-8f9a-0b1c-3d2e1f0a9b8c',
    questionSlug: 'great-innovation-of-storyboarding',
    text: 'What was the great innovation of storyboarding?',
    options: [
      {
        id: uuidv4(),
        text: 'The introduction of sound (Talkies)',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Allowed film makers to edit the film before making it',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'The introduction of color', isCorrect: false },
      {
        id: uuidv4(),
        text: 'The ability to draw your story',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from storyboards-in-presentations-quiz.mdoc ---
  '4a5b6c7d-8e9f-0a1b-2c3d-5e6f7a8b9c0d': {
    id: '4a5b6c7d-8e9f-0a1b-2c3d-5e6f7a8b9c0d',
    questionSlug: 'two-approaches-discussed-in-lesson',
    text: 'What are the two approaches discussed in the lesson?',
    options: [
      { id: uuidv4(), text: 'Black & white and full color', isCorrect: false },
      { id: uuidv4(), text: 'Animated and static', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Hand-drawn and computer assisted',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Text-based outlining and storyboarding',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '5b6c7d8e-9f0a-1b2c-3d4e-6f7a8b9c0d1e': {
    id: '5b6c7d8e-9f0a-1b2c-3d4e-6f7a8b9c0d1e',
    questionSlug: 'tools-recommended-for-storyboarding-presentations',
    text: 'What tools are recommended to use for storyboarding?',
    options: [
      { id: uuidv4(), text: 'A stone tablet and chisel', isCorrect: false },
      { id: uuidv4(), text: 'PowerPoint', isCorrect: false },
      { id: uuidv4(), text: 'Adobe Edge Animate', isCorrect: false },
      { id: uuidv4(), text: 'Pen and paper', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from tables-vs-graphs-quiz.mdoc ---
  '6c7d8e9f-0a1b-2c3d-4e5f-7a8b9c0d1e2f': {
    id: '6c7d8e9f-0a1b-2c3d-4e5f-7a8b9c0d1e2f',
    questionSlug: 'two-defining-characteristics-of-tables',
    text: 'What are the two defining characteristics of Tables?',
    options: [
      {
        id: uuidv4(),
        text: 'Information is encoded as text (words and numbers)',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'They are black and white', isCorrect: false },
      {
        id: uuidv4(),
        text: 'They are not as nice to look at as graphs',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'They are arranged in columns and rows',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '7d8e9f0a-1b2c-3d4e-5f6a-8b9c0d1e2f3a': {
    id: '7d8e9f0a-1b2c-3d4e-5f6a-8b9c0d1e2f3a',
    questionSlug: 'primary-benefits-of-a-table',
    text: 'What re some of the primary benefits of a table?',
    options: [
      {
        id: uuidv4(),
        text: 'Tables make it easy to look up individual values',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Tables make it easy to compare pairs of related values',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Textual encoding provides a level of precision that you cannot get in graphs',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Tables are easier to create than graphs',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Tables can handle larger data sets than graphs',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  '8e9f0a1b-2c3d-4e5f-6a7b-9c0d1e2f3a4b': {
    id: '8e9f0a1b-2c3d-4e5f-6a7b-9c0d1e2f3a4b',
    questionSlug: 'characteristics-that-define-graphs-tables-quiz',
    text: 'What are some of the characteristics that define graphs?',
    options: [
      {
        id: uuidv4(),
        text: 'Information is encoded as text (words and numbers)',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Axes provide scales (quantitative and categorical) that are used to label and assign value to the visual objects',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'They are nicer to look at than tables',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'They are typically in color', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Values are encoded as visual objects in relation to the axis',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Values are displayed within an area delineated by one or more axis',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '9f0a1b2c-3d4e-5f6a-7b8c-0d1e2f3a4b5c': {
    id: '9f0a1b2c-3d4e-5f6a-7b8c-0d1e2f3a4b5c',
    questionSlug: 'when-should-you-use-graphs-tables-quiz',
    text: 'When should you use graphs?',
    options: [
      {
        id: uuidv4(),
        text: 'When the message or story is contained in the shape of the data',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'When the display will be used to reveal relationships among whole sets of values',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: "When you need to 'sex-up' a slide",
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'When you have production support and they can create the graph for you',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from the-who-quiz.mdoc ---
  'a9e9b4bd-ead5-43ef-ac52-13585ba09f57': {
    id: 'a9e9b4bd-ead5-43ef-ac52-13585ba09f57',
    questionSlug: 'hero-of-our-presentation',
    text: 'Who is the hero of our presentation?',
    options: [
      { id: uuidv4(), text: 'Batman baby!', isCorrect: false },
      { id: uuidv4(), text: 'I am dammit!', isCorrect: false },
      { id: uuidv4(), text: 'The audience', isCorrect: true },
      { id: uuidv4(), text: 'Superman owns Batman', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e6': {
    id: 'b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e6',
    questionSlug: 'audience-map-used-for',
    text: 'What is the Audience Map used for?',
    options: [
      {
        id: uuidv4(),
        text: 'To be used to find your presentation venue. X marks the spot.',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'To help identify the main decision maker',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: "To develop a strategic approach for engaging with your 'room'",
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  '82d249e9-7d95-49cc-99b7-76578e8e0643': {
    id: '82d249e9-7d95-49cc-99b7-76578e8e0643',
    questionSlug: 'four-quadrants-of-audience-map',
    text: 'What are the 4 quadrants of the Audience Map?',
    options: [
      { id: uuidv4(), text: 'Senior, Junior, Advocate, Foe', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Personality, Power, Access, Resistance',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Friend, Foe, Advocate, Neutral',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'North, South East and West', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '0c09da5c-fff3-41f1-9505-da246426eb4e': {
    id: '0c09da5c-fff3-41f1-9505-da246426eb4e',
    questionSlug: 'question-for-personality-quadrant',
    text: "Pick the question that corresponds with the 'Personality' quadrant",
    options: [
      { id: uuidv4(), text: 'How do decisions get made?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'What is their style, energy level, and emotional state?',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: "Who are your 'friends in court'?",
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'How does your audience like to consume information?',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f7': {
    id: 'c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f7',
    questionSlug: 'question-for-access-quadrant',
    text: "Pick the question that corresponds with the 'Access' quadrant",
    options: [
      {
        id: uuidv4(),
        text: 'How does your audience like to consume information?',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'What is their style, energy level, and emotional state?',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'How do decisions get made?', isCorrect: false },
      {
        id: uuidv4(),
        text: "Who are your 'friends in court'?",
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'd2e3f4a5-b6c7-d8e9-f0a1-b2c3d4e5f6a8': {
    id: 'd2e3f4a5-b6c7-d8e9-f0a1-b2c3d4e5f6a8',
    questionSlug: 'question-for-power-quadrant',
    text: "Pick the question that corresponds with the 'Power' quadrant",
    options: [
      {
        id: uuidv4(),
        text: 'How does your audience like to consume information?',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: "Who are your 'friends in court'?",
        isCorrect: false,
      },
      { id: uuidv4(), text: 'How do decisions get made?', isCorrect: true },
      {
        id: uuidv4(),
        text: 'What is their style, energy level, and emotional state?',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'e3f4a5b6-c7d8-e9f0-a1b2-c3d4e5f6a7b9': {
    id: 'e3f4a5b6-c7d8-e9f0-a1b2-c3d4e5f6a7b9',
    questionSlug: 'question-for-resistance-quadrant',
    text: "Pick the question that corresponds with the 'Resistance' quadrant",
    options: [
      {
        id: uuidv4(),
        text: 'How does your audience like to consume information?',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: "Who are your 'friends in court'?",
        isCorrect: true,
      },
      { id: uuidv4(), text: 'How do decisions get made?', isCorrect: false },
      {
        id: uuidv4(),
        text: 'What is their style, energy level, and emotional state?',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from using-stories-quiz.mdoc ---
  'f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0ca': {
    id: 'f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0ca',
    questionSlug: 'why-are-stories-like-a-cup',
    text: 'Why are stories like a cup?',
    options: [
      {
        id: uuidv4(),
        text: "Because they are the brain's natural container for information",
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Because they are simple and straightforward',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Because you can put in them whatever you like',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Because they are delicate, and need to be handled carefully',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1db': {
    id: 'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1db',
    questionSlug: 'what-do-stories-add-to-presentations',
    text: 'What do stories add to our presentations? Why should be use them?',
    options: [
      { id: uuidv4(), text: 'Stories stop disagreement', isCorrect: true },
      { id: uuidv4(), text: 'Stories make people laugh', isCorrect: false },
      {
        id: uuidv4(),
        text: 'Stories lull your audience to sleep',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Stories make your message more memorable',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'Stories increase trust', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2ec': {
    id: 'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2ec',
    questionSlug: 'characteristics-that-make-stories-memorable',
    text: 'What characteristics make stories memorable?',
    options: [
      { id: uuidv4(), text: 'Concreteness', isCorrect: true },
      { id: uuidv4(), text: 'Unexpectedness', isCorrect: true },
      { id: uuidv4(), text: 'Credibility', isCorrect: true },
      { id: uuidv4(), text: 'Simplicity', isCorrect: true },
      { id: uuidv4(), text: 'Emotion', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from visual-perception-quiz.mdoc ---
  'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd': {
    id: 'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd',
    questionSlug: 'what-is-visual-thinking',
    text: 'What is visual thinking?',
    options: [
      { id: uuidv4(), text: 'Doodling', isCorrect: false },
      {
        id: uuidv4(),
        text: 'The phenomenon of thinking through visual processing',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'A thought cloud', isCorrect: false },
      { id: uuidv4(), text: 'Complex visual charts', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '2ce69acb-8d3f-41b3-9851-7cd5cd508dc8': {
    id: '2ce69acb-8d3f-41b3-9851-7cd5cd508dc8',
    questionSlug: 'match-mental-processing-conscious-sequential',
    text: "Match the type of mental processing with the characteristic: 'Conscious, sequential, and slow/hard'",
    options: [
      { id: uuidv4(), text: 'Attentive processing', isCorrect: true },
      { id: uuidv4(), text: 'Pre-attentive processing', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  '0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b': {
    id: '0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
    questionSlug: 'match-mental-processing-subconscious-rapid',
    text: "Match the type of mental processing with the characteristic: 'Below the level of consciousness, very rapid'",
    options: [
      { id: uuidv4(), text: 'Attentive processing', isCorrect: false },
      { id: uuidv4(), text: 'Pre-attentive processing', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  '74794823-dcb6-4f2d-a964-3e94f5863f5d': {
    id: '74794823-dcb6-4f2d-a964-3e94f5863f5d',
    questionSlug: 'visual-attribute-triggers-preattentive-processing',
    text: 'What are the visual attribute triggers of pre-attentive processing?',
    options: [
      { id: uuidv4(), text: 'Length', isCorrect: true },
      { id: uuidv4(), text: '3D position', isCorrect: false },
      { id: uuidv4(), text: 'Color', isCorrect: false },
      { id: uuidv4(), text: 'Size', isCorrect: true },
      { id: uuidv4(), text: 'Motion', isCorrect: false },
      { id: uuidv4(), text: 'Hue', isCorrect: true },
      { id: uuidv4(), text: 'Texture', isCorrect: false },
      { id: uuidv4(), text: 'Shape', isCorrect: true },
      { id: uuidv4(), text: 'Width', isCorrect: true },
      { id: uuidv4(), text: 'Orientation', isCorrect: true },
      { id: uuidv4(), text: 'Enclosure', isCorrect: true },
      { id: uuidv4(), text: '2D position', isCorrect: true },
      { id: uuidv4(), text: 'Intensity', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from why-next-steps-quiz.mdoc ---
  'f6a7b8c9-d0e1-f2a3-b4c5-a0b1c2d3e4f5': {
    id: 'f6a7b8c9-d0e1-f2a3-b4c5-a0b1c2d3e4f5',
    questionSlug: 'who-is-cicero-why-next-steps',
    text: 'Who is Cicero?',
    options: [
      { id: uuidv4(), text: 'A PowerPoint macro', isCorrect: false },
      {
        id: uuidv4(),
        text: "Some Italian dude who wasn't nearly as effective as Demosthenes",
        isCorrect: true,
      },
      { id: uuidv4(), text: "Drake's blind brother", isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'a7b8c9d0-e1f2-a3b4-c5d6-b1c2d3e4f5a6': {
    id: 'a7b8c9d0-e1f2-a3b4-c5d6-b1c2d3e4f5a6',
    questionSlug: 'ultimate-objective-of-presentation',
    text: 'What is the ultimate objective of our presentation?',
    options: [
      { id: uuidv4(), text: 'To prompt action!', isCorrect: true },
      { id: uuidv4(), text: 'To get it over with', isCorrect: false },
      {
        id: uuidv4(),
        text: 'To get praise for our slick PowerPoint skills',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'b8c9d0e1-f2a3-b4c5-d6e7-c2d3e4f5a6b7': {
    id: 'b8c9d0e1-f2a3-b4c5-d6e7-c2d3e4f5a6b7',
    questionSlug: 'reasonable-next-steps-after-presentation',
    text: 'Which of the following are reasonable next steps to follow your presentation?',
    options: [
      {
        id: uuidv4(),
        text: 'For your to develop a full proposal for the customer',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'For the customer to test your software as part of a trial',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'For the customer to schedule a follow-up demo with field staff',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'c9d0e1f2-a3b4-c5d6-e7f8-d3e4f5a6b7c8': {
    id: 'c9d0e1f2-a3b4-c5d6-e7f8-d3e4f5a6b7c8',
    questionSlug: 'where-should-next-steps-go-in-presentation',
    text: 'Where should the next steps go in your presentation?',
    options: [
      {
        id: uuidv4(),
        text: 'In your introduction, that is why you need to identify them at the beginning',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'In the footnotes', isCorrect: false },
      { id: uuidv4(), text: 'In a follow-up email', isCorrect: false },
      {
        id: uuidv4(),
        text: 'At the end of the presentation, but we need to identify their nature early as it might inform the development of the rest of the presentation',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  // --- Questions from structure-quiz.mdoc ---
  'd0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5': {
    // New UUID
    id: 'd0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5',
    questionSlug: 'what-is-the-principle-of-abstraction',
    text: 'What is the principle of Abstraction?',
    options: [
      {
        id: uuidv4(),
        text: 'A grouping principle, whereby a hierarchy is adhered to with higher levels of abstraction (less detail) placed near the top, with more specific concepts underneath',
        isCorrect: true,
      },
      { id: uuidv4(), text: 'A John Grisham novel', isCorrect: false },
      {
        id: uuidv4(),
        text: 'An approach whereby we simplify our question so profoundly that we reach a level of enlightenment',
        isCorrect: false,
      },
    ],
    explanation: defaultExplanation,
  },
  'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6': {
    // New UUID
    id: 'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6',
    questionSlug: 'which-lists-are-mece',
    text: 'Which lists are MECE (pick 2)',
    options: [
      { id: uuidv4(), text: 'Profit=revenue minus expenses', isCorrect: true },
      {
        id: uuidv4(),
        text: 'Star Wars films: New Hope, Empire, Revenge of the Sith',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'The global population broken down into age groups of 0-20 year-olds, 21-40 year-olds, 41-60 year-olds, 61-80 year-olds, and 81 and over',
        isCorrect: true,
      },
    ],
    explanation: defaultExplanation,
  },
  'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7': {
    // New UUID
    id: 'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7',
    questionSlug: 'three-golden-rules-abstraction-organizing-ideas',
    text: 'What are the three Golden Rules to follow when applying the principle of abstraction and organizing your ideas?',
    options: [
      {
        id: uuidv4(),
        text: 'Concepts should be arranged in the shape of a triangle',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Concepts at any level must be presented in a strict logical order',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Concepts in any group are always the same kind of idea',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Concepts or ideas at any level of your argument must be more abstract summaries of the concepts that are grouped below',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Concepts must be ordered alphabetically',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Ideas should be clever', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
  'a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8': {
    // New UUID
    id: 'a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8',
    questionSlug: 'match-argument-deductive-inductive-jill-bob',
    text: "Match the argument with whether it is deductive or inductive: 'Jill and Bob are friends. Jill likes to dance, cook and write. Bob likes to dance and cook. Therefore it can be assumed he also likes to write.",
    options: [
      { id: uuidv4(), text: 'Deductive', isCorrect: false },
      { id: uuidv4(), text: 'Inductive', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9': {
    // New UUID
    id: 'b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9',
    questionSlug: 'match-argument-deductive-inductive-dogs-mammals',
    text: "Match the argument with whether it is deductive or inductive: 'All dogs are mammals. All mammals have kidneys. Therefore all dogs have kidneys.",
    options: [
      { id: uuidv4(), text: 'Inductive', isCorrect: false },
      { id: uuidv4(), text: 'Deductive', isCorrect: true },
    ],
    explanation: defaultExplanation,
  },
  'c5d6e7f8-a9b0-c1d2-e3f4-a5b6c7d8e9f0': {
    // New UUID
    id: 'c5d6e7f8-a9b0-c1d2-e3f4-a5b6c7d8e9f0',
    questionSlug: 'what-is-the-rule-of-7-updated',
    text: 'What is the rule of 7 (updated)?',
    options: [
      {
        id: uuidv4(),
        text: 'There is no such thing as 7 or 9 of anything. We should seek to structure our ideas into groups of 4-5 or less',
        isCorrect: true,
      },
      {
        id: uuidv4(),
        text: 'Rule for calculating compound interest',
        isCorrect: false,
      },
      {
        id: uuidv4(),
        text: 'Organize your ideas into groups of 7',
        isCorrect: false,
      },
      { id: uuidv4(), text: 'Movie staring Brad Pitt', isCorrect: false },
    ],
    explanation: defaultExplanation,
  },
};

/**
 * Static definitions for all quizzes in the system.
 * This maps quiz slugs to their definitions and associated question IDs.
 */
export const QUIZZES: Record<string, QuizDefinition> = {
  'basic-graphs-quiz': {
    id: 'c11dbb26-7561-4d12-88c8-141c653a43fd',
    slug: 'basic-graphs-quiz',
    title: 'Standard Graphs Quiz',
    description: 'Quiz on basic graph concepts and their applications',
    passingScore: 70,
    questionIds: [
      'b5b2c11f-9b7a-4f3e-8c1d-0e9f5a4b3c2d',
      'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6e',
      'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a4321f',
      'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e60',
      '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c61',
      'd4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c62',
      'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c3',
      'a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1e',
    ],
  },
  'our-process-quiz': {
    id: '5a8d6b7c-9e2f-4d3a-8b1c-0f9a2e4d5c6b',
    slug: 'our-process-quiz',
    title: 'Our Process Quiz',
    description: 'Quiz for Our Process',
    passingScore: 70,
    questionIds: [
      '0a1b2c3d-4e5f-6a7b-8c9d-0a1b2c3d4e5f',
      '1b2c3d4e-5f6a-7b8c-9d0a-1b2c3d4e5f6a',
      '8c9d0a1b-2c3d-4e5f-6a7b-8c9d0a1b2c3d',
      '262b193c-b494-4aaa-868a-1b52cdd98c34',
      '3d4e5f6a-7b8c-9d0a-1b2c-3d4e5f6a7b8c',
      '4e5f6a7b-8c9d-0a1b-2c3d-4e5f6a7b8c9d',
      '5f6a7b8c-9d0a-1b2c-3d4e-5f6a7b8c9d0a',
      '6a7b8c9d-0a1b-2c3d-4e5f-6a7b8c9d0a1b',
      '7b8c9d0a-1b2c-3d4e-5f6a-7b8c9d0a1b2c',
    ],
  },
  'gestalt-principles-quiz': {
    id: '3c72b383-e17e-4b07-8a47-451cfbff29c0',
    slug: 'gestalt-principles-quiz',
    title: 'Gestalt Principles of Visual Perception Quiz',
    description: 'Quiz on Gestalt principles and their application in design',
    passingScore: 70,
    questionIds: [
      '3b2c1d0e-9f8e-7d6c-5b4a-3c2d1b0a9f8e',
      '4c3d2e1f-0a9b-8c7d-6b5a-4c3d2e1f0a9b',
      '5d4e3f2a-1b0c-9d8e-7c6b-5d4e3f2a1b0c',
      '6e5f4a3b-2c1d-0e9f-8b7a-6e5f4a3b2c1d',
    ],
  },
  'idea-generation-quiz': {
    id: 'a84d3844-8c19-4c82-8a98-902c530a1a99',
    slug: 'idea-generation-quiz',
    title: 'Idea Generation Quiz',
    description: 'Quiz for Idea Generation',
    passingScore: 70,
    questionIds: [
      '7f6e5d4c-3b2a-109f-8e7d-7f6e5d4c3b2a',
      '8a7b6c5d-4e3f-210a-9f8e-8a7b6c5d4e3f',
      '9f8e7d6c-5b4a-3210-af9e-9f8e7d6c5b4a',
    ],
  },
  'fact-persuasion-quiz': {
    id: '791e27de-2c98-49ef-b684-6c88667d1571',
    slug: 'fact-persuasion-quiz',
    title: 'Overview of Fact-based Persuasion Quiz',
    description: 'Quiz on using facts for persuasive presentations',
    passingScore: 70,
    questionIds: [
      '1f0e9d8c-7b6a-5f4e-3d2c-1b0a9f8e7d6c',
      '2a1b0c9d-8e7f-6a5b-4c3d-2e1f0a9b8c7d',
    ],
  },
  'overview-elements-of-design-quiz': {
    id: 'c7d8e9f0-a1b2-3c4d-5e6f-7a8b9c0d1e2f',
    slug: 'overview-elements-of-design-quiz',
    title: 'Overview of the Fundamental Elements of Design Quiz',
    description: 'Quiz for Overview of the Fundamental Elements of Design',
    passingScore: 70,
    questionIds: ['0b1c2d3e-4f5a-6b7c-8d9e-0b1c2d3e4f5a'],
  },
  'performance-quiz': {
    id: '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    slug: 'performance-quiz',
    title: 'Performance Quiz',
    description: 'Quiz for Performance',
    passingScore: 70,
    questionIds: [
      '0c1d2e3f-4a5b-6c7d-8e9f-0c1d2e3f4a5b',
      '1d2e3f4a-5b6c-7d8e-9f0a-1d2e3f4a5b6c',
      '2e3f4a5b-6c7d-8e9f-0a1b-2e3f4a5b6c7d',
    ],
  },
  'preparation-practice-quiz': {
    id: 'f1e2d3c4-b5a6-9876-5432-1098f7e6d5c4',
    slug: 'preparation-practice-quiz',
    title: 'Perparation & Practice Quiz',
    description: 'Quiz for Perparation & Practice',
    passingScore: 70,
    questionIds: [
      '3f4a5b6c-7d8e-9f0a-1b2c-3f4a5b6c7d8e',
      '4a5b6c7d-8e9f-0a1b-2c3d-4a5b6c7d8e9f',
      '5b6c7d8e-9f0a-1b2c-3d4e-5b6c7d8e9f0a',
      '6c7d8e9f-0a1b-2c3d-4e5f-6c7d8e9f0a1b',
      '7d8e9f0a-1b2c-3d4e-5f6a-7d8e9f0a1b2c',
      '8e9f0a1b-2c3d-4e5f-6a7b-8e9f0a1b2c3d',
      '9f0a1b2c-3d4e-5f6a-7b8c-9f0a1b2c3d4e',
      '0a1b2c3d-4e5f-6a7b-8c9d-f0a1b2c3d4e5',
    ],
  },
  'slide-composition-quiz': {
    id: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    slug: 'slide-composition-quiz',
    title: 'Slide Composition Quiz',
    description: 'Quiz for Slide Composition',
    passingScore: 70,
    questionIds: [
      '0d1e2f3a-4b5c-6d7e-8f9a-0d1e2f3a4b5c',
      '1e2f3a4b-5c6d-7e8f-9a0b-1e2f3a4b5c6d',
      '2f3a4b5c-6d7e-8f9a-0b1c-2f3a4b5c6d7e',
      '3a4b5c6d-7e8f-9a0b-1c2d-3a4b5c6d7e8f',
      '4b5c6d7e-8f9a-0b1c-2d3e-4b5c6d7e8f9a',
    ],
  },
  'specialist-graphs-quiz': {
    id: 'd4c3b2a1-f6e5-8a7b-9c0d-1e2f3a4b5c6d',
    slug: 'specialist-graphs-quiz',
    title: 'Specialist Graphs Quiz',
    description: 'Quiz for Specialist Graphs',
    passingScore: 70,
    questionIds: [
      '5c6d7e8f-9a0b-1c2d-3e4f-5c6d7e8f9a0b',
      '6d7e8f9a-0b1c-2d3e-4f5a-6d7e8f9a0b1c',
      '7e8f9a0b-1c2d-3e4f-5a6b-7e8f9a0b1c2d',
      '8f9a0b1c-2d3e-4f5a-6b7c-8f9a0b1c2d3e',
      '9a0b1c2d-3e4f-5a6b-7c8d-9a0b1c2d3e4f',
      '0b1c2d3e-4f5a-6b7c-8d9e-f0a1b2c3d4e6',
    ],
  },
  'storyboards-in-film-quiz': {
    id: '1e2f3a4b-5c6d-7e8f-9a0b-1c2d3e4f5a6b',
    slug: 'storyboards-in-film-quiz',
    title: 'Storyboards in Film Quiz',
    description: 'Quiz for Storyboards in Film',
    passingScore: 70,
    questionIds: [
      '0d1e2f3a-4b5c-6d7e-8f9a-1c2d3e4f5a6b',
      '1e2f3a4b-5c6d-7e8f-9a0b-2c1d0e9f5a6b',
      '2f3a4b5c-6d7e-8f9a-0b1c-3d2e1f0a9b8c',
    ],
  },
  'storyboards-in-presentations-quiz': {
    id: 'a6b5c4d3-e2f1-0a9b-8c7d-6e5f4a3b2c1d',
    slug: 'storyboards-in-presentations-quiz',
    title: 'Storyboards in Presentations Quiz',
    description: 'Quiz for Storyboards in Presentations',
    passingScore: 70,
    questionIds: [
      '4a5b6c7d-8e9f-0a1b-2c3d-5e6f7a8b9c0d',
      '5b6c7d8e-9f0a-1b2c-3d4e-6f7a8b9c0d1e',
    ],
  },
  'tables-vs-graphs-quiz': {
    id: 'f4e3d2c1-b6a5-8d7c-0e9f-5a4b3c2d1e0f',
    slug: 'tables-vs-graphs-quiz',
    title: 'Tables vs Graphs Quiz',
    description: 'Quiz for Tables vs Graphs',
    passingScore: 70,
    questionIds: [
      '6c7d8e9f-0a1b-2c3d-4e5f-7a8b9c0d1e2f',
      '7d8e9f0a-1b2c-3d4e-5f6a-8b9c0d1e2f3a',
      '8e9f0a1b-2c3d-4e5f-6a7b-9c0d1e2f3a4b',
      '9f0a1b2c-3d4e-5f6a-7b8c-0d1e2f3a4b5c',
    ],
  },
  'elements-of-design-detail-quiz': {
    id: '42564568-76bb-4405-88a9-8e9fd0a9154a',
    slug: 'elements-of-design-detail-quiz',
    title: 'The Fundamental Elements of Design in Detail Quiz',
    description: 'Comprehensive quiz on the detailed elements of design',
    passingScore: 70,
    questionIds: [
      'edf6e1f0-7c1b-4f1e-8d1c-0e9f5a4b3c2d',
      'd8c5b02e-6a9f-4e2d-7c0b-1d2e3f4a5b6c',
      'c7b4a93d-598e-4d3c-6bfa-2c1d0e9f5a4b',
      'b6a3984c-487d-4c4b-5ae9-3b0c1d2e3f4a',
      'a592875b-376c-4b5a-49d8-4a1b0c1d2e3f',
      '9481766a-265b-4a69-38c7-590a1b0c1d2e',
    ],
  },
  'the-who-quiz': {
    id: 'd5e6f7a8-b9c0-d1e2-f3a4-b5c6d7e8f9a0',
    slug: 'the-who-quiz',
    title: 'The Who Quiz',
    description: 'Quiz for The Who',
    passingScore: 70,
    questionIds: [
      'a9e9b4bd-ead5-43ef-ac52-13585ba09f57',
      'b0c1d2e3-f4a5-b6c7-d8e9-f0a1b2c3d4e6',
      '82d249e9-7d95-49cc-99b7-76578e8e0643',
      '0c09da5c-fff3-41f1-9505-da246426eb4e',
      'c1d2e3f4-a5b6-c7d8-e9f0-a1b2c3d4e5f7',
      'd2e3f4a5-b6c7-d8e9-f0a1-b2c3d4e5f6a8',
      'e3f4a5b6-c7d8-e9f0-a1b2-c3d4e5f6a7b9',
    ],
  },
  'introductions-quiz': {
    id: 'b75e29c7-1d9f-4f41-8c91-a72847d13747',
    slug: 'introductions-quiz',
    title: 'The Why (Introductions) Quiz',
    description: 'Quiz for The Why (Introductions)',
    passingScore: 70,
    questionIds: [
      'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d6',
      'b1c2d3e4-f5a6-b7c8-d9e0-f1a2b3c4d5e7',
      'c2d3e4f5-a6b7-c8d9-e0f1-a2b3c4d5e6f8',
      'd3e4f5a6-b7c8-d9e0-f1a2-b3c4d5e6f7a9',
      'e4f5a6b7-c8d9-e0f1-a2b3-c4d5e6f7a8ba',
      'f5a6b7c8-d9e0-f1a2-b3c4-d5e6f7a8b9cb',
    ],
  },
  'why-next-steps-quiz': {
    id: 'e8f9a0b1-c2d3-e4f5-a6b7-c8d9e0f1a2b3',
    slug: 'why-next-steps-quiz',
    title: 'The Why (Next Steps) Quiz',
    description: 'Quiz for The Why (Next Steps)',
    passingScore: 70,
    questionIds: [
      'f6a7b8c9-d0e1-f2a3-b4c5-a0b1c2d3e4f5',
      'a7b8c9d0-e1f2-a3b4-c5d6-b1c2d3e4f5a6',
      'b8c9d0e1-f2a3-b4c5-d6e7-c2d3e4f5a6b7',
      'c9d0e1f2-a3b4-c5d6-e7f8-d3e4f5a6b7c8',
    ],
  },
  'using-stories-quiz': {
    id: 'a0b1c2d3-e4f5-a6b7-c8d9-e0f1a2b3c4d5',
    slug: 'using-stories-quiz',
    title: 'Using Stories Quiz',
    description: 'Quiz for Using Stories',
    passingScore: 70,
    questionIds: [
      'f6a7b8c9-d0e1-f2a3-b4c5-d6e7f8a9b0ca',
      'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1db',
      'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2ec',
    ],
  },
  'visual-perception-quiz': {
    id: 'f9e8d7c6-b5a4-3210-f9e8-d7c6b5a43210',
    slug: 'visual-perception-quiz',
    title: 'Visual Perception and Communication Quiz',
    description: 'Quiz for Visual Perception and Communication',
    passingScore: 70,
    questionIds: [
      'fc904a38-82f9-43aa-a0fd-1ae817d2c1dd',
      '2ce69acb-8d3f-41b3-9851-7cd5cd508dc8',
      '0e1f2a3b-4c5d-6e7f-8a9b-0c1d2e3f4a5b',
      '74794823-dcb6-4f2d-a964-3e94f5863f5d',
    ],
  },
  'structure-quiz': {
    id: 'c1d2e3f4-a5b6-7c8d-9e0f-1a2b3c4d5e6f',
    slug: 'structure-quiz',
    title: 'What is Structure? Quiz',
    description: 'Quiz for What is Structure?',
    passingScore: 70,
    questionIds: [
      'd0e1f2a3-b4c5-d6e7-f8a9-b0c1d2e3f4a5',
      'e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6',
      'f2a3b4c5-d6e7-f8a9-b0c1-d2e3f4a5b6c7',
      'a3b4c5d6-e7f8-a9b0-c1d2-e3f4a5b6c7d8',
      'b4c5d6e7-f8a9-b0c1-d2e3-f4a5b6c7d8e9',
      'c5d6e7f8-a9b0-c1d2-e3f4-a5b6c7d8e9f0',
    ],
  },
};

// Helper function to get a quiz by slug
export function getQuizBySlug(slug: string): QuizDefinition | undefined {
  return QUIZZES[slug];
}

// Helper function to get a quiz by ID
export function getQuizById(id: string): QuizDefinition | undefined {
  return Object.values(QUIZZES).find((quiz) => quiz.id === id);
}

// Helper function to get a question by ID
export function getQuizQuestionById(
  id: string,
): QuizQuestionDefinition | undefined {
  return ALL_QUIZ_QUESTIONS[id];
}
