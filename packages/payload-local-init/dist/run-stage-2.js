// stage-2-seed-core/run-stage-2.ts
import { getPayload } from "payload";

// ../../apps/payload/src/payload.seeding.config.ts
import { postgresAdapter } from "@payloadcms/db-postgres";
import { buildConfig } from "payload";
import path from "path";
import { fileURLToPath } from "url";

// ../../apps/payload/src/collections/Media.ts
var Media = {
  slug: "media",
  access: {
    read: () => true
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true
    }
  ],
  upload: true
};

// ../../apps/payload/src/collections/Users.ts
var Users = {
  slug: "users",
  admin: {
    useAsTitle: "email"
  },
  auth: true,
  fields: [
    // Email added by default
    // Add more fields as needed
  ]
};

// ../../apps/payload/src/payload.seeding.config.ts
var filename = fileURLToPath(import.meta.url);
var dirname = path.dirname(filename);
var serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || "";
var payloadSecret = process.env.PAYLOAD_SECRET || "";
var payload_seeding_config_default = buildConfig({
  secret: payloadSecret,
  serverURL,
  collections: [
    Users,
    Media
    // Uncommented Media
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
      connectionString: process.env.DATABASE_URI
    },
    schemaName: "payload",
    push: false
    // Disable schema push for seeding
  })
  // Exclude editor, plugins, globals, bin array as they are not needed for seeding
});

