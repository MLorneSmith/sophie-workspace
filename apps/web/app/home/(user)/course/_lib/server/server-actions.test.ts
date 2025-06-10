/**
 * Unit tests for course server actions
 * Tests course progress, lesson progress, and quiz submission functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  updateCourseProgressAction,
  updateLessonProgressAction,
  submitQuizAttemptAction 
} from './server-actions';
import { generateCertificate } from '~/lib/certificates/certificate-service';

// Mock dependencies
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: any) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          return { error: 'Validation failed', details: result.error.issues };
        }
        data = result.data;
      }
      
      // Mock authenticated user
      const mockUser = { 
        id: 'user-123', 
        email: 'test@example.com',
        aud: 'authenticated',
      };
      
      return fn(data, mockUser);
    };
  }),
}));

const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(() => mockSupabaseClient),
}));

const mockGetCourseBySlug = vi.fn();
const mockGetCourseLessons = vi.fn();

vi.mock('@kit/cms/payload', async () => ({
  getCourseBySlug: mockGetCourseBySlug,
  getCourseLessons: mockGetCourseLessons,
}));

vi.mock('~/lib/certificates/certificate-service', () => ({
  generateCertificate: vi.fn(),
}));

vi.mock('~/lib/course/course-config', () => ({
  REQUIRED_LESSON_NUMBERS: ['1', '2', '3', '4', '5'],
  TOTAL_REQUIRED_LESSONS: 5,
}));

// Helper to setup Supabase mock chains
const createMockSupabaseChain = (returnData: any, error: any = null) => {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: returnData, error }),
  };
  return chain;
};

describe('Course Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock date to a fixed time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('updateCourseProgressAction - Schema Validation', () => {
    it('should validate courseId as string', async () => {
      const input = { courseId: 'course-123' };
      
      // Mock no existing progress
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should transform courseId from number to string', async () => {
      const input = { courseId: 123 };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('course_progress');
    });

    it('should validate completion percentage in valid range', async () => {
      const input = { courseId: '1', completionPercentage: 50 };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should reject completion percentage above 100', async () => {
      const input = { courseId: '1', completionPercentage: 150 };
      
      const result = await updateCourseProgressAction(input);
      
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
    });

    it('should reject completion percentage below 0', async () => {
      const input = { courseId: '1', completionPercentage: -10 };
      
      const result = await updateCourseProgressAction(input);
      
      expect(result.error).toBe('Validation failed');
      expect(result.details).toBeDefined();
    });

    it('should handle optional currentLessonId as string', async () => {
      const input = { courseId: '1', currentLessonId: 'lesson-123' };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle optional currentLessonId as number', async () => {
      const input = { courseId: '1', currentLessonId: 456 };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle undefined currentLessonId', async () => {
      const input = { courseId: '1', currentLessonId: undefined };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateCourseProgressAction - Core Functionality', () => {
    it('should create new course progress record when none exists', async () => {
      const input = { 
        courseId: 'course-1', 
        currentLessonId: 'lesson-1', 
        completionPercentage: 25 
      };
      
      const insertChain = createMockSupabaseChain(null);
      insertChain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabaseClient.from.mockReturnValue(insertChain);
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(insertChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        course_id: 'course-1',
        started_at: '2024-01-01T12:00:00.000Z',
        last_accessed_at: '2024-01-01T12:00:00.000Z',
        current_lesson_id: 'lesson-1',
        completion_percentage: 25,
        completed_at: null,
      });
    });

    it('should update existing course progress record', async () => {
      const input = { 
        courseId: 'course-1', 
        currentLessonId: 'lesson-2', 
        completionPercentage: 50 
      };
      
      const existingProgress = {
        id: 'progress-1',
        user_id: 'user-123',
        course_id: 'course-1',
        certificate_generated: false,
      };
      
      const updateChain = createMockSupabaseChain(existingProgress);
      mockSupabaseClient.from.mockReturnValue(updateChain);
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(updateChain.update).toHaveBeenCalledWith({
        last_accessed_at: '2024-01-01T12:00:00.000Z',
        current_lesson_id: 'lesson-2',
        completion_percentage: 50,
      });
    });

    it('should mark course as completed with timestamp', async () => {
      const input = { 
        courseId: 'course-1', 
        completed: true 
      };
      
      const existingProgress = {
        id: 'progress-1',
        user_id: 'user-123',
        course_id: 'course-1',
        certificate_generated: false,
      };
      
      const updateChain = createMockSupabaseChain(existingProgress);
      mockSupabaseClient.from.mockReturnValue(updateChain);
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(updateChain.update).toHaveBeenCalledWith({
        last_accessed_at: '2024-01-01T12:00:00.000Z',
        completed_at: '2024-01-01T12:00:00.000Z',
        certificate_generated: true,
      });
    });

    it('should generate certificate on completion', async () => {
      const input = { 
        courseId: 'course-1', 
        completed: true 
      };
      
      const existingProgress = {
        id: 'progress-1',
        certificate_generated: false,
      };
      
      const accountData = { name: 'John Doe' };
      
      // Setup the mock chain for multiple calls
      mockSupabaseClient.from
        .mockReturnValueOnce(createMockSupabaseChain(existingProgress))  // course_progress select
        .mockReturnValueOnce(createMockSupabaseChain(accountData))       // accounts select
        .mockReturnValueOnce(createMockSupabaseChain(null));             // course_progress update
      
      vi.mocked(generateCertificate).mockResolvedValue(undefined);
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(vi.mocked(generateCertificate)).toHaveBeenCalledWith({
        userId: 'user-123',
        courseId: 'course-1',
        fullName: 'John Doe',
      });
    });

    it('should use email as fallback when account name is missing', async () => {
      const input = { 
        courseId: 'course-1', 
        completed: true 
      };
      
      const existingProgress = {
        id: 'progress-1',
        certificate_generated: false,
      };
      
      // Setup the mock chain for multiple calls
      mockSupabaseClient.from
        .mockReturnValueOnce(createMockSupabaseChain(existingProgress))  // course_progress select
        .mockReturnValueOnce(createMockSupabaseChain(null))              // accounts select (no name)
        .mockReturnValueOnce(createMockSupabaseChain(null));             // course_progress update
      
      vi.mocked(generateCertificate).mockResolvedValue(undefined);
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(vi.mocked(generateCertificate)).toHaveBeenCalledWith({
        userId: 'user-123',
        courseId: 'course-1',
        fullName: 'test@example.com',
      });
    });

    it('should handle certificate generation failure gracefully', async () => {
      const input = { 
        courseId: 'course-1', 
        completed: true 
      };
      
      const existingProgress = {
        id: 'progress-1',
        certificate_generated: false,
      };
      
      const accountData = { name: 'John Doe' };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(createMockSupabaseChain(existingProgress))
        .mockReturnValueOnce(createMockSupabaseChain(accountData))
        .mockReturnValueOnce(createMockSupabaseChain(null));
      
      vi.mocked(generateCertificate).mockRejectedValue(new Error('Certificate service failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate certificate:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should not generate certificate if already generated', async () => {
      const input = { 
        courseId: 'course-1', 
        completed: true 
      };
      
      const existingProgress = {
        id: 'progress-1',
        certificate_generated: true, // Already generated
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(existingProgress)
      );
      
      const result = await updateCourseProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(vi.mocked(generateCertificate)).not.toHaveBeenCalled();
    });
  });

  describe('updateLessonProgressAction - Schema Validation', () => {
    it('should transform courseId and lessonId from numbers to strings', async () => {
      const input = { 
        courseId: 123, 
        lessonId: 456,
        completionPercentage: 100,
        completed: true
      };
      
      // Mock existing lesson progress
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      // Mock course and lesson data
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should validate completion percentage bounds', async () => {
      const input = { 
        courseId: '1', 
        lessonId: '1', 
        completionPercentage: -10 
      };
      
      const result = await updateLessonProgressAction(input);
      
      expect(result.error).toBe('Validation failed');
    });

    it('should accept valid completion percentage', async () => {
      const input = { 
        courseId: '1', 
        lessonId: '1', 
        completionPercentage: 75 
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateLessonProgressAction - Core Functionality', () => {
    it('should create new lesson progress record when none exists', async () => {
      const input = { 
        courseId: 'course-1', 
        lessonId: 'lesson-1',
        completionPercentage: 100,
        completed: true
      };
      
      const insertChain = createMockSupabaseChain(null);
      insertChain.single = vi.fn().mockResolvedValue({ data: null, error: null });
      
      mockSupabaseClient.from.mockReturnValue(insertChain);
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(insertChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        course_id: 'course-1',
        lesson_id: 'lesson-1',
        started_at: '2024-01-01T12:00:00.000Z',
        completed_at: '2024-01-01T12:00:00.000Z',
        completion_percentage: 100,
      });
    });

    it('should update existing lesson progress record', async () => {
      const input = { 
        courseId: 'course-1', 
        lessonId: 'lesson-1',
        completionPercentage: 75
      };
      
      const existingProgress = {
        id: 'progress-1',
        user_id: 'user-123',
        lesson_id: 'lesson-1',
      };
      
      const updateChain = createMockSupabaseChain(existingProgress);
      mockSupabaseClient.from.mockReturnValue(updateChain);
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(updateChain.update).toHaveBeenCalledWith({
        completion_percentage: 75,
        course_id: 'course-1',
      });
    });

    it('should calculate course completion based on required lessons', async () => {
      const input = { 
        courseId: 'course-1', 
        lessonId: 'lesson-1',
        completed: true
      };
      
      const existingProgress = {
        id: 'progress-1',
        user_id: 'user-123',
        lesson_id: 'lesson-1',
      };
      
      // Mock lesson progress data
      const lessonProgressData = [
        { lesson_id: 'lesson-1', completed_at: '2024-01-01T10:00:00Z' },
        { lesson_id: 'lesson-2', completed_at: '2024-01-01T11:00:00Z' },
        { lesson_id: 'lesson-6', completed_at: '2024-01-01T12:00:00Z' }, // Not in required list
      ];
      
      // Mock course and lessons data
      const courseData = { docs: [{ id: 'course-1' }] };
      const lessonsData = { 
        docs: [
          { id: 'lesson-1', lesson_number: '1', title: 'Lesson 1' },
          { id: 'lesson-2', lesson_number: '2', title: 'Lesson 2' },
          { id: 'lesson-6', lesson_number: '6', title: 'Lesson 6' },
        ]
      };
      
      mockSupabaseClient.from
        .mockReturnValueOnce(createMockSupabaseChain(existingProgress))  // existing lesson progress
        .mockReturnValueOnce(createMockSupabaseChain(null))             // lesson progress update
        .mockReturnValueOnce({                                          // lesson progress select for calculation
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          data: lessonProgressData,
        })
        .mockReturnValueOnce(createMockSupabaseChain(null));           // course progress update
      
      mockGetCourseBySlug.mockResolvedValue(courseData);
      mockGetCourseLessons.mockResolvedValue(lessonsData);
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
      expect(consoleSpy).toHaveBeenCalledWith('Required lesson numbers:', ['1', '2', '3', '4', '5']);
      expect(consoleSpy).toHaveBeenCalledWith('Course completion: 2/5 required lessons (40%)');
      
      consoleSpy.mockRestore();
    });

    it('should handle missing course data gracefully', async () => {
      const input = { 
        courseId: 'nonexistent', 
        lessonId: 'lesson-1',
        completed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      // Mock Payload to return empty course data
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await updateLessonProgressAction(input);
      
      expect(result).toEqual({ success: true });
      // Should not call course completion logic
      expect(mockGetCourseLessons).not.toHaveBeenCalled();
    });
  });

  describe('submitQuizAttemptAction - Core Functionality', () => {
    it('should record quiz attempt successfully', async () => {
      const input = {
        courseId: 'course-1',
        lessonId: 'lesson-1', 
        quizId: 'quiz-1',
        answers: { q1: 'answer1', q2: 'answer2' },
        score: 85,
        passed: true
      };
      
      const insertChain = createMockSupabaseChain(null);
      mockSupabaseClient.from.mockReturnValue(insertChain);
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
      expect(insertChain.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        course_id: 'course-1',
        lesson_id: 'lesson-1',
        quiz_id: 'quiz-1',
        started_at: '2024-01-01T12:00:00.000Z',
        completed_at: '2024-01-01T12:00:00.000Z',
        score: 85,
        passed: true,
        answers: { q1: 'answer1', q2: 'answer2' },
      });
    });

    it('should mark lesson complete when quiz passed', async () => {
      const input = {
        courseId: 'course-1',
        lessonId: 'lesson-1', 
        quizId: 'quiz-1',
        answers: { q1: 'answer1' },
        score: 85,
        passed: true
      };
      
      // Mock the quiz attempt insert
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      // Mock lesson progress update (this will be called by updateLessonProgressAction)
      mockGetCourseBySlug.mockResolvedValue({ docs: [] });
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
      // The lesson progress update is called internally
    });

    it('should not mark lesson complete when quiz failed', async () => {
      const input = {
        courseId: 'course-1',
        lessonId: 'lesson-1', 
        quizId: 'quiz-1',
        answers: { q1: 'wrong-answer' },
        score: 45,
        passed: false
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
      // Should only record the attempt, no lesson completion
      expect(mockGetCourseBySlug).not.toHaveBeenCalled();
    });
  });

  describe('submitQuizAttemptAction - Schema Validation', () => {
    it('should handle string quiz ID', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: 'quiz-123',
        answers: { q1: 'answer1' },
        score: 85,
        passed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle number quiz ID', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: 123,
        answers: { q1: 'answer1' },
        score: 85,
        passed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle relationship object quiz ID with value property', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: { value: 'quiz-123' },
        answers: { q1: 'answer1' },
        score: 85,
        passed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle object with id property', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: { id: 'quiz-123' },
        answers: { q1: 'answer1' },
        score: 85,
        passed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should validate score range (reject > 100)', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: 'quiz-1',
        answers: { q1: 'answer1' },
        score: 150,
        passed: true
      };
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result.error).toBe('Validation failed');
    });

    it('should validate score range (reject < 0)', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: 'quiz-1',
        answers: { q1: 'answer1' },
        score: -5,
        passed: true
      };
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result.error).toBe('Validation failed');
    });

    it('should validate answers format as record', async () => {
      const input = {
        courseId: '1',
        lessonId: '1', 
        quizId: 'quiz-1',
        answers: { 
          question1: 'answer1', 
          question2: 'answer2',
          question3: 'answer3' 
        },
        score: 85,
        passed: true
      };
      
      mockSupabaseClient.from.mockReturnValue(
        createMockSupabaseChain(null)
      );
      
      const result = await submitQuizAttemptAction(input);
      
      expect(result).toEqual({ success: true });
    });
  });
});