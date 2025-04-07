var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
/**
 * Script to update course progress for test2@slideheroes.com
 * Marks all lessons as complete except for 702, 801, and 802
 *
 * This script fetches the current lesson data from Payload CMS to ensure
 * it always uses the latest lesson IDs, even after database resets.
 */
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
// Import the required lesson numbers directly to avoid ESM import issues
var REQUIRED_LESSON_NUMBERS = [
    '101',
    '103',
    '104',
    '201',
    '202',
    '203',
    '204',
    '301',
    '302',
    '401',
    '402',
    '403',
    '501',
    '502',
    '503',
    '504',
    '511',
    '602',
    '603',
    '604',
    '611',
    '701',
    '702',
];
var TOTAL_REQUIRED_LESSONS = REQUIRED_LESSON_NUMBERS.length; // 23
// Hardcoded Supabase credentials
// In a production environment, these should be loaded from environment variables
var supabaseUrl = 'http://127.0.0.1:54321';
var supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
// Payload CMS URL
var payloadUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3020';
console.log("Supabase URL: ".concat(supabaseUrl));
console.log("Supabase Key: ".concat(supabaseKey ? '********' : 'undefined'));
console.log("Payload URL: ".concat(payloadUrl));
// Supabase client setup
var supabase = createClient(supabaseUrl, supabaseKey);
// Course ID for "Decks for Decision Makers"
var COURSE_ID = '3e352ade-c6a9-4e4a-9ffa-9680a5d5f9e8';
var TEST_USER_EMAIL = 'test2@slideheroes.com';
var EXCLUDED_LESSONS = ['702', '801', '802'];
/**
 * Fetch lessons from Payload CMS
 * @param courseId The course ID to fetch lessons for
 * @returns Array of lesson data
 */