// data/r2-media-list.ts
var R2_MEDIA_LIST = [
  {
    key: "201 Our Process.pdf",
    size: 215160,
    contentType: "application/pdf"
  },
  {
    key: "202 The Who.pdf",
    size: 280200,
    contentType: "application/pdf"
  },
  {
    key: "203 The Why - Introductions.pdf",
    size: 311900,
    contentType: "application/pdf"
  },
  {
    key: "204 The Why - Next Steps.pdf",
    size: 285790,
    contentType: "application/pdf"
  },
  {
    key: "301 Idea Generation.pdf",
    size: 159e4,
    contentType: "application/pdf"
  },
  {
    key: "302 What is Structure.pdf",
    size: 480520,
    contentType: "application/pdf"
  },
  {
    key: "401 Using Stories.pdf",
    size: 843450,
    contentType: "application/pdf"
  },
  {
    key: "403 Storyboards in Presentations.pdf",
    size: 230140,
    contentType: "application/pdf"
  },
  {
    key: "501 Visual Perception.pdf",
    size: 311910,
    contentType: "application/pdf"
  },
  {
    key: "503 Detail Fundamental Elements.pdf",
    size: 171e4,
    contentType: "application/pdf"
  },
  {
    key: "504 Gestalt Principles of Visual Perception.pdf",
    size: 212860,
    contentType: "application/pdf"
  },
  {
    key: "505 Slide Composition.pdf",
    size: 111e4,
    contentType: "application/pdf"
  },
  {
    key: "601 Fact-based Persuasion Overview.pdf",
    size: 760480,
    contentType: "application/pdf"
  },
  {
    key: "602 Tables v Graphs.pdf",
    size: 323340,
    contentType: "application/pdf"
  },
  {
    key: "604 Standard Graphs.pdf",
    size: 794340,
    contentType: "application/pdf"
  },
  {
    key: "605 Specialist Graphs.pdf",
    size: 594730,
    contentType: "application/pdf"
  },
  {
    key: "701 Preparation and Practice.pdf",
    size: 438490,
    contentType: "application/pdf"
  },
  {
    key: "702 Performance.pdf",
    size: 245130,
    contentType: "application/pdf"
  },
  {
    key: "Art Craft of Presentation Creation.png",
    size: 103100,
    contentType: "image/png"
  },
  {
    key: "BCG-teardown-optimized.jpg",
    size: 33580,
    contentType: "image/jpeg"
  },
  {
    key: "Conquering Public Speaking Anxiety.png",
    size: 165232,
    contentType: "image/png"
  },
  {
    key: "Defense of PowerPoint.png",
    size: 128575,
    contentType: "image/png"
  },
  {
    key: "Presentation Tips Optimized.png",
    size: 160997,
    contentType: "image/png"
  },
  {
    key: "Presentation Tools-optimized.png",
    size: 79509,
    contentType: "image/png"
  },
  {
    key: "Seneca Partnership.webp",
    size: 7220,
    contentType: "image/webp"
  },
  {
    key: "art-craft-business-presentation-creation-image.png",
    size: 1967436,
    contentType: "image/png"
  },
  {
    key: "averages-value-lines-image.png",
    size: 1959065,
    contentType: "image/png"
  },
  {
    key: "basic-graphs-image.png",
    size: 97196,
    contentType: "image/png"
  },
  {
    key: "before-we-begin-image.png",
    size: 78240,
    contentType: "image/png"
  },
  {
    key: "before_we_begin.png",
    size: 78240,
    contentType: "image/png"
  },
  {
    key: "business-charts.jpg",
    size: 44858,
    contentType: "image/jpeg"
  },
  {
    key: "cagr-arrows-image.png",
    size: 1914104,
    contentType: "image/png"
  },
  {
    key: "custom-fonts-image.webp",
    size: 151344,
    contentType: "image/webp"
  },
  {
    key: "customizing-setup-image.png",
    size: 1706270,
    contentType: "image/png"
  },
  {
    key: "design-toolbars-image.png",
    size: 2107490,
    contentType: "image/png"
  },
  {
    key: "detail_elements_of_design.png",
    size: 521030,
    contentType: "image/png"
  },
  {
    key: "dynamic-agendas-image.png",
    size: 1943245,
    contentType: "image/png"
  },
  {
    key: "efficient-elements-image.png",
    size: 2066008,
    contentType: "image/png"
  },
  {
    key: "fact-based-persuasion-image.png",
    size: 138500,
    contentType: "image/png"
  },
  {
    key: "fact_based_persuasion_overview.png",
    size: 138500,
    contentType: "image/png"
  },
  {
    key: "font-awesome-image.png",
    size: 186e4,
    contentType: "image/png"
  },
  {
    key: "fundamental-design-detail-image.png",
    size: 502030,
    contentType: "image/png"
  },
  {
    key: "fundamental-design-overview-image.png",
    size: 499e3,
    contentType: "image/png"
  },
  {
    key: "gestalt-principles-image.png",
    size: 536030,
    contentType: "image/png"
  },
  {
    key: "gestalt_principles_of_perception.png",
    size: 536030,
    contentType: "image/png"
  },
  {
    key: "idea-generation-image.png",
    size: 221150,
    contentType: "image/png"
  },
  {
    key: "idea_generation.png",
    size: 221150,
    contentType: "image/png"
  },
  {
    key: "lesson-0-image.png",
    size: 422570,
    contentType: "image/png"
  },
  {
    key: "lesson_zero.png",
    size: 422.57,
    contentType: "image/png"
  },
  {
    key: "marimekko-charts-image.jpg",
    size: 92780,
    contentType: "image/jpg"
  },
  {
    key: "merging-shapes-image.png",
    size: 162e4,
    contentType: "image/png"
  },
  {
    key: "michael-smith-avatar.webp",
    size: 3790,
    contentType: "image/webp"
  },
  {
    key: "michael_200px.webp",
    size: 4010,
    contentType: "image/webp"
  },
  {
    key: "our-process-image.png",
    size: 110990,
    contentType: "image/png"
  },
  {
    key: "our_process.png",
    size: 110990,
    contentType: "image/png"
  },
  {
    key: "overview_elements_design.png",
    size: 499e3,
    contentType: "image/png"
  },
  {
    key: "performance-image.png",
    size: 132240,
    contentType: "image/png"
  },
  {
    key: "performance.png",
    size: 132240,
    contentType: "image/png"
  },
  {
    key: "pitch-deck-image.png",
    size: 189e4,
    contentType: "image/png"
  },
  {
    key: "pitch-decks-funding-proposals.png",
    size: 202730,
    contentType: "image/png"
  },
  {
    key: "powerpoint-presentations-defense-image.png",
    size: 19e5,
    contentType: "image/png"
  },
  {
    key: "ppt-templates-image.png",
    size: 201660,
    contentType: "image/png"
  },
  {
    key: "pptproductivity-image.png",
    size: 197e4,
    contentType: "image/png"
  },
  {
    key: "preparation-practice-image.png",
    size: 120220,
    contentType: "image/png"
  },
  {
    key: "preparation_practice.png",
    size: 120220,
    contentType: "image/png"
  },
  {
    key: "presentation-review-bcg-image.png",
    size: 149e4,
    contentType: "image/png"
  },
  {
    key: "presentation-review-bcg-slide11.webp",
    size: 32510,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide13.webp",
    size: 25820,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide16.webp",
    size: 31530,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide17.webp",
    size: 33320,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide18.webp",
    size: 37980,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide20.webp",
    size: 27600,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide22.webp",
    size: 35160,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide24.webp",
    size: 38220,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide26.webp",
    size: 42570,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide28.webp",
    size: 49570,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide3.webp",
    size: 15650,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide30.webp",
    size: 30040,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide31.webp",
    size: 48870,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide33.webp",
    size: 40290,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide37.webp",
    size: 49770,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide38.webp",
    size: 29040,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide40.webp",
    size: 30540,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide42.webp",
    size: 29510,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide5.webp",
    size: 15380,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide7.webp",
    size: 30300,
    contentType: "image/webp"
  },
  {
    key: "presentation-review-bcg-slide9.webp",
    size: 38760,
    contentType: "image/webp"
  },
  {
    key: "presentation-tips-image.png",
    size: 172e4,
    contentType: "image/png"
  },
  {
    key: "presentation-tools-gantt-chart-powerpoint-optimized.jpg",
    size: 24090,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-image.png",
    size: 158e4,
    contentType: "image/png"
  },
  {
    key: "presentation-tools-office-timeline-optimized.jpg",
    size: 31520,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-poll-everywhere-optimized.jpg",
    size: 38640,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-teamslide-optimized.jpg",
    size: 40310,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-think-cell-optimized.jpg",
    size: 36340,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-think-cell-pain-points-optimized.jpg",
    size: 41340,
    contentType: "image/jpg"
  },
  {
    key: "presentation-tools-tufte-circle-optimized.png",
    size: 175320,
    contentType: "image/png"
  },
  {
    key: "public-speaking-anxiety-arousal-and-performance-optimized.jpg",
    size: 60300,
    contentType: "image/jpg"
  },
  {
    key: "public-speaking-anxiety-image.png",
    size: 173e4,
    contentType: "image/png"
  },
  {
    key: "public-speaking-anxiety-public-speaking-anxiety-optimized.jpg",
    size: 62160,
    contentType: "image/jpg"
  },
  {
    key: "self_assessment.png",
    size: 120120,
    contentType: "image/jpg"
  },
  {
    key: "seneca-partnership-image.png",
    size: 175e4,
    contentType: "image/png"
  },
  {
    key: "shortcuts-image.png",
    size: 162e4,
    contentType: "image/png"
  },
  {
    key: "skills-self-assessment-image.png",
    size: 120120,
    contentType: "image/png"
  },
  {
    key: "slide-composition-image.png",
    size: 504730,
    contentType: "image/png"
  },
  {
    key: "slide-master-image.png",
    size: 166e4,
    contentType: "image/png"
  },
  {
    key: "slide_composition.png",
    size: 504730,
    contentType: "image/png"
  },
  {
    key: "specialist-graphs-image.png",
    size: 102980,
    contentType: "image/png"
  },
  {
    key: "specialist_graphs.png",
    size: 97200,
    contentType: "image/png"
  },
  {
    key: "storyboards-film-image.png",
    size: 160970,
    contentType: "image/png"
  },
  {
    key: "storyboards-presentations-image.png",
    size: 143510,
    contentType: "image/png"
  },
  {
    key: "storyboards_in_film.png",
    size: 160970,
    contentType: "image/png"
  },
  {
    key: "storyboards_in_presentations.png",
    size: 143510,
    contentType: "image/png"
  },
  {
    key: "tables-vs-graphs-image.png",
    size: 144560,
    contentType: "image/png"
  },
  {
    key: "tables_vs_graphs.png",
    size: 144560,
    contentType: "image/png"
  },
  {
    key: "the-who-image.png",
    size: 112570,
    contentType: "image/png"
  },
  {
    key: "the-why-introductions-image.png",
    size: 108560,
    contentType: "image/png"
  },
  {
    key: "the-why-next-steps-image.png",
    size: 96100,
    contentType: "image/png"
  },
  {
    key: "the_who.png",
    size: 112570,
    contentType: "image/png"
  },
  {
    key: "the_why_introductions.png",
    size: 108560,
    contentType: "image/png"
  },
  {
    key: "the_why_next_steps.png",
    size: 96100,
    contentType: "image/png"
  },
  {
    key: "tools-and-resources-image.png",
    size: 93790,
    contentType: "image/png"
  },
  {
    key: "tools_resources.png",
    size: 93790,
    contentType: "image/png"
  },
  {
    key: "tornado-image.jpg",
    size: 104600,
    contentType: "image/jpg"
  },
  {
    key: "typology-business-charts-business-charts-infographic-optimized.jpg",
    size: 406070,
    contentType: "image/jpg"
  },
  {
    key: "typology-business-charts-data-relationships-and-charts-optimized.jpg",
    size: 34570,
    contentType: "image/jpg"
  },
  {
    key: "typology-business-charts-image.png",
    size: 173e4,
    contentType: "image/png"
  },
  {
    key: "typology-business-charts-respresenting-quantitative-values-optimized.jpg",
    size: 25400,
    contentType: "image/jpg"
  },
  {
    key: "using-ai-tools-image.png",
    size: 1750,
    contentType: "image/png"
  },
  {
    key: "using-stories-image.png",
    size: 151550,
    contentType: "image/png"
  },
  {
    key: "using_stories.png",
    size: 151550,
    contentType: "image/png"
  },
  {
    key: "visual-perception-image.png",
    size: 494080,
    contentType: "image/png"
  },
  {
    key: "visual_perception.png",
    size: 494080,
    contentType: "image/png"
  },
  {
    key: "waterfall-graphs-image.jpg",
    size: 80680,
    contentType: "image/jpg"
  },
  {
    key: "what-is-structure-image.png",
    size: 228630,
    contentType: "image/jpg"
  },
  {
    key: "what_structure.png",
    size: 228630,
    contentType: "image/png"
  }
];

