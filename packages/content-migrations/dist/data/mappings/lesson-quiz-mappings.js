"use strict";
/**
 * Hard-coded mapping between lesson slugs and quiz slugs
 * This ensures consistent relationships between lessons and quizzes
 * even if the raw data doesn't have explicit quiz references
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.lessonQuizMapping = void 0;
exports.lessonQuizMapping = {
    // Format: lessonSlug: quizSlug
    'our-process': 'our-process-quiz',
    'the-who': 'the-who-quiz',
    'the-why-introductions': 'introductions-quiz',
    'the-why-next-steps': 'why-next-steps-quiz',
    'idea-generation': 'idea-generation-quiz',
    'what-is-structure': 'structure-quiz',
    'using-stories': 'using-stories-quiz',
    'storyboards-film': 'storyboards-in-film-quiz',
    'storyboards-presentations': 'storyboards-in-presentations-quiz',
    'visual-perception': 'visual-perception-quiz',
    'fundamental-design-overview': 'overview-elements-of-design-quiz',
    'fundamental-design-detail': 'elements-of-design-detail-quiz',
    'gestalt-principles': 'gestalt-principles-quiz',
    'slide-composition': 'slide-composition-quiz',
    'tables-vs-graphs': 'tables-vs-graphs-quiz',
    'basic-graphs': 'basic-graphs-quiz',
    'fact-based-persuasion': 'fact-persuasion-quiz',
    'specialist-graphs': 'specialist-graphs-quiz',
    'preparation-practice': 'preparation-practice-quiz',
    performance: 'performance-quiz',
};