function fetchLessonsFromPayload(courseId) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, lessons, error_1, _a, data, supabaseError, _b, noSchemaData, noSchemaError, fallbackError_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log("Fetching lessons from Payload CMS for course ID: ".concat(courseId, "..."));
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 11]);
                    return [4 /*yield*/, fetch("".concat(payloadUrl, "/api/course_lessons?where[course_id][equals]=").concat(courseId, "&sort=lesson_number&limit=100"))];
                case 2:
                    response = _c.sent();
                    if (!response.ok) {
                        throw new Error("Failed to fetch lessons: ".concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = (_c.sent());
                    lessons = data.docs || [];
                    console.log("Successfully fetched ".concat(lessons.length, " lessons from Payload CMS"));
                    // Log the first few lessons for debugging
                    if (lessons.length > 0) {
                        console.log('Sample lessons:');
                        lessons.slice(0, 3).forEach(function (lesson) {
                            console.log("  - ".concat(lesson.id, ": Lesson ").concat(lesson.lesson_number, " - ").concat(lesson.title));
                        });
                    }
                    return [2 /*return*/, lessons];
                case 4:
                    error_1 = _c.sent();
                    console.error('Error fetching lessons from Payload CMS:', error_1);
                    // Fallback to fetching from Supabase if Payload API fails
                    console.log('Attempting to fetch lessons from Supabase as fallback...');
                    _c.label = 5;
                case 5:
                    _c.trys.push([5, 9, , 10]);
                    return [4 /*yield*/, supabase
                            .from('payload.course_lessons')
                            .select('id, lesson_number, title')
                            .eq('course_id', courseId)
                            .order('lesson_number', { ascending: true })];
                case 6:
                    _a = _c.sent(), data = _a.data, supabaseError = _a.error;
                    if (!supabaseError) return [3 /*break*/, 8];
                    // If that fails, try querying without the schema
                    console.log('Query with schema failed, trying without schema...');
                    return [4 /*yield*/, supabase
                            .from('course_lessons')
                            .select('id, lesson_number, title')
                            .eq('course_id', courseId)
                            .order('lesson_number', { ascending: true })];
                case 7:
                    _b = _c.sent(), noSchemaData = _b.data, noSchemaError = _b.error;
                    if (noSchemaError) {
                        throw noSchemaError;
                    }
                    console.log("Successfully fetched ".concat((noSchemaData === null || noSchemaData === void 0 ? void 0 : noSchemaData.length) || 0, " lessons from Supabase without schema"));
                    return [2 /*return*/, noSchemaData || []];
                case 8:
                    console.log("Successfully fetched ".concat((data === null || data === void 0 ? void 0 : data.length) || 0, " lessons from Supabase with schema"));
                    return [2 /*return*/, data || []];
                case 9:
                    fallbackError_1 = _c.sent();
                    console.error('Fallback fetch also failed:', fallbackError_1);
                    throw new Error('Failed to fetch lessons from both Payload CMS and Supabase');
                case 10: return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, accountData, accountError, userId, lessonsData_1, now, completedLessonsCount, lesson702, existingProgress702, updateError, insertError, _i, _b, lesson, existingProgress, updateError, insertError, lessonProgress_1, completedRequiredLessons, completionPercentage, isCompleted, existingCourseProgress, updateError, insertError, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 24, , 25]);
                    console.log('Starting course progress update for test user...');
                    // 1. Get the user ID for test2@slideheroes.com
                    // Try to get the user directly from the accounts table
                    console.log('Fetching user ID from accounts table...');
                    return [4 /*yield*/, supabase
                            .from('accounts')
                            .select('id')
                            .eq('email', TEST_USER_EMAIL)
                            .single()];
                case 1:
                    _a = _c.sent(), accountData = _a.data, accountError = _a.error;
                    if (accountError || !accountData) {
                        throw new Error("Failed to find user with email ".concat(TEST_USER_EMAIL, ": ").concat((accountError === null || accountError === void 0 ? void 0 : accountError.message) || 'User not found'));
                    }
                    userId = accountData.id;
                    console.log("Found user ID: ".concat(userId));
                    // 2. Get all lessons for the course from Payload CMS
                    console.log('Fetching course lessons from Payload CMS...');
                    return [4 /*yield*/, fetchLessonsFromPayload(COURSE_ID)];
                case 2:
                    lessonsData_1 = _c.sent();
                    if (!lessonsData_1 || lessonsData_1.length === 0) {
                        throw new Error('No lessons found for the course');
                    }
                    console.log("Found ".concat(lessonsData_1.length, " lessons"));
                    now = new Date().toISOString();
                    completedLessonsCount = 0;
                    lesson702 = lessonsData_1.find(function (lesson) { return String(lesson.lesson_number) === '702'; });
                    if (!lesson702) return [3 /*break*/, 8];
                    console.log("Explicitly marking lesson 702 as not completed: ".concat(lesson702.title));
                    return [4 /*yield*/, supabase
                            .from('lesson_progress')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('lesson_id', lesson702.id)
                            .single()];
                case 3:
                    existingProgress702 = (_c.sent()).data;
                    if (!existingProgress702) return [3 /*break*/, 5];
                    return [4 /*yield*/, supabase
                            .from('lesson_progress')
                            .update({
                            completion_percentage: 50,
                            completed_at: null, // Set to null to mark as not completed
                        })
                            .eq('id', existingProgress702.id)];
                case 4:
                    updateError = (_c.sent()).error;
                    if (updateError) {
                        console.error("Failed to update lesson progress for lesson 702: ".concat(updateError.message));
                    }
                    else {
                        console.log('Successfully marked lesson 702 as not completed');
                    }
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, supabase
                        .from('lesson_progress')
                        .insert({
                        user_id: userId,
                        course_id: COURSE_ID,
                        lesson_id: lesson702.id,
                        started_at: now,
                        completed_at: null, // Set to null to mark as not completed
                        completion_percentage: 50,
                    })];
                case 6:
                    insertError = (_c.sent()).error;
                    if (insertError) {
                        console.error("Failed to create lesson progress for lesson 702: ".concat(insertError.message));
                    }
                    else {
                        console.log('Successfully created lesson 702 progress as not completed');
                    }
                    _c.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8:
                    console.error('Lesson 702 not found in lesson data');
                    _c.label = 9;
                case 9:
                    _i = 0, _b = lessonsData_1;
                    _c.label = 10;
                case 10:
                    if (!(_i < _b.length)) return [3 /*break*/, 17];
                    lesson = _b[_i];
                    // Skip excluded lessons
                    if (EXCLUDED_LESSONS.includes(String(lesson.lesson_number))) {
                        console.log("Skipping lesson ".concat(lesson.lesson_number, ": ").concat(lesson.title));
                        return [3 /*break*/, 16];
                    }
                    console.log("Marking lesson ".concat(lesson.lesson_number, " as complete: ").concat(lesson.title));
                    return [4 /*yield*/, supabase
                            .from('lesson_progress')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('lesson_id', lesson.id)
                            .single()];
                case 11:
                    existingProgress = (_c.sent()).data;
                    if (!existingProgress) return [3 /*break*/, 13];
                    return [4 /*yield*/, supabase
                            .from('lesson_progress')
                            .update({
                            completion_percentage: 100,
                            completed_at: now,
                        })
                            .eq('id', existingProgress.id)];
                case 12:
                    updateError = (_c.sent()).error;
                    if (updateError) {
                        console.error("Failed to update lesson progress for lesson ".concat(lesson.lesson_number, ": ").concat(updateError.message));
                        return [3 /*break*/, 16];
                    }
                    return [3 /*break*/, 15];
                case 13: return [4 /*yield*/, supabase
                        .from('lesson_progress')
                        .insert({
                        user_id: userId,
                        course_id: COURSE_ID,
                        lesson_id: lesson.id,
                        started_at: now,
                        completed_at: now,
                        completion_percentage: 100,
                    })];
                case 14:
                    insertError = (_c.sent()).error;
                    if (insertError) {
                        console.error("Failed to create lesson progress for lesson ".concat(lesson.lesson_number, ": ").concat(insertError.message));
                        return [3 /*break*/, 16];
                    }
                    _c.label = 15;
                case 15:
                    completedLessonsCount++;
                    _c.label = 16;
                case 16:
                    _i++;
                    return [3 /*break*/, 10];
                case 17: return [4 /*yield*/, supabase
                        .from('lesson_progress')
                        .select('*')
                        .eq('user_id', userId)
                        .eq('course_id', COURSE_ID)];
                case 18:
                    lessonProgress_1 = (_c.sent()).data;
                    if (!lessonProgress_1) {
                        throw new Error('Failed to fetch lesson progress');
                    }
                    completedRequiredLessons = REQUIRED_LESSON_NUMBERS.filter(function (lessonNumber) {
                        // Find the lesson with this number
                        var lesson = lessonsData_1.find(function (l) { return String(l.lesson_number) === lessonNumber; });
                        if (!lesson)
                            return false;
                        // Check if this lesson is completed
                        return lessonProgress_1.some(function (p) { return p.lesson_id === lesson.id && p.completed_at; });
                    }).length;
                    completionPercentage = Math.round((completedRequiredLessons / TOTAL_REQUIRED_LESSONS) * 100);
                    isCompleted = completedRequiredLessons === TOTAL_REQUIRED_LESSONS;
                    console.log("Total required lessons: ".concat(TOTAL_REQUIRED_LESSONS));
                    console.log("Completed required lessons: ".concat(completedRequiredLessons));
                    console.log("Completion percentage: ".concat(completionPercentage, "%"));
                    console.log("Course completed: ".concat(isCompleted ? 'Yes' : 'No'));
                    return [4 /*yield*/, supabase
                            .from('course_progress')
                            .select('*')
                            .eq('user_id', userId)
                            .eq('course_id', COURSE_ID)
                            .single()];
                case 19:
                    existingCourseProgress = (_c.sent()).data;
                    if (!existingCourseProgress) return [3 /*break*/, 21];
                    return [4 /*yield*/, supabase
                            .from('course_progress')
                            .update({
                            completion_percentage: completionPercentage,
                            completed_at: isCompleted ? now : null, // Only set completed_at if course is actually complete
                            last_accessed_at: now,
                        })
                            .eq('id', existingCourseProgress.id)];
                case 20:
                    updateError = (_c.sent()).error;
                    if (updateError) {
                        throw new Error("Failed to update course progress: ".concat(updateError.message));
                    }
                    console.log(isCompleted
                        ? 'Marked course as completed by setting completed_at timestamp'
                        : 'Updated course progress without marking as completed');
                    return [3 /*break*/, 23];
                case 21: return [4 /*yield*/, supabase
                        .from('course_progress')
                        .insert({
                        user_id: userId,
                        course_id: COURSE_ID,
                        started_at: now,
                        last_accessed_at: now,
                        completion_percentage: completionPercentage,
                        completed_at: isCompleted ? now : null, // Only set completed_at if course is actually complete
                    })];
                case 22:
                    insertError = (_c.sent()).error;
                    if (insertError) {
                        throw new Error("Failed to create course progress: ".concat(insertError.message));
                    }
                    console.log(isCompleted
                        ? 'Created new course progress record with completed_at timestamp set'
                        : 'Created new course progress record without marking as completed');
                    _c.label = 23;
                case 23:
                    console.log("Successfully updated course progress for ".concat(TEST_USER_EMAIL));
                    console.log("Completed ".concat(completedLessonsCount, "/").concat(TOTAL_REQUIRED_LESSONS, " lessons (").concat(completionPercentage, "%)"));
                    console.log('Done!');
                    return [3 /*break*/, 25];
                case 24:
                    error_2 = _c.sent();
                    console.error('Error:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 25];
                case 25: return [2 /*return*/];
            }
        });
    });
}
// Call main() directly
main().catch(function (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
});