// stage-2-seed-core/seed-media.ts
async function seedMedia(payload) {
  console.log("Starting Stage 2: Seed Media...");
  try {
    console.log("Executing: Seed Media (via orchestrator)...");
    const mediaObjects = R2_MEDIA_LIST;
    console.log(`Found ${mediaObjects.length} media objects in SSOT.`);
    console.log("Seeding Media...");
    for (const mediaObject of mediaObjects) {
      try {
        const existingMediaItem = await payload.find({
          collection: "media",
          where: {
            filename: {
              equals: mediaObject.key
              // Use R2 object key as filename
            }
          }
        });
        if (existingMediaItem.docs.length === 0) {
          const fileUrl = `https://images.slideheroes.com/${mediaObject.key}`;
          const dataToCreate = {
            filename: mediaObject.key,
            // Use R2 object key as filename
            filesize: mediaObject.size,
            mimeType: mediaObject.contentType,
            // Get mime type from SSOT
            url: fileUrl,
            // Provide the public URL
            alt: mediaObject.key
            // Use filename as default alt text, might need to source from elsewhere
            // Add other relevant fields from SSOT if available (width, height, focal_x, focal_y)
            // Note: SSOT might not have dimensions directly, might need to source from elsewhere
          };
          console.log(
            `Attempting to create media item with data: ${JSON.stringify(dataToCreate, null, 2)}`
          );
          const createdMediaItem = await payload.create({
            collection: "media",
            data: dataToCreate
          });
          console.log(
            `Created Media: ${createdMediaItem.filename} (${createdMediaItem.id})`
          );
        } else {
          const existingId = existingMediaItem.docs[0]?.id;
          console.log(
            `Media already exists, skipping creation: ${mediaObject.key}${existingId ? ` (${existingId})` : ""}`
          );
        }
      } catch (error) {
        console.error(
          `Error creating media item ${mediaObject.key}:`,
          error.message
        );
        if (error.payloadErrors) {
          console.error(
            "Payload errors:",
            JSON.stringify(error.payloadErrors, null, 2)
          );
        } else {
          console.error("Full error object:", JSON.stringify(error, null, 2));
        }
      }
    }
    console.log("Media seeding completed.");
  } catch (error) {
    const errorMessage = error?.message ?? "Unknown error";
    console.error("Error during Seed Media process:", errorMessage);
    if (error.payloadErrors) {
      console.error(
        "Payload errors:",
        JSON.stringify(error.payloadErrors, null, 2)
      );
    } else {
      console.error("Full error object:", JSON.stringify(error, null, 2));
    }
    throw error;
  }
}

