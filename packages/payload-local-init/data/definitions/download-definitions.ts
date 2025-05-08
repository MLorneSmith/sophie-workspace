/**
/**
 * Defines all downloadable and media items in the system.
 * This is the SINGLE SOURCE OF TRUTH for download and media data.
 */

export const DOWNLOAD_DEFINITIONS = [
  // Course Resources Downloads (from download-id-map.ts)
  {
    id: '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', // slide-templates
    key: 'slide-templates',
    title: 'SlideHeroes Presentation Template',
    filename: 'SlideHeroes Presentation Template.zip',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/SlideHeroes%20Presentation%20Template.zip', // Assuming a standard URL structure
    type: 'zip',
    description: 'A template for creating presentations.',
  },
  {
    id: 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6', // swipe-file
    key: 'swipe-file',
    title: 'SlideHeroes Swipe File',
    filename: 'SlideHeroes Swipe File.zip',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/SlideHeroes%20Swipe%20File.zip', // Assuming a standard URL structure
    type: 'zip',
    description: 'A collection of presentation examples.',
  },

  // Lesson PDF Downloads (from lesson-definitions.yaml and download-id-map.ts)
  {
    id: 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', // our-process-slides
    key: 'our-process-slides',
    title: 'Our Process Slides',
    filename: '201 Our Process.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf',
    type: 'pdf',
    description: 'Slides for the Our Process lesson.',
  },
  {
    id: 'e8f21b37-6c94-44a3-994b-29937ee870ec', // the-who-slides (Using ID from lesson-definitions.yaml)
    key: 'the-who-slides',
    title: 'The Who Slides',
    filename: '202 The Who.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf',
    type: 'pdf',
    description: 'Slides for The Who lesson.',
  },
  {
    id: '4197bbda-80a4-4cf6-b09e-668be2416115', // introduction-slides (Using ID from lesson-definitions.yaml)
    key: 'introduction-slides',
    title: 'The Why - Introductions Slides',
    filename: '203 The Why Introductions.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/203%20The%20Why%20-%20Introductions.pdf',
    type: 'pdf',
    description: 'Slides for The Why: Introductions lesson.',
  },
  {
    id: 'cf729d29-8734-4805-aded-c2d5ca5c463e', // next-steps-slides (Using ID from lesson-definitions.yaml)
    key: 'next-steps-slides',
    title: 'The Why - Next Steps Slides',
    filename: '204 The Why Next Steps.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/204%20The%20Why%20-%20Next%20Steps.pdf',
    type: 'pdf',
    description: 'Slides for The Why: Next Steps lesson.',
  },
  {
    id: '795e647c-076d-4752-8f5e-9e22f9a1e5c7', // idea-generation-slides (Using ID from lesson-definitions.yaml)
    key: 'idea-generation-slides',
    title: 'Idea Generation Slides',
    filename: '205 Idea Generation.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/205%20Idea%20Generation.pdf',
    type: 'pdf',
    description: 'Slides for the Idea Generation lesson.',
  },
  {
    id: 'ff79145d-c2f7-468f-bf11-38ef3cc3783b', // what-is-structure-slides (Using ID from lesson-definitions.yaml)
    key: 'what-is-structure-slides',
    title: 'What is Structure Slides',
    filename: '206 What is Structure.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/206%20What%20is%20Structure.pdf',
    type: 'pdf',
    description: 'Slides for the What is Structure? lesson.',
  },
  {
    id: 'a6ef3743-5ee2-457e-a054-fc10c53aa842', // using-stories-slides (Using ID from lesson-definitions.yaml)
    key: 'using-stories-slides',
    title: 'Using Stories Slides',
    filename: '207 Using Stories.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/207%20Using%20Stories.pdf',
    type: 'pdf',
    description: 'Slides for the Using Stories lesson.',
  },
  {
    id: 'fe87137c-66c5-44ac-83d7-0868f078af92', // storyboards-presentations-slides (Using ID from lesson-definitions.yaml)
    key: 'storyboards-presentations-slides',
    title: 'Storyboards in Presentations Slides',
    filename: '208 Storyboards in Presentations.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/208%20Storyboards%20in%20Presentations.pdf',
    type: 'pdf',
    description: 'Slides for the Storyboards in Presentations lesson.',
  },
  {
    id: '3a720817-1aae-4080-8f50-f81179d3dbd0', // visual-perception-slides (Using ID from lesson-definitions.yaml)
    key: 'visual-perception-slides',
    title: 'Visual Perception and Communication Slides',
    filename: '209 Visual Perception and Communication.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/209%20Visual%20Perception.pdf',
    type: 'pdf',
    description: 'Slides for the Visual Perception and Communication lesson.',
  },
  {
    id: '199e1eb2-f307-4e25-8e20-434ce7331d06', // fundamental-elements-slides (Using ID from lesson-definitions.yaml)
    key: 'fundamental-elements-slides',
    title: 'Fundamental Elements of Design Slides',
    filename: '210 Fundamental Elements of Design.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/210%20Fundamental%20Elements.pdf',
    type: 'pdf',
    description: 'Slides for the Fundamental Elements of Design lesson.',
  },
  {
    id: 'a41f704e-d373-421c-87ff-21fd58238c2d', // gestalt-principles-slides (Using ID from lesson-definitions.yaml)
    key: 'gestalt-principles-slides',
    title: 'Gestalt Principles Slides',
    filename: '211 Gestalt Principles.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/504%20Gestalt%20Principles%20of%20Visual%20Perception.pdf', // Note: URL filename mismatch
    type: 'pdf',
    description: 'Slides for the Gestalt Principles lesson.',
  },
  {
    id: 'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d', // slide-composition-slides (Using ID from lesson-definitions.yaml)
    key: 'slide-composition-slides',
    title: 'Slide Composition Slides',
    filename: '212 Slide Composition.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/212%20Slide%20Composition.pdf',
    type: 'pdf',
    description: 'Slides for the Slide Composition lesson.',
  },
  {
    id: '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458', // tables-vs-graphs-slides (Using ID from lesson-definitions.yaml)
    key: 'tables-vs-graphs-slides',
    title: 'Tables vs Graphs Slides',
    filename: '213 Tables vs Graphs.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/213%20Tables%20vs%20Graphs.pdf',
    type: 'pdf',
    description: 'Slides for the Tables vs. Graphs lesson.',
  },
  {
    id: '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f', // standard-graphs-slides (Using ID from lesson-definitions.yaml)
    key: 'standard-graphs-slides',
    title: 'Standard Graphs Slides',
    filename: '214 Standard Graphs.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/214%20Standard%20Graphs.pdf',
    type: 'pdf',
    description: 'Slides for the Standard Graphs lesson.',
  },
  {
    id: 'e2579a77-933b-40fc-ace4-b091d3651297', // fact-based-persuasion-slides (Using ID from lesson-definitions.yaml)
    key: 'fact-based-persuasion-slides',
    title: 'Fact-based Persuasion Slides',
    filename: '215 Fact-based Persuasion.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/601%20Fact-based%20Persuasion%20Overview.pdf', // Note: URL filename mismatch
    type: 'pdf',
    description: 'Slides for the Fact-based Persuasion lesson.',
  },
  {
    id: '326996b2-e276-490e-80d7-aa84c048b79a', // specialist-graphs-slides (Using ID from lesson-definitions.yaml)
    key: 'specialist-graphs-slides',
    title: 'Specialist Graphs Slides',
    filename: '216 Specialist Graphs.pdf',
    url: 'https://pub-40e84da466344af19a19a7192a514a7400e.r2.dev/216%20Specialist%20Graphs.pdf',
    type: 'pdf',
    description: 'Slides for the Specialist Graphs lesson.',
  },
  {
    id: '7ac361db-1032-4d71-b7f8-6502747b1313', // preparation-practice-slides (Using ID from lesson-definitions.yaml)
    key: 'preparation-practice-slides',
    title: 'Preparation and Practice Slides',
    filename: '217 Preparation and Practice.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/217%20Preparation%20and%20Practice.pdf',
    type: 'pdf',
    description: 'Slides for the Preparation and Practice lesson.',
  },
  {
    id: '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78', // performance-slides (Using ID from lesson-definitions.yaml)
    key: 'performance-slides',
    title: 'Performance Slides',
    filename: '218 Performance.pdf',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/218%20Performance.pdf',
    type: 'pdf',
    description: 'Slides for the Performance lesson.',
  },
];

