/**
 * Defines the relationship between course lessons and their associated downloads.
 * Key: Lesson UUID
 * Value: Array of Download UUIDs
 */
export const LESSON_DOWNLOAD_RELATIONS = {
    'b1e873c4-6ee3-423c-8ac0-23d5bd5ad4c1': [
        // Our Process
        'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', // our-process-slides
        'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // lesson-our-process-image
    ],
    '82b4c8fb-49f9-4744-9abe-66bf2bbdbbfd': [
        // The Who
        'e8f21b37-6c94-44a3-994b-29937ee870ec', // the-who-slides
        'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // lesson-the-who-image
    ],
    '8ea3ffa1-2f54-4faa-a80c-7dec1a69fe5e': [
        // Lesson 0
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // lesson-lesson-0-image
    ],
    'd3fbdda1-1cd9-4334-a761-c06d321d551d': [
        // Before we begin
        'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // lesson-before-we-begin-image
    ],
    'dfb703d8-0035-460c-aba9-6f455a7a4f79': [
        // Tools and Resources
        'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // lesson-tools-and-resources-image
    ],
    '4197bbda-80a4-4cf6-b09e-668be2416115': [
        // The Why: Introductions
        'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593', // introduction-slides
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // lesson-the-why-introductions-image
    ],
    'cf729d29-8734-4805-aded-c2d5ca5c463e': [
        // The Why: Next Steps
        'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04', // next-steps-slides
        'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // lesson-the-why-next-steps-image
    ],
    '795e647c-076d-4752-8f5e-9e22f9a1e5c7': [
        // Idea Generation
        'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18', // idea-generation-slides
        'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // lesson-idea-generation-image
    ],
    'ff79145d-c2f7-468f-bf11-38ef3cc3783b': [
        // What is Structure?
        'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29', // what-is-structure-slides
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // lesson-what-is-structure-image
    ],
    'a6ef3743-5ee2-457e-a054-fc10c53aa842': [
        // Using Stories
        'e017b153-4d96-6fb8-c0e2-354f9d2c7130', // using-stories-slides
        'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // lesson-using-stories-image
    ],
    '41c70129-a61e-4c28-9984-5d9d99eec970': [
        // Storyboards in Film
        // No PDF download listed in lesson-definitions.yaml
        'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // lesson-storyboards-film-image
    ],
    'fe87137c-66c5-44ac-83d7-0868f078af92': [
        // Storyboards in Presentations
        'fe87137c-66c5-44ac-83d7-0868f078af92', // storyboards-presentations-slides (Using ID from lesson-definitions.yaml)
        'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // lesson-storyboards-presentations-image
    ],
    '3a720817-1aae-4080-8f50-f81179d3dbd0': [
        // Visual Perception and Communication
        '3a720817-1aae-4080-8f50-f81179d3dbd0', // visual-perception-slides (Using ID from lesson-definitions.yaml)
        'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // lesson-visual-perception-image
    ],
    'ca6b3c4b-9278-43ca-8748-90e80ece8b3a': [
        // Overview of the Fundamental Elements of Design
        // No PDF download listed in lesson-definitions.yaml
        'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // lesson-fundamental-design-overview-image
    ],
    '199e1eb2-f307-4e25-8e20-434ce7331d06': [
        // The Fundamental Elements of Design in Detail
        '199e1eb2-f307-4e25-8e20-434ce7331d06', // fundamental-elements-slides (Using ID from lesson-definitions.yaml)
        'c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', // lesson-fundamental-design-detail-image
    ],
    'a41f704e-d373-421c-87ff-21fd58238c2d': [
        // Gestalt Principles of Visual Perception
        'a41f704e-d373-421c-87ff-21fd58238c2d', // gestalt-principles-slides (Using ID from lesson-definitions.yaml)
        'a1e9b8c7-d6f5-4e3a-9b0c-1d2e3f4a5b6c', // lesson-gestalt-principles-image
    ],
    'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d': [
        // Slide Composition
        'e3a5f099-8e0c-4ec9-82ca-c34d5b2e055d', // slide-composition-slides (Using ID from lesson-definitions.yaml)
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', // lesson-slide-composition-image
    ],
    '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458': [
        // Tables vs. Graphs
        '72a33bdf-ffab-45e2-8d2c-08bd4d3b7458', // tables-vs-graphs-slides (Using ID from lesson-definitions.yaml)
        'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // lesson-tables-vs-graphs-image
    ],
    '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f': [
        // Standard Graphs
        '890f5ef0-f9e6-4c61-9c1b-1caeb9fcae0f', // standard-graphs-slides (Using ID from lesson-definitions.yaml)
        'f8b3a9d1-7e0c-4b5a-8d1f-2c3e4a5b6d7c', // lesson-basic-graphs-image
    ],
    'e2579a77-933b-40fc-ace4-b091d3651297': [
        // Overview of Fact-based Persuasion
        'e2579a77-933b-40fc-ace4-b091d3651297', // fact-based-persuasion-slides (Using ID from lesson-definitions.yaml)
        'c3d4e5f6-a7b8-4c9d-e0f1-2a3b4c5d6e7f', // lesson-fact-based-persuasion-image
    ],
    '326996b2-e276-490e-80d7-aa84c048b79a': [
        // Specialist Graphs
        '326996b2-e276-490e-80d7-aa84c048b79a', // specialist-graphs-slides (Using ID from lesson-definitions.yaml)
        'a9b8c7d6-e5f4-4a3b-8c1d-2e3f4a5b6c7d', // lesson-specialist-graphs-image
    ],
    '7ac361db-1032-4d71-b7f8-6502747b1313': [
        // Preparation and Practice
        '7ac361db-1032-4d71-b7f8-6502747b1313', // preparation-practice-slides (Using ID from lesson-definitions.yaml)
        'a7b8c9d0-e1f2-4a3b-8c1d-2e3f4a5b6c7d', // lesson-preparation-practice-image
    ],
    '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78': [
        // Performance
        '27c967c9-2d16-45c0-a6cd-7dc70e4e9f78', // performance-slides (Using ID from lesson-definitions.yaml)
        'e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', // lesson-performance-image
    ],
    'd9263fcf-043b-4561-be30-5c3f19ec29b3': [
    // Congratulations
    // No downloads listed in lesson-definitions.yaml
    ],
    '94870001-fb30-4e92-861c-0a4b776cd82a': [
    // Before you go...
    // No downloads listed in lesson-definitions.yaml
    ],
};
//# sourceMappingURL=lesson-download-relations.js.map