// stage-2-seed-core/run-stage-2.ts
async function runAllStage2Seeders() {
  console.log("--- run-stage-2.ts: Starting Stage 2 Seeders ---");
  let payload = null;
  const allIdMaps = {};
  try {
    console.log(
      "Starting Stage 2: Seed Core Content (Orchestrated)..."
    );
    console.log(
      "Attempting to initialize Payload for Stage 2 orchestration..."
    );
    console.log("[RUN-STAGE-2-DEBUG] Before getPayload call.");
    console.log(`[RUN-STAGE-2-DEBUG] PAYLOAD_CONFIG_PATH: ${process.env.PAYLOAD_CONFIG_PATH}`);
    console.log(`[RUN-STAGE-2-DEBUG] DATABASE_URI: ${process.env.DATABASE_URI ? "Set" : "Not Set"}`);
    console.log("[RUN-STAGE-2] About to initialize Payload (call getPayload)...");
    console.log("[RUN-STAGE-2] Adding small delay before getPayload...");
    await new Promise((resolve) => setTimeout(resolve, 100));
    console.log("[RUN-STAGE-2] Delay finished. Calling getPayload...");
    payload = await getPayload({ config: payload_seeding_config_default });
    console.log("[RUN-STAGE-2-DEBUG] Payload initialized successfully.");
    console.log("[RUN-STAGE-2] Payload initialized successfully.");
    process.env.DISABLE_NESTED_DOCS_PLUGIN = "true";
    console.log("[RUN-STAGE-2-DEBUG] DISABLE_NESTED_DOCS_PLUGIN set to true.");
    console.log("[RUN-STAGE-2] Running seedMedia...");
    const mediaMap = await seedMedia(payload);
    allIdMaps.media = mediaMap;
    console.log("[RUN-STAGE-2] seedMedia finished.");
    console.log("Only seedMedia executed for this test.");
    console.log(
      "Stage 2: Seed Core Content (Orchestrated) completed."
    );
    console.log(JSON.stringify(allIdMaps, null, 2));
  } catch (error) {
    console.error(
      "Error during Stage 2 Orchestration:",
      error.message,
      error.stack
    );
    process.env.DISABLE_NESTED_DOCS_PLUGIN = void 0;
    throw error;
  } finally {
    process.env.DISABLE_NESTED_DOCS_PLUGIN = void 0;
    console.log(
      "[Shutdown Debug] Entering simplified finally block."
    );
    console.log("Stage 2 Orchestration process finished.");
    console.log(
      "[Shutdown Debug] Allowing process to exit naturally."
    );
  }
}
runAllStage2Seeders().catch((err) => {
  console.error(
    "Stage 2 Orchestration script execution failed:",
    err
  );
  process.exit(1);
});
