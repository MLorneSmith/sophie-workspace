import { promises as fs } from 'fs';
import path from 'path';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import type { Database } from '../../../../../../../packages/supabase/src/database.types';

export interface Lesson {
  id: string;
  lessonID: number;
  chapter: string;
  title: string;
  description: string;
  completed: boolean;
  quizScore: number | null;
  image: string;
  order: number;
  slug: string;
  lessonLength: number;
}

type DBLesson = Database['public']['Tables']['lessons']['Row'];
type DBQuiz = Database['public']['Tables']['quizzes']['Row'];

async function getLessonIdSupa(quizSlug: string) {
  const supabase = getSupabaseServerClient();

  // First, get the quiz data
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('slug', quizSlug)
    .single();

  if (quizError || !quiz) {
    console.error('Error fetching quiz:', quizError);
    return null;
  }

  // Then, get the lesson data using the quiz's slug
  const { data: lesson, error: lessonError } = await supabase
    .from('lessons')
    .select('id, order, lessonID')
    .eq('quiz', quiz.slug)
    .single();

  if (lessonError || !lesson) {
    console.error('Error fetching lesson:', lessonError);
    return null;
  }

  return lesson;
}

const lessonsDirectory = path.join(process.cwd(), 'content', 'lessons');

function parseFrontMatter(content: string): { [key: string]: any } {
  const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontMatterRegex);
  if (!match || !match[1]) return {};

  const frontMatter = match[1];
  const data: { [key: string]: any } = {};
  frontMatter.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      data[key.trim()] = isNaN(Number(value)) ? value : Number(value);
    }
  });

  return data;
}

export async function getLessons(): Promise<Lesson[]> {
  try {
    const fileNames = await fs.readdir(lessonsDirectory);

    const lessonFiles = fileNames.filter((fileName) =>
      fileName.endsWith('.mdoc'),
    );

    const lessons = await Promise.all(
      lessonFiles.map(async (fileName) => {
        try {
          const filePath = path.join(lessonsDirectory, fileName);
          const fileContents = await fs.readFile(filePath, 'utf8');
          const data = parseFrontMatter(fileContents);

          const imagePath =
            data.image || '/placeholder.svg?height=100&width=150';

          const slug = fileName.replace(/\.mdoc$/, '');

          return {
            id: data.id ? data.id.toString() : slug,
            lessonID: data.lessonID || 0,
            chapter: data.chapter || '',
            title: data.title || 'Untitled Lesson',
            description: data.description || '',
            completed: false,
            quizScore: null,
            image: imagePath,
            order: data.order || 0,
            slug: slug,
            lessonLength: data.lessonLength || 0,
          } as Lesson;
        } catch (error) {
          console.error(`Error processing lesson file ${fileName}:`, error);
          return null;
        }
      }),
    );

    // Filter out null values and ensure type safety
    const validLessons = lessons.filter(
      (lesson): lesson is Lesson => lesson !== null && lesson !== undefined,
    );

    const sortedLessons = validLessons.sort((a, b) => a.lessonID - b.lessonID);

    return sortedLessons;
  } catch (error) {
    console.error('Error reading lessons directory:', error);
    return [];
  }
}

export async function getNextLesson(
  currentLessonSlug: string,
): Promise<Lesson | null> {
  try {
    const lessons = await getLessons();
    const currentLessonIndex = lessons.findIndex(
      (lesson) => lesson.slug === currentLessonSlug,
    );

    if (currentLessonIndex === -1) {
      console.error(`Lesson with slug ${currentLessonSlug} not found`);
      return null;
    }

    const nextLessonIndex = currentLessonIndex + 1;
    if (nextLessonIndex >= lessons.length) {
      console.log('This is the last lesson');
      return null;
    }

    return lessons[nextLessonIndex] ?? null;
  } catch (error) {
    console.error('Error getting next lesson:', error);
    return null;
  }
}
