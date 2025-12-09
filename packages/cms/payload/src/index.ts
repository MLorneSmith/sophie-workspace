// Export course API functions
export {
	getCourseById,
	getCourseBySlug,
	getCourseLessons,
	getCourses,
	getLessonBySlug,
	getQuiz,
} from "./api/course";
// Export API functions
export { callPayloadAPI } from "./api/payload-api";
// Export survey API functions
export {
	_completeSurvey as completeSurvey,
	_createSurveyResponse as createSurveyResponse,
	_getUserSurveyResponse as getUserSurveyResponse,
	_updateSurveyResponse as updateSurveyResponse,
	getSurvey,
	getSurveyQuestions,
} from "./api/survey";
export { PayloadContentRenderer } from "./content-renderer";
export { createPayloadClient } from "./create-payload-cms";
