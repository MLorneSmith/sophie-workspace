/**
 * Predefined UUIDs for surveys to ensure consistent IDs across all tables and relationships.
 */
export const SURVEY_ID_MAP: Record<string, string> = {
  'self-assessment': '27aa58a7-1adc-4068-866b-3d50cf2f4993',
};

/**
 * Get a survey ID by its key
 * @param key The survey key
 * @returns The UUID for the specified survey key or undefined if not found
 */
export function getSurveyIdByKey(key: string): string | undefined {
  return SURVEY_ID_MAP[key];
}

/**
 * Get a survey key by its ID
 * @param id The survey UUID
 * @returns The key for the specified survey ID or undefined if not found
 */
export function getSurveyKeyById(id: string): string | undefined {
  for (const [key, value] of Object.entries(SURVEY_ID_MAP)) {
    if (value === id) {
      return key;
    }
  }
  return undefined;
}
