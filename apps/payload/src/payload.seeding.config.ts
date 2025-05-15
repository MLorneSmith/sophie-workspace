import { postgresAdapter } from '@payloadcms/db-postgres';
import { buildConfig } from 'payload';
import path from 'path';
import { fileURLToPath } from 'url';

// Import collections with .js extensions for compilation compatibility
import { CourseLessons } from './collections/CourseLessons.js';
import { CourseQuizzes } from './collections/CourseQuizzes.js';
import { Courses } from './collections/Courses.js';
import { Documentation } from './collections/Documentation.js';
import { Downloads } from './collections/Downloads.js';
import { Media } from './collections/Media.js';
import { Posts } from './collections/Posts.js';
import { Private } from './collections/Private.js';
import { QuizQuestions } from './collections/QuizQuestions.js';
import { SurveyQuestions } from './collections/SurveyQuestions.js';
import { Surveys } from './collections/Surveys.js';
import { Users } from './collections/Users.js';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || '';
const payloadSecret = process.env.PAYLOAD_SECRET || '';

export default buildConfig({
  secret: payloadSecret,
  serverURL: serverURL,
  collections: [
    Users,
    Media, // Uncommented Media
    // Courses, // Uncommented Courses
    // CourseLessons, // Uncomment simplified CourseLessons
    // CourseQuizzes, // Uncommented CourseQuizzes
    // QuizQuestions, // Uncomment QuizQuestions
    // Surveys, // Uncommented Surveys
    // SurveyQuestions, // Comment out SurveyQuestions
    // Documentation, // Comment out Documentation
    // Posts, // Comment out Posts
    // Private, // Comment out Private
    // Downloads, // Comment out Downloads
  ],
  // Only include the database adapter, exclude other plugins/editor for seeding config
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    schemaName: 'payload',
    push: false, // Disable schema push for seeding
  }),
  // Exclude editor, plugins, globals, bin array as they are not needed for seeding
});
