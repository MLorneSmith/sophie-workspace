import { postgresAdapter } from '@payloadcms/db-postgres'; // UNCOMMENTED
console.log('[PAYLOAD-CONFIG] Starting payload.config.ts loading.'); // Added log
import { lexicalEditor } from '@payloadcms/richtext-lexical'; // UNCOMMENTED
import path from 'path';
import { buildConfig } from 'payload'; // Changed from 'payload' to 'payload/config' for v3
import { fileURLToPath } from 'url';
import { CourseLessons } from './collections/CourseLessons.js';
import { CourseQuizzes } from './collections/CourseQuizzes.js';
import { Courses } from './collections/Courses.js';
import { Documentation } from './collections/Documentation.js';
import { Downloads } from './collections/Downloads.js'; // Uncomment Downloads import
import { Media } from './collections/Media.js';
import { Posts } from './collections/Posts.js'; // Uncomment Posts import
import { Private } from './collections/Private.js';
import { QuizQuestions } from './collections/QuizQuestions.js';
import { SurveyQuestions } from './collections/SurveyQuestions.js';
import { Surveys } from './collections/Surveys.js';
import { Users } from './collections/Users.js';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || '';
const payloadSecret = process.env.PAYLOAD_SECRET || '';
console.log('[PAYLOAD-CONFIG] About to call buildConfig.'); // Added log
export default buildConfig({
    secret: payloadSecret,
    serverURL: serverURL,
    collections: [
        Users,
        Media,
        Downloads, // Uncomment Downloads to include it in the schema
        Posts, // Uncomment Posts to include it in the schema
        Documentation,
        Private,
        Courses,
        CourseLessons,
        CourseQuizzes,
        QuizQuestions,
        SurveyQuestions,
        Surveys,
    ],
    globals: [
    // Add globals here
    ],
    typescript: {
        outputFile: path.resolve(dirname, '../payload-types.ts'),
    },
    editor: lexicalEditor({}),
    db: (() => {
        console.log('[PAYLOAD-CONFIG] About to initialize postgresAdapter.');
        return postgresAdapter({
            pool: {
                connectionString: process.env.DATABASE_URI,
            },
            schemaName: 'payload',
            idType: 'uuid', // Explicitly set ID type to UUID
            push: false, // Disable schema push in development
        });
    })(),
    plugins: [
    // s3Storage({ ... }),
    // nestedDocsPlugin({ ... }),
    ],
    bin: [
        {
            scriptPath: path.resolve(dirname, './seed-static-collections.mjs'),
            key: 'seed-static-collections',
        },
        {
            scriptPath: path.resolve(dirname, '../../packages/payload-local-init/stage-2-seed-core/seed-media-downloads.mjs'),
            key: 'seed-media-downloads',
        },
        {
            scriptPath: path.resolve(dirname, '../../packages/payload-local-init/stage-2-seed-core/seed-main-content-collections.mjs'),
            key: 'seed-main-content-collections',
        },
        {
            scriptPath: path.resolve(dirname, '../../packages/payload-local-init/stage-2-seed-core/seed-course-structure.mjs'),
            key: 'seed-course-structure',
        },
    ],
});
//# sourceMappingURL=payload.config.js.map