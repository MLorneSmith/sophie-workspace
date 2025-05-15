import { v4 as uuidv4 } from 'uuid';

// Define the structure for a download definition
export type DownloadDefinition = {
  id: string; // Predefined or generated UUID
  key: string; // Unique, human-readable key
  title: string; // Human-readable title
  filename: string; // Actual filename in R2
  description?: string;
  url: string; // Full R2 URL (or R2 key)
  type: 'pdf' | 'zip' | 'png' | 'jpg' | 'webp' | 'mdoc' | 'yaml' | 'html' | 'json' | 'ts' | 'other'; // MIME type or file extension based
  altText?: string; // Especially for images
  width?: number;
  height?: number;
  // Potentially add: sourceFileOriginalPath?: string; // e.g., the frontmatter path from image-mappings.ts
};

// Base URL for R2 storage - **NOTE: This needs to be confirmed and potentially made configurable**
const R2_BASE_URL = 'YOUR_R2_BASE_URL_HERE'; // TODO: Replace with actual R2 base URL

/**
 * Single Source of Truth for all downloadable and media items.
 * This consolidates information from various previous sources.
 */
export const DOWNLOAD_DEFINITIONS: DownloadDefinition[] = [
  // --- From packages/payload-local-init/data/mappings/download-mappings.ts (DOWNLOAD_ID_MAP) ---
  {
    id: '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1',
    key: 'slide-templates',
    title: 'SlideHeroes Presentation Template',
    filename: 'SlideHeroes Presentation Template.zip', // Inferred from key/title
    url: `${R2_BASE_URL}/SlideHeroes Presentation Template.zip`, // Assuming direct filename path
    type: 'zip',
  },
  {
    id: 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6',
    key: 'swipe-file',
    title: 'SlideHeroes Swipe File',
    filename: 'SlideHeroes Swipe File.zip', // Inferred
    url: `${R2_BASE_URL}/SlideHeroes Swipe File.zip`, // Assuming direct filename path
    type: 'zip',
  },
  // Lesson PDFs - using consistent naming convention for keys and filenames
  {
    id: 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28',
    key: 'our-process-slides',
    title: 'Our Process Slides',
    filename: '201 Our Process.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/201 Our Process.pdf`,
    type: 'pdf',
  },
  {
    id: 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456',
    key: 'the-who-slides',
    title: 'The Who Slides',
    filename: '202 The Who.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/202 The Who.pdf`,
    type: 'pdf',
  },
  {
    id: 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593',
    key: 'introduction-slides',
    title: 'The Why - Introductions Slides',
    filename: '203 The Why - Introductions.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/203 The Why - Introductions.pdf`,
    type: 'pdf',
  },
  {
    id: 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04',
    key: 'next-steps-slides',
    title: 'The Why - Next Steps Slides',
    filename: '204 The Why - Next Steps.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/204 The Why - Next Steps.pdf`,
    type: 'pdf',
  },
  {
    id: 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18',
    key: 'idea-generation-slides',
    title: 'Idea Generation Slides',
    filename: '205 Idea Generation.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/205 Idea Generation.pdf`,
    type: 'pdf',
  },
  {
    id: 'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29',
    key: 'what-is-structure-slides',
    title: 'What is Structure Slides',
    filename: '206 What is Structure.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/206 What is Structure.pdf`,
    type: 'pdf',
  },
  {
    id: 'e017b153-4d96-6fb8-c0e2-354f9d2c7130',
    key: 'using-stories-slides',
    title: 'Using Stories Slides',
    filename: '207 Using Stories.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/207 Using Stories.pdf`,
    type: 'pdf',
  },
  {
    id: 'f158c264-5e07-71c9-d1f3-165e0e3d8541',
    key: 'storyboards-presentations-slides',
    title: 'Storyboards in Presentations Slides',
    filename: '208 Storyboards in Presentations.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/208 Storyboards in Presentations.pdf`,
    type: 'pdf',
  },
  {
    id: '1219d375-6f18-85d0-e214-276d1f4e9152',
    key: 'visual-perception-slides',
    title: 'Visual Perception Slides',
    filename: '209 Visual Perception.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/209 Visual Perception.pdf`,
    type: 'pdf',
  },
  {
    id: '3320e486-7129-91e1-f355-487a215f0263',
    key: 'fundamental-elements-slides',
    title: 'Fundamental Elements Slides',
    filename: '210 Fundamental Elements.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/210 Fundamental Elements.pdf`,
    type: 'pdf',
  },
  {
    id: '44a1f597-8530-02f2-14a6-598a356a1a74',
    key: 'gestalt-principles-slides',
    title: 'Gestalt Principles Slides',
    filename: '211 Gestalt Principles.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/211 Gestalt Principles.pdf`,
    type: 'pdf',
  },
  {
    id: '55b21608-9a41-1a13-5527-a09a4a7a2b85',
    key: 'slide-composition-slides',
    title: 'Slide Composition Slides',
    filename: '212 Slide Composition.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/212 Slide Composition.pdf`,
    type: 'pdf',
  },
  {
    id: '66c35719-0252-2b54-a6a8-a10b5a8a3c96',
    key: 'tables-vs-graphs-slides',
    title: 'Tables vs Graphs Slides',
    filename: '213 Tables vs Graphs.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/213 Tables vs Graphs.pdf`,
    type: 'pdf',
  },
  {
    id: '77d4a820-1a63-3ca5-a7b9-b21c6a9a4d07',
    key: 'standard-graphs-slides',
    title: 'Standard Graphs Slides',
    filename: '214 Standard Graphs.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/214 Standard Graphs.pdf`,
    type: 'pdf',
  },
  {
    id: '88e5a931-2b74-4da6-a8c0-a32d7b0a5e18',
    key: 'fact-based-persuasion-slides',
    title: 'Fact-based Persuasion Slides',
    filename: '215 Fact-based Persuasion.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/215 Fact-based Persuasion.pdf`,
    type: 'pdf',
  },
  {
    id: '99f6a042-3c85-5ea7-b9d1-a43e8c1b6f29',
    key: 'specialist-graphs-slides',
    title: 'Specialist Graphs Slides',
    filename: '216 Specialist Graphs.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/216 Specialist Graphs.pdf`,
    type: 'pdf',
  },
  {
    id: 'aa07b153-4d96-6fb8-c0e2-b54f9d2c7a30',
    key: 'preparation-practice-slides',
    title: 'Preparation and Practice Slides',
    filename: '217 Preparation and Practice.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/217 Preparation and Practice.pdf`,
    type: 'pdf',
  },
  {
    id: 'bb18c264-5e07-71c9-d1f3-c65e0e3d8b41',
    key: 'performance-slides',
    title: 'Performance Slides',
    filename: '218 Performance.pdf', // From download-mappings.ts comment
    url: `${R2_BASE_URL}/218 Performance.pdf`,
    type: 'pdf',
  },

  // --- From packages/payload-local-init/data/mappings/image-mappings.ts ---
  // Need to generate UUIDs and keys, use filenames from image-mappings.ts
  {
    id: uuidv4(), // New UUID
    key: 'basic-graphs-image', // Derived from frontmatter path
    title: 'Basic Graphs Image', // Derived
    filename: 'standard_graphs.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/standard_graphs.png`,
    type: 'png',
    altText: 'Basic Graphs Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'gestalt-principles-image', // Derived
    title: 'Gestalt Principles Image', // Derived
    filename: 'gestalt_principles_of_perception.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/gestalt_principles_of_perception.png`,
    type: 'png',
    altText: 'Gestalt Principles Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'idea-generation-image', // Derived
    title: 'Idea Generation Image', // Derived
    filename: 'idea_generation.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/idea_generation.png`,
    type: 'png',
    altText: 'Idea Generation Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'lesson-0-image', // Derived
    title: 'Lesson 0 Image', // Derived
    filename: 'lesson_zero.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/lesson_zero.png`,
    type: 'png',
    altText: 'Lesson 0 Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'our-process-image', // Derived
    title: 'Our Process Image', // Derived
    filename: 'our_process.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/our_process.png`,
    type: 'png',
    altText: 'Our Process Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'fundamental-design-overview-image', // Derived
    title: 'Fundamental Design Overview Image', // Derived
    filename: 'overview_elements_design.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/overview_elements_design.png`,
    type: 'png',
    altText: 'Fundamental Design Overview Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'performance-image', // Derived
    title: 'Performance Image', // Derived
    filename: 'performance.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/performance.png`,
    type: 'png',
    altText: 'Performance Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'preparation-practice-image', // Derived
    title: 'Preparation Practice Image', // Derived
    filename: 'preparation_practice.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/preparation_practice.png`,
    type: 'png',
    altText: 'Preparation Practice Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'skills-self-assessment-image', // Derived
    title: 'Skills Self Assessment Image', // Derived
    filename: 'self_assessment.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/self_assessment.png`,
    type: 'png',
    altText: 'Skills Self Assessment Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'slide-composition-image', // Derived
    title: 'Slide Composition Image', // Derived
    filename: 'slide_composition.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/slide_composition.png`,
    type: 'png',
    altText: 'Slide Composition Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'specialist-graphs-image', // Derived
    title: 'Specialist Graphs Image', // Derived
    filename: 'specialist_graphs.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/specialist_graphs.png`,
    type: 'png',
    altText: 'Specialist Graphs Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'storyboards-film-image', // Derived
    title: 'Storyboards Film Image', // Derived
    filename: 'storyboards_in_film.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/storyboards_in_film.png`,
    type: 'png',
    altText: 'Storyboards Film Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'storyboards-presentations-image', // Derived
    title: 'Storyboards Presentations Image', // Derived
    filename: 'storyboards_in_presentations.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/storyboards_in_presentations.png`,
    type: 'png',
    altText: 'Storyboards Presentations Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'tables-vs-graphs-image', // Derived
    title: 'Tables vs Graphs Image', // Derived
    filename: 'tables_vs_graphs.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/tables_vs_graphs.png`,
    type: 'png',
    altText: 'Tables vs Graphs Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'the-who-image', // Derived
    title: 'The Who Image', // Derived
    filename: 'the_who.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/the_who.png`,
    type: 'png',
    altText: 'The Who Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'the-why-introductions-image', // Derived
    title: 'The Why Introductions Image', // Derived
    filename: 'the_why_introductions.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/the_why_introductions.png`,
    type: 'png',
    altText: 'The Why Introductions Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'the-why-next-steps-image', // Derived
    title: 'The Why Next Steps Image', // Derived
    filename: 'the_why_next_steps.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/the_why_next_steps.png`,
    type: 'png',
    altText: 'The Why Next Steps Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'tools-and-resources-image', // Derived
    title: 'Tools and Resources Image', // Derived
    filename: 'tools_resources.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/tools_resources.png`,
    type: 'png',
    altText: 'Tools and Resources Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'using-stories-image', // Derived
    title: 'Using Stories Image', // Derived
    filename: 'using_stories.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/using_stories.png`,
    type: 'png',
    altText: 'Using Stories Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'visual-perception-image', // Derived
    title: 'Visual Perception Image', // Derived
    filename: 'visual_perception.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/visual_perception.png`,
    type: 'png',
    altText: 'Visual Perception Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'fact-based-persuasion-image', // Derived
    title: 'Fact-based Persuasion Image', // Derived
    filename: 'fact_based_persuasion_overview.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/fact_based_persuasion_overview.png`,
    type: 'png',
    altText: 'Fact-based Persuasion Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'what-is-structure-image', // Derived
    title: 'What is Structure Image', // Derived
    filename: 'what_structure.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/what_structure.png`,
    type: 'png',
    altText: 'What is Structure Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'before-we-begin-image', // Derived
    title: 'Before We Begin Image', // Derived
    filename: 'before_we_begin.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/before_we_begin.png`,
    type: 'png',
    altText: 'Before We Begin Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'fundamental-design-detail-image', // Derived
    title: 'Fundamental Design Detail Image', // Derived
    filename: 'detail_elements_of_design.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/detail_elements_of_design.png`,
    type: 'png',
    altText: 'Fundamental Design Detail Image', // Derived
  },
  // Blog Post Images - Need to generate UUIDs and keys, use filenames from image-mappings.ts
  {
    id: uuidv4(), // New UUID
    key: 'art-craft-business-presentation-creation-image', // Derived
    title: 'Art Craft Business Presentation Creation Image', // Derived
    filename: 'Art Craft of Presentation Creation.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/Art Craft of Presentation Creation.png`,
    type: 'png',
    altText: 'Art Craft Business Presentation Creation Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'pitch-deck-image', // Derived
    title: 'Pitch Deck Image', // Derived
    filename: 'pitch-deck-image.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/pitch-deck-image.png`,
    type: 'png',
    altText: 'Pitch Deck Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'powerpoint-presentations-defense-image', // Derived
    title: 'Powerpoint Presentations Defense Image', // Derived
    filename: 'Defense of PowerPoint.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/Defense of PowerPoint.png`,
    type: 'png',
    altText: 'Powerpoint Presentations Defense Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'presentation-review-bcg-image', // Derived
    title: 'Presentation Review BCG Image', // Derived
    filename: 'BCG-teardown-optimized.jpg', // From image-mappings.ts
    url: `${R2_BASE_URL}/BCG-teardown-optimized.jpg`,
    type: 'jpg',
    altText: 'Presentation Review BCG Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'presentation-tips-image', // Derived
    title: 'Presentation Tips Image', // Derived
    filename: 'Presentation Tips Optimized.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/Presentation Tips Optimized.png`,
    type: 'png',
    altText: 'Presentation Tips Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'presentation-tools-image', // Derived
    title: 'Presentation Tools Image', // Derived
    filename: 'Presentation Tools-optimized.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/Presentation Tools-optimized.png`,
    type: 'png',
    altText: 'Presentation Tools Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'public-speaking-anxiety-image', // Derived
    title: 'Public Speaking Anxiety Image', // Derived
    filename: 'Conquering Public Speaking Anxiety.png', // From image-mappings.ts
    url: `${R2_BASE_URL}/Conquering Public Speaking Anxiety.png`,
    type: 'png',
    altText: 'Public Speaking Anxiety Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'seneca-partnership-image', // Derived
    title: 'Seneca Partnership Image', // Derived
    filename: 'Seneca Partnership.webp', // From image-mappings.ts
    url: `${R2_BASE_URL}/Seneca Partnership.webp`,
    type: 'webp',
    altText: 'Seneca Partnership Image', // Derived
  },
  {
    id: uuidv4(), // New UUID
    key: 'typology-business-charts-image', // Derived
    title: 'Typology Business Charts Image', // Derived
    filename: 'business-charts.jpg', // From image-mappings.ts
    url: `${R2_BASE_URL}/business-charts.jpg`,
    type: 'jpg',
    altText: 'Typology Business Charts Image', // Derived
  },

  // TODO: Add other downloads/media from r2-downloads-list.ts and r2-media-list.ts if not already covered
  // TODO: Verify URLs and types are correct based on actual R2 storage
];
