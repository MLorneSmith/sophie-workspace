/**
 * Image Mappings
 *
 * This file contains mappings between frontmatter image paths and actual R2 filenames.
 * These mappings are used during the content migration process to correctly link
 * content to media files in Cloudflare R2.
 */
/**
 * Mapping of lesson image paths to actual R2 filenames
 */
export const lessonImageMappings = {
    '/cms/images/basic-graphs/image.png': 'standard_graphs.png',
    '/cms/images/gestalt-principles/image.png': 'gestalt_principles_of_perception.png',
    '/cms/images/idea-generation/image.png': 'idea_generation.png',
    '/cms/images/lesson-0/image.png': 'lesson_zero.png',
    '/cms/images/our-process/image.png': 'our_process.png',
    '/cms/images/fundamental-design-overview/image.png': 'overview_elements_design.png',
    '/cms/images/performance/image.png': 'performance.png',
    '/cms/images/preparation-practice/image.png': 'preparation_practice.png',
    '/cms/images/skills-self-assessment/image.png': 'self_assessment.png',
    '/cms/images/slide-composition/image.png': 'slide_composition.png',
    '/cms/images/specialist-graphs/image.png': 'specialist_graphs.png',
    '/cms/images/storyboards-film/image.png': 'storyboards_in_film.png',
    '/cms/images/storyboards-presentations/image.png': 'storyboards_in_presentations.png',
    '/cms/images/tables-vs-graphs/image.png': 'tables_vs_graphs.png',
    '/cms/images/the-who/image.png': 'the_who.png',
    '/cms/images/the-why-introductions/image.png': 'the_why_introductions.png',
    '/cms/images/the-why-next-steps/image.png': 'the_why_next_steps.png',
    '/cms/images/tools-and-resources/image.png': 'tools_resources.png',
    '/cms/images/using-stories/image.png': 'using_stories.png',
    '/cms/images/visual-perception/image.png': 'visual_perception.png',
    '/cms/images/fact-based-persuasion/image.png': 'fact_based_persuasion_overview.png',
    '/cms/images/what-is-structure/image.png': 'what_structure.png',
    '/cms/images/before-we-begin/image.png': 'before_we_begin.png',
    '/cms/images/fundamental-design-detail/image.png': 'detail_elements_of_design.png',
};
/**
 * Mapping of blog post image paths to actual R2 filenames
 */
export const postImageMappings = {
    '/cms/images/art-craft-business-presentation-creation/image.png': 'Art Craft of Presentation Creation.png',
    '/cms/images/pitch-deck/image.png': 'pitch-deck-image.png',
    '/cms/images/powerpoint-presentations-defense/image.png': 'Defense of PowerPoint.png',
    '/cms/images/presentation-review-bcg/image.png': 'BCG-teardown-optimized.jpg',
    '/cms/images/presentation-tips/image.png': 'Presentation Tips Optimized.png',
    '/cms/images/presentation-tools/image.png': 'Presentation Tools-optimized.png',
    '/cms/images/public-speaking-anxiety/image.png': 'Conquering Public Speaking Anxiety.png',
    '/cms/images/seneca-partnership/image.png': 'Seneca Partnership.webp',
    '/cms/images/typology-business-charts/image.png': 'business-charts.jpg',
};
/**
 * Get the actual image filename from a frontmatter path
 * @param frontmatterPath The path from the frontmatter
 * @returns The actual filename in R2, or null if not found
 */
export function getActualImageFilename(frontmatterPath) {
    return (lessonImageMappings[frontmatterPath] ||
        postImageMappings[frontmatterPath] ||
        null);
}