export const MEDIA_DEFINITIONS = [
  // Image Downloads (from image-mappings.ts)
  {
    id: 'f8b3a9d1-7e0c-4b5a-8d1f-2c3e4a5b6d7c', // Generated UUID for standard_graphs.png
    key: 'lesson-basic-graphs-image',
    title: 'Basic Graphs Featured Image',
    filename: 'standard_graphs.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/standard_graphs.png',
    type: 'png',
    altText: 'Image related to basic graphs', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a1e9b8c7-d6f5-4e3a-9b0c-1d2e3f4a5b6c', // Generated UUID for gestalt_principles_of_perception.png
    key: 'lesson-gestalt-principles-image',
    title: 'Gestalt Principles Featured Image',
    filename: 'gestalt_principles_of_perception.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/gestalt_principles_of_perception.png',
    type: 'png',
    altText: 'Image related to gestalt principles', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for idea_generation.png
    key: 'lesson-idea-generation-image',
    title: 'Idea Generation Featured Image',
    filename: 'idea_generation.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/idea_generation.png',
    type: 'png',
    altText: 'Image related to idea generation', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // Generated UUID for lesson_zero.png
    key: 'lesson-lesson-0-image',
    title: 'Welcome to DDM Featured Image',
    filename: 'lesson_zero.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/lesson_zero.png',
    type: 'png',
    altText: 'Image related to lesson 0', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for our_process.png
    key: 'lesson-our-process-image',
    title: 'Our Process Featured Image',
    filename: 'our_process.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/our_process.png',
    type: 'png',
    altText: 'Image related to our process', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // Generated UUID for overview_elements_design.png
    key: 'lesson-fundamental-design-overview-image',
    title: 'Overview of the Fundamental Elements of Design Featured Image',
    filename: 'overview_elements_design.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/overview_elements_design.png',
    type: 'png',
    altText: 'Image related to overview of elements of design', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // Generated UUID for performance.png
    key: 'lesson-performance-image',
    title: 'Performance Featured Image',
    filename: 'performance.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/performance.png',
    type: 'png',
    altText: 'Image related to performance', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for preparation_practice.png
    key: 'lesson-preparation-practice-image',
    title: 'Preparation and Practice Featured Image',
    filename: 'preparation_practice.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/preparation_practice.png',
    type: 'png',
    altText: 'Image related to preparation and practice', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for self_assessment.png
    key: 'lesson-skills-self-assessment-image',
    title: 'Skills Self-Assessment Featured Image',
    filename: 'self_assessment.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/self_assessment.png',
    type: 'png',
    altText: 'Image related to skills self-assessment', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // Generated UUID for slide_composition.png
    key: 'lesson-slide-composition-image',
    title: 'Slide Composition Featured Image',
    filename: 'slide_composition.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/slide_composition.png',
    type: 'png',
    altText: 'Image related to slide composition', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for specialist_graphs.png
    key: 'lesson-specialist-graphs-image',
    title: 'Specialist Graphs Featured Image',
    filename: 'specialist_graphs.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/specialist_graphs.png',
    type: 'png',
    altText: 'Image related to specialist graphs', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // Generated UUID for storyboards_in_film.png
    key: 'lesson-storyboards-film-image',
    title: 'Storyboards in Film Featured Image',
    filename: 'storyboards_in_film.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/storyboards_in_film.png',
    type: 'png',
    altText: 'Image related to storyboards in film', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // Generated UUID for storyboards_in_presentations.png
    key: 'lesson-storyboards-presentations-image',
    title: 'Storyboards in Presentations Featured Image',
    filename: 'storyboards_in_presentations.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/storyboards_in_presentations.png',
    type: 'png',
    altText: 'Image related to storyboards in presentations', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for tables_vs_graphs.png
    key: 'lesson-tables-vs-graphs-image',
    title: 'Tables vs Graphs Featured Image',
    filename: 'tables_vs_graphs.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/tables_vs_graphs.png',
    type: 'png',
    altText: 'Image related to tables vs graphs', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for the_who.png
    key: 'lesson-the-who-image',
    title: 'The Who Featured Image',
    filename: 'the_who.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/the_who.png',
    type: 'png',
    altText: 'Image related to the who', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // Generated UUID for the_why_introductions.png
    key: 'lesson-the-why-introductions-image',
    title: 'The Why Introductions Featured Image',
    filename: 'the_why_introductions.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/the_why_introductions.png',
    type: 'png',
    altText: 'Image related to the why introductions', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for the_why_next_steps.png
    key: 'lesson-the-why-next-steps-image',
    title: 'The Why Next Steps Featured Image',
    filename: 'the_why_next_steps.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/the_why_next_steps.png',
    type: 'png',
    altText: 'Image related to the why next steps', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // Generated UUID for tools_resources.png
    key: 'lesson-tools-and-resources-image',
    title: 'Tools and Resources Featured Image',
    filename: 'tools_resources.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/tools_resources.png',
    type: 'png',
    altText: 'Image related to tools and resources', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // Generated UUID for using_stories.png
    key: 'lesson-using-stories-image',
    title: 'Using Stories Featured Image',
    filename: 'using_stories.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/using_stories.png',
    type: 'png',
    altText: 'Image related to using stories', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for visual_perception.png
    key: 'lesson-visual-perception-image',
    title: 'Visual Perception Featured Image',
    filename: 'visual_perception.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/visual_perception.png',
    type: 'png',
    altText: 'Image related to visual perception', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for fact_based_persuasion_overview.png
    key: 'lesson-fact-based-persuasion-image',
    title: 'Fact-based Persuasion Featured Image',
    filename: 'fact_based_persuasion_overview.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/fact_based_persuasion_overview.png',
    type: 'png',
    altText: 'Image related to fact-based persuasion', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // Generated UUID for what_structure.png
    key: 'lesson-what-is-structure-image',
    title: 'What is Structure Featured Image',
    filename: 'what_structure.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/what_structure.png',
    type: 'png',
    altText: 'Image related to what is structure', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for before_we_begin.png
    key: 'lesson-before-we-begin-image',
    title: 'Before we begin Featured Image',
    filename: 'before_we_begin.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/before_we_begin.png',
    type: 'png',
    altText: 'Image related to before we begin', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // Generated UUID for detail_elements_of_design.png
    key: 'lesson-fundamental-design-detail-image',
    title: 'The Fundamental Elements of Design in Detail Featured Image',
    filename: 'detail_elements_of_design.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/detail_elements_of_design.png',
    type: 'png',
    altText: 'Image related to fundamental design detail', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  // Blog Post Images (from image-mappings.ts)
  {
    id: 'f8b3a9d1-7e0c-4b5a-8d1f-2c3e4a5b6d7c', // Generated UUID for Art Craft of Presentation Creation.png
    key: 'post-art-craft-business-presentation-creation-image',
    title: 'Art Craft of Business Presentation Creation Featured Image',
    filename: 'Art Craft of Presentation Creation.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Art%20Craft%20of%20Presentation%20Creation.png',
    type: 'png',
    altText: 'Image related to art craft of business presentation creation', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a1e9b8c7-d6f5-4e3a-9b0c-1d2e3f4a5b6c', // Generated UUID for pitch-deck-image.png
    key: 'post-pitch-deck-image',
    title: 'Pitch Deck Featured Image',
    filename: 'pitch-deck-image.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/pitch-deck-image.png',
    type: 'png',
    altText: 'Image related to pitch deck', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for Defense of PowerPoint.png
    key: 'post-powerpoint-presentations-defense-image',
    title: 'Powerpoint Presentations Defense Featured Image',
    filename: 'Defense of PowerPoint.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Defense%20of%20PowerPoint.png',
    type: 'png',
    altText: 'Image related to powerpoint presentations defense', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // Generated UUID for BCG-teardown-optimized.jpg
    key: 'post-presentation-review-bcg-image',
    title: 'Presentation Review BCG Featured Image',
    filename: 'BCG-teardown-optimized.jpg',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/BCG-teardown-optimized.jpg',
    type: 'jpg',
    altText: 'Image related to presentation review bcg', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for Presentation Tips Optimized.png
    key: 'post-presentation-tips-image',
    title: 'Presentation Tips Featured Image',
    filename: 'Presentation Tips Optimized.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Presentation%20Tips%20Optimized.png',
    type: 'png',
    altText: 'Image related to presentation tips', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // Generated UUID for Presentation Tools-optimized.png
    key: 'post-presentation-tools-image',
    title: 'Presentation Tools Featured Image',
    filename: 'Presentation Tools-optimized.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Presentation%20Tools-optimized.png',
    type: 'png',
    altText: 'Image related to presentation tools', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // Generated UUID for Conquering Public Speaking Anxiety.png
    key: 'post-public-speaking-anxiety-image',
    title: 'Public Speaking Anxiety Featured Image',
    filename: 'Conquering Public Speaking Anxiety.png',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Conquering%20Public%20Speaking%20Anxiety.png',
    type: 'png',
    altText: 'Image related to public speaking anxiety', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // Generated UUID for Seneca Partnership.webp
    key: 'post-seneca-partnership-image',
    title: 'Seneca Partnership Featured Image',
    filename: 'Seneca Partnership.webp',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/Seneca%20Partnership.webp',
    type: 'webp',
    altText: 'Image related to seneca partnership', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
  {
    id: 'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // Generated UUID for business-charts.jpg
    key: 'post-typology-business-charts-image',
    title: 'Typology Business Charts Featured Image',
    filename: 'business-charts.jpg',
    url: 'https://pub-40e84da466344af19a7192a514a7400e.r2.dev/business-charts.jpg',
    type: 'jpg',
    altText: 'Image related to typology business charts', // Placeholder - needs sourcing
    width: null, // Placeholder - needs sourcing
    height: null, // Placeholder - needs sourcing
  },
];
