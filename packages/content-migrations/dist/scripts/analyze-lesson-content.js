const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Mock lesson data
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
    })
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
    })
  }
];

function analyzeContent() {
  console.log('Analyzing lesson content...');
  
  const lessonsData = [];

  for (const lesson of mockLessons) {
    console.log('Analyzing lesson: ' + lesson.title + ' (' + lesson.slug + ')');
    
    const lessonData = {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
    };

    // Extract Bunny Video information
    const videoMatch = lesson.content.match(
      /blockType":"bunny-video".*?"videoId":"([^"]+)".*?"libraryId":"([^"]+)"/
    );
    
    if (videoMatch) {
      console.log('  Found Bunny video in lesson: ' + lesson.slug);
      lessonData.bunny_video = {
        video_id: videoMatch[1],
        library_id: videoMatch[2] || '264486',
      };
    }

    // Extract To-Do items
    const hasTodo = 
      lesson.content.includes('TO-DO:') || 
      lesson.content.includes('To-Do:') || 
      lesson.content.includes('To-do:') ||
      lesson.content.includes('ToDo:');
                   
    if (hasTodo) {
      console.log('  Found TODO items in lesson: ' + lesson.slug);
      lessonData.todo_items = {
        complete_quiz: lesson.content.includes('Complete the lesson quiz'),
      };

      // Extract Watch content
      const watchMatch = 
        lesson.content.match(/WATCH:\s*([^\n]+)/) || 
        lesson.content.match(/Watch:\s*([^\n]+)/);
      if (watchMatch) {
        lessonData.todo_items.watch_content = watchMatch[1].trim();
      }

      // Extract Read content
      const readMatch = 
        lesson.content.match(/READ:\s*([^\n]+)/) || 
        lesson.content.match(/Read:\s*([^\n]+)/);
      if (readMatch) {
        lessonData.todo_items.read_content = readMatch[1].trim();
      }

      // Extract Course Project
      const projectMatch = 
        lesson.content.match(/COURSE PROJECT:\s*([^\n]+)/) || 
        lesson.content.match(/Course Project:\s*([^\n]+)/);
      if (projectMatch) {
        lessonData.todo_items.course_project = projectMatch[1].trim();
      }
    }

    // Extract R2 file downloads
    const r2FileMatches = Array.from(
      lesson.content.matchAll(
        /r2file\s*awsurl="([^"]+)"\s*filedescription="([^"]+)"/g
      ) || []
    );
    
    if (r2FileMatches.length > 0) {
      console.log('  Found ' + r2FileMatches.length + ' R2 file downloads in lesson: ' + lesson.slug);
      lessonData.downloads = [];

      for (const match of r2FileMatches) {
        const url = match[1] || '';
        const description = match[2] || '';
        const filename = url ? url.split('/').pop() || 'unknown-file' : 'unknown-file';
        
        lessonData.downloads.push({
          url,
          description,
          filename,
        });
      }
    }

    // Only add lessons with enhanced content
    if (
      lessonData.bunny_video ||
      lessonData.todo_items ||
      lessonData.downloads
    ) {
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

  const yamlStr = yaml.dump(yamlData);
  const outputPath = path.join(outputDir, 'lessons_structured_content.yaml');
  fs.writeFileSync(outputPath, yamlStr);

  console.log('Generated YAML for ' + lessonsData.length + ' lessons with enhanced content');
  console.log('YAML file saved to: ' + outputPath);
}

analyzeContent();
