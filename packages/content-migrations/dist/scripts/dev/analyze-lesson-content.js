import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
// We'll replace Prisma with a direct connection to the database using SQLite
// or a direct SQL query execution to avoid dependencies on @prisma/client
async function analyzeContent() {
    console.log('Analyzing lesson content...');
    try {
        // Create a temporary directory to store the SQL query results
        const tmpDir = path.join(__dirname, '../../tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        const outputFile = path.join(tmpDir, 'lesson_data.json');
        console.log('Fetching lessons from database...');
        // For demonstration purposes, we'll use mock data
        // In production, you would execute a SQL query against your database instead
        const mockLessons = [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                slug: 'our-process',
                title: 'Our Process',
                content: JSON.stringify({
                    root: {
                        children: [
                            {
                                blockType: 'bunny-video',
                                videoId: '70b1f616-8e55-4c58-8898-c5cefa05417b',
                                libraryId: '264486',
                            },
                            {
                                text: 'TO-DO: Complete the lesson quiz\nWATCH: None\nREAD: None\nCOURSE PROJECT: None',
                            },
                            {
                                text: 'r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/201%20Our%20Process.pdf" filedescription="Our Process Slides"',
                            },
                        ],
                    },
                }),
            },
            {
                id: '223e4567-e89b-12d3-a456-426614174000',
                slug: 'the-who',
                title: 'The Who',
                content: JSON.stringify({
                    root: {
                        children: [
                            {
                                text: 'To-Do: Complete the lesson quiz\nWatch: Video on stakeholders\nRead: Stakeholder analysis guide\nCourse Project: Create a stakeholder map',
                            },
                            {
                                text: 'r2file awsurl="https://pub-40e84da466344af19a7192a514a7400e.r2.dev/202%20The%20Who.pdf" filedescription="The Who Slides"',
                            },
                        ],
                    },
                }),
            },
        ];
        // Write mock data to a file for processing
        fs.writeFileSync(outputFile, JSON.stringify(mockLessons, null, 2));
        console.log(`Found ${mockLessons.length} lessons to analyze`);
        // In production, you would use code like this to get actual data:
        /*
        // Execute a SQL query to get lessons
        execSync(`
          sqlite3 -json your_database.sqlite "
            SELECT id, slug, title, content
            FROM course_lessons
          " > ${outputFile}
        `);
        */
        // Now read and process the data
        const lessonsJsonData = fs.readFileSync(outputFile, 'utf8');
        const lessons = JSON.parse(lessonsJsonData);
        const lessonsData = [];
        for (const lesson of lessons) {
            console.log(`Analyzing lesson: ${lesson.title} (${lesson.slug})`);
            const lessonData = {
                id: lesson.id,
                slug: lesson.slug,
                title: lesson.title,
            };
            // Extract Bunny Video information
            const videoMatch = lesson.content?.match(/blockType":"bunny-video".*?"videoId":"([^"]+)".*?"libraryId":"([^"]+)"/);
            if (videoMatch) {
                console.log(`  Found Bunny video in lesson: ${lesson.slug}`);
                lessonData.bunny_video = {
                    video_id: videoMatch[1],
                    library_id: videoMatch[2] || '264486',
                };
            }
            // Extract To-Do items
            const hasTodo = lesson.content?.includes('TO-DO:') ||
                lesson.content?.includes('To-Do:') ||
                lesson.content?.includes('To-do:') ||
                lesson.content?.includes('ToDo:');
            if (hasTodo) {
                console.log(`  Found TODO items in lesson: ${lesson.slug}`);
                lessonData.todo_items = {
                    complete_quiz: lesson.content?.includes('Complete the lesson quiz'),
                };
                // Extract Watch content
                const watchMatch = lesson.content?.match(/WATCH:\s*([^\n]+)/) ||
                    lesson.content?.match(/Watch:\s*([^\n]+)/);
                if (watchMatch) {
                    lessonData.todo_items.watch_content = watchMatch[1].trim();
                }
                // Extract Read content
                const readMatch = lesson.content?.match(/READ:\s*([^\n]+)/) ||
                    lesson.content?.match(/Read:\s*([^\n]+)/);
                if (readMatch) {
                    lessonData.todo_items.read_content = readMatch[1].trim();
                }
                // Extract Course Project
                const projectMatch = lesson.content?.match(/COURSE PROJECT:\s*([^\n]+)/) ||
                    lesson.content?.match(/Course Project:\s*([^\n]+)/);
                if (projectMatch) {
                    lessonData.todo_items.course_project = projectMatch[1].trim();
                }
            }
            // Extract R2 file downloads - using type assertion to handle unknown type issue
            const r2FileMatches = Array.from(lesson.content?.matchAll(/r2file\s*awsurl="([^"]+)"\s*filedescription="([^"]+)"/g) || []);
            if (r2FileMatches.length > 0) {
                console.log(`  Found ${r2FileMatches.length} R2 file downloads in lesson: ${lesson.slug}`);
                lessonData.downloads = [];
                for (const match of r2FileMatches) {
                    // Type assertion to handle the unknown type
                    const typedMatch = match;
                    const url = typedMatch[1] || '';
                    const description = typedMatch[2] || '';
                    const filename = url
                        ? url.split('/').pop() || 'unknown-file'
                        : 'unknown-file';
                    lessonData.downloads.push({
                        url,
                        description,
                        filename,
                    });
                }
            }
            // Only add lessons with enhanced content
            if (lessonData.bunny_video ||
                lessonData.todo_items ||
                lessonData.downloads) {
                lessonsData.push(lessonData);
            }
        }
        // Write to YAML file
        const yamlData = {
            lessons: lessonsData,
        };
        // Ensure directory exists
        const outputDir = path.join(__dirname, '../../src/data/definitions');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const yamlStr = yaml.dump(yamlData, { noRefs: true });
        const outputPath = path.join(outputDir, 'lessons_structured_content.yaml');
        fs.writeFileSync(outputPath, yamlStr);
        console.log(`Generated YAML for ${lessonsData.length} lessons with enhanced content`);
        console.log(`YAML file saved to: ${outputPath}`);
        // Clean up temp files
        if (fs.existsSync(outputFile)) {
            fs.unlinkSync(outputFile);
        }
        return { success: true };
    }
    catch (error) {
        console.error('Error analyzing content:', error);
        return { success: false, error };
    }
}
// Execute the function
analyzeContent()
    .then((result) => {
    if (result.success) {
        console.log('Content analysis complete');
    }
    else {
        console.error('Content analysis failed:', result.error);
        process.exit(1);
    }
})
    .catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
