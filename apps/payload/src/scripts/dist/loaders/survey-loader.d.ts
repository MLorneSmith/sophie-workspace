/**
 * Load survey data from a YAML file into Payload CMS
 */
export declare function loadSurveyFromYaml(options: {
    yamlFilePath: string;
    apiUrl?: string;
    email?: string;
    password?: string;
}): Promise<{
    success: boolean;
    surveyId: string;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    surveyId?: undefined;
}>;
/**
 * Main function to load a survey from a YAML file
 */
export declare function loadSurvey(yamlFilePath: string): Promise<{
    success: boolean;
    surveyId: string;
    error?: undefined;
} | {
    success: boolean;
    error: unknown;
    surveyId?: undefined;
}>;
