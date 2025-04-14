/**
 * Predefined UUIDs for downloads to ensure consistent IDs across all tables and relationships.
 * This approach follows the same pattern used for surveys and quizzes.
 */
export const DOWNLOAD_ID_MAP = {
    // Define IDs for course resources downloads that actually exist
    'slide-templates': '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1', // SlideHeroes Presentation Template.zip
    'swipe-file': 'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6', // SlideHeroes Swipe File.zip
    // Lesson PDFs - using consistent naming convention for keys
    'our-process-slides': 'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28', // 201 Our Process.pdf
    'the-who-slides': 'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456', // 202 The Who.pdf
    'introduction-slides': 'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593', // 203 The Why - Introductions.pdf
    'next-steps-slides': 'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04', // 204 The Why - Next Steps.pdf
    'idea-generation-slides': 'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18', // 205 Idea Generation.pdf
    'what-is-structure-slides': 'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29', // 206 What is Structure.pdf
    'using-stories-slides': 'e017b153-4d96-6fb8-c0e2-354f9d2c7130', // 207 Using Stories.pdf
    'storyboards-presentations-slides': 'f158c264-5e07-71c9-d1f3-165e0e3d8541', // 208 Storyboards in Presentations.pdf
    'visual-perception-slides': '1219d375-6f18-85d0-e214-276d1f4e9152', // 209 Visual Perception.pdf
    'fundamental-elements-slides': '3320e486-7129-91e1-f355-487a215f0263', // 210 Fundamental Elements.pdf
    'gestalt-principles-slides': '44a1f597-8530-02f2-14a6-598a356a1a74', // 211 Gestalt Principles.pdf
    'slide-composition-slides': '55b21608-9a41-1a13-5527-a09a4a7a2b85', // 212 Slide Composition.pdf
    'tables-vs-graphs-slides': '66c35719-0252-2b54-a6a8-a10b5a8a3c96', // 213 Tables vs Graphs.pdf
    'standard-graphs-slides': '77d4a820-1a63-3ca5-a7b9-b21c6a9a4d07', // 214 Standard Graphs.pdf
    'fact-based-persuasion-slides': '88e5a931-2b74-4da6-a8c0-a32d7b0a5e18', // 215 Fact-based Persuasion.pdf
    'specialist-graphs-slides': '99f6a042-3c85-5ea7-b9d1-a43e8c1b6f29', // 216 Specialist Graphs.pdf
    'preparation-practice-slides': 'aa07b153-4d96-6fb8-c0e2-b54f9d2c7a30', // 217 Preparation and Practice.pdf
    'performance-slides': 'bb18c264-5e07-71c9-d1f3-c65e0e3d8b41', // 218 Performance.pdf
    // Removed non-existent files:
    // 'presentation-checklist': 'c4f87e56-91a2-4bf3-8a45-d9e8c3b71208',
    // 'storyboard-template': 'a23d87f1-6e54-4c7b-9f12-d8e56c2a1b45',
};
/**
 * Get a download ID by its key
 * @param key The download key
 * @returns The UUID for the specified download key or undefined if not found
 */
export function getDownloadIdByKey(key) {
    return DOWNLOAD_ID_MAP[key];
}
/**
 * Get a download key by its ID
 * @param id The download UUID
 * @returns The key for the specified download ID or undefined if not found
 */
export function getDownloadKeyById(id) {
    for (const [key, value] of Object.entries(DOWNLOAD_ID_MAP)) {
        if (value === id) {
            return key;
        }
    }
    return undefined;
}
