import pg from 'pg';
const { Client } = pg;
// Create a mapping between IDs in the database and actual R2 filenames
const downloadMappings = {
    // Original mappings
    '9e12f8b7-5c32-4a89-b8f0-6d7c9e20a2e1': {
        filename: 'SlideHeroes Presentation Template.zip',
        url: 'https://downloads.slideheroes.com/SlideHeroes%20Presentation%20Template.zip',
        title: 'SlideHeroes Presentation Template',
    },
    'a1b2c3d4-5e6f-4f8b-9e0a-c1d2e3f4a5b6': {
        filename: 'SlideHeroes Swipe File.zip',
        url: 'https://downloads.slideheroes.com/SlideHeroes%20Swipe%20File.zip',
        title: 'SlideHeroes Swipe File',
    },
    'd7e389a2-5f10-4b8c-9a21-3e78f9c61d28': {
        filename: '201 Our Process.pdf',
        url: 'https://downloads.slideheroes.com/201%20Our%20Process.pdf',
        title: 'Our Process Slides',
    },
    'e8f21b37-6c94-4d5a-b3a0-1f7a8d29e456': {
        filename: '202 The Who.pdf',
        url: 'https://downloads.slideheroes.com/202%20The%20Who.pdf',
        title: 'The Who Slides',
    },
    'a5c7d9e8-3b21-4f67-9d85-2e7a41c0b593': {
        filename: '203 The Why - Introductions.pdf',
        url: 'https://downloads.slideheroes.com/203%20The%20Why%20-%20Introductions.pdf',
        title: 'Introduction Slides',
    },
    'b7c94e2d-1a63-4d85-b9f7-e21c8d9a6f04': {
        filename: '204 The Why - Next Steps.pdf',
        url: 'https://downloads.slideheroes.com/204%20The%20Why%20-%20Next%20Steps.pdf',
        title: 'Next Steps Slides',
    },
    'c8e5f931-2b74-4e96-a8c0-f32d7b0a5e18': {
        filename: '301 Idea Generation.pdf',
        url: 'https://downloads.slideheroes.com/301%20Idea%20Generation.pdf',
        title: 'Idea Generation Slides',
    },
    'd9f6a042-3c85-5fa7-b9d1-143e8c1b6f29': {
        filename: '302 What is Structure.pdf',
        url: 'https://downloads.slideheroes.com/302%20What%20is%20Structure.pdf',
        title: 'What Is Structure Slides',
    },
    'e017b153-4d96-6fb8-c0e2-354f9d2c7130': {
        filename: '401 Using Stories.pdf',
        url: 'https://downloads.slideheroes.com/401%20Using%20Stories.pdf',
        title: 'Using Stories Slides',
    },
    'f158c264-5e07-71c9-d1f3-165e0e3d8541': {
        filename: '403 Storyboards in Presentations.pdf',
        url: 'https://downloads.slideheroes.com/403%20Storyboards%20in%20Presentations.pdf',
        title: 'Storyboards Presentations Slides',
    },
    'g269d375-6f18-82da-e2f4-576f0e4f9652': {
        filename: '501 Visual Perception.pdf',
        url: 'https://downloads.slideheroes.com/501%20Visual%20Perception.pdf',
        title: 'Visual Perception Slides',
    },
    'h37ae486-7g29-93eb-f3g5-687g1f5ga763': {
        filename: '503 Detail Fundamental Elements.pdf',
        url: 'https://downloads.slideheroes.com/503%20Detail%20Fundamental%20Elements.pdf',
        title: 'Detail Fundamental Elements Slides',
    },
    'i48bf597-8h3a-a4fc-g4h6-798h2g6hb874': {
        filename: '504 Gestalt Principles of Visual Perception.pdf',
        url: 'https://downloads.slideheroes.com/504%20Gestalt%20Principles%20of%20Visual%20Perception.pdf',
        title: 'Gestalt Principles Slides',
    },
    'j59cg6a8-9i4b-b5gd-h5i7-8a9i3h7ic985': {
        filename: '505 Slide Composition.pdf',
        url: 'https://downloads.slideheroes.com/505%20Slide%20Composition.pdf',
        title: 'Slide Composition Slides',
    },
    'k6adh7b9-ai5c-c6he-i6j8-9baj4i8jda96': {
        filename: '601 Fact-based Persuasion Overview.pdf',
        url: 'https://downloads.slideheroes.com/601%20Fact-based%20Persuasion%20Overview.pdf',
        title: 'Fact-based Persuasion Slides',
    },
    'l7bei8ca-bj6d-d7if-j7k9-acbk5j9keb07': {
        filename: '602 Tables v Graphs.pdf',
        url: 'https://downloads.slideheroes.com/602%20Tables%20v%20Graphs.pdf',
        title: 'Tables v Graphs Slides',
    },
    'm8cfj9db-ck7e-e8jg-k8la-bdcl6kalfc18': {
        filename: '604 Standard Graphs.pdf',
        url: 'https://downloads.slideheroes.com/604%20Standard%20Graphs.pdf',
        title: 'Standard Graphs Slides',
    },
    'n9dgkaec-dl8f-f9kh-l9mb-cedm7lbmgd29': {
        filename: '605 Specialist Graphs.pdf',
        url: 'https://downloads.slideheroes.com/605%20Specialist%20Graphs.pdf',
        title: 'Specialist Graphs Slides',
    },
    'oaehlffd-em9g-gali-mand-dfenolcnhe3a': {
        filename: '701 Preparation and Practice.pdf',
        url: 'https://downloads.slideheroes.com/701%20Preparation%20and%20Practice.pdf',
        title: 'Preparation Practice Slides',
    },
    'pbfimgge-fnah-hbmj-nboe-egfopmdoif4b': {
        filename: '702 Performance.pdf',
        url: 'https://downloads.slideheroes.com/702%20Performance.pdf',
        title: 'Performance Slides',
    },
    'qcgjnhhf-gobi-icnk-ocpf-fhgpqnepjg5c': {
        filename: 'Audience Map.pdf',
        url: 'https://downloads.slideheroes.com/Audience%20Map.pdf',
        title: 'Audience Map',
    },
    'rdhkoiig-hpcj-jdol-pdqg-gihqroftkg6d': {
        filename: 'SlideHeroes Golden Rules.pdf',
        url: 'https://downloads.slideheroes.com/SlideHeroes%20Golden%20Rules.pdf',
        title: 'SlideHeroes Golden Rules',
    },
    // Additional mappings found during script execution
    '1219d375-6f18-85d0-e214-276d1f4e9152': {
        filename: '501 Visual Perception.pdf',
        url: 'https://downloads.slideheroes.com/501%20Visual%20Perception.pdf',
        title: 'Visual Perception Slides',
    },
    '3320e486-7129-91e1-f355-487a215f0263': {
        filename: '503 Detail Fundamental Elements.pdf',
        url: 'https://downloads.slideheroes.com/503%20Detail%20Fundamental%20Elements.pdf',
        title: 'Fundamental Elements Slides',
    },
    '44a1f597-8530-02f2-14a6-598a356a1a74': {
        filename: '504 Gestalt Principles of Visual Perception.pdf',
        url: 'https://downloads.slideheroes.com/504%20Gestalt%20Principles%20of%20Visual%20Perception.pdf',
        title: 'Gestalt Principles Slides',
    },
    '55b21608-9a41-1a13-5527-a09a4a7a2b85': {
        filename: '505 Slide Composition.pdf',
        url: 'https://downloads.slideheroes.com/505%20Slide%20Composition.pdf',
        title: 'Slide Composition Slides',
    },
    '66c35719-0252-2b54-a6a8-a10b5a8a3c96': {
        filename: '602 Tables v Graphs.pdf',
        url: 'https://downloads.slideheroes.com/602%20Tables%20v%20Graphs.pdf',
        title: 'Tables vs Graphs Slides',
    },
    '77d4a820-1a63-3ca5-a7b9-b21c6a9a4d07': {
        filename: '604 Standard Graphs.pdf',
        url: 'https://downloads.slideheroes.com/604%20Standard%20Graphs.pdf',
        title: 'Standard Graphs Slides',
    },
    '88e5a931-2b74-4da6-a8c0-a32d7b0a5e18': {
        filename: '601 Fact-based Persuasion Overview.pdf',
        url: 'https://downloads.slideheroes.com/601%20Fact-based%20Persuasion%20Overview.pdf',
        title: 'Fact-based Persuasion Slides',
    },
    '99f6a042-3c85-5ea7-b9d1-a43e8c1b6f29': {
        filename: '605 Specialist Graphs.pdf',
        url: 'https://downloads.slideheroes.com/605%20Specialist%20Graphs.pdf',
        title: 'Specialist Graphs Slides',
    },
    'aa07b153-4d96-6fb8-c0e2-b54f9d2c7a30': {
        filename: '701 Preparation and Practice.pdf',
        url: 'https://downloads.slideheroes.com/701%20Preparation%20and%20Practice.pdf',
        title: 'Preparation Practice Slides',
    },
    'bb18c264-5e07-71c9-d1f3-c65e0e3d8b41': {
        filename: '702 Performance.pdf',
        url: 'https://downloads.slideheroes.com/702%20Performance.pdf',
        title: 'Performance Slides',
    },
};
export async function fixDownloadR2Mappings() {
    console.log('Fixing download R2 mappings...');
    const client = new Client({
        connectionString: process.env.DATABASE_URI ||
            'postgresql://postgres:postgres@localhost:54322/postgres',
    });
    try {
        await client.connect();
        await client.query('BEGIN');
        // First, let's get all existing download records to check which ones need updating
        const existingDownloads = await client.query(`
      SELECT id, filename, url, title FROM payload.downloads 
      WHERE filename LIKE '%.placeholder' OR url LIKE '%example.com%'
    `);
        console.log(`Found ${existingDownloads.rows.length} downloads with placeholder values`);
        // Update each download record with the correct filename and URL
        for (const [id, data] of Object.entries(downloadMappings)) {
            try {
                // Check if this ID exists in the database
                const existingDownload = existingDownloads.rows.find((row) => row.id === id);
                if (existingDownload) {
                    await client.query(`
            UPDATE payload.downloads
            SET filename = $1, url = $2, title = $3
            WHERE id = $4
          `, [data.filename, data.url, data.title, id]);
                    console.log(`Updated download ${id} with filename: ${data.filename}`);
                }
                else {
                    console.log(`Skipping download ${id} - not found in database or already updated`);
                }
            }
            catch (error) {
                console.error(`Error updating download ${id}:`, error);
                // Continue with other records even if one fails
            }
        }
        // Log the details of any placeholder downloads that weren't in our mapping
        const unmappedPlaceholders = existingDownloads.rows.filter((row) => !Object.keys(downloadMappings).includes(row.id));
        if (unmappedPlaceholders.length > 0) {
            console.log(`Found ${unmappedPlaceholders.length} unmapped placeholder downloads:`);
            unmappedPlaceholders.forEach((row) => {
                console.log(`ID: ${row.id}, Filename: ${row.filename}, Title: ${row.title}`);
            });
        }
        await client.query('COMMIT');
        console.log('Successfully updated download R2 mappings');
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error fixing download R2 mappings:', error);
        throw error;
    }
    finally {
        await client.end();
    }
}
// Run the function
fixDownloadR2Mappings()
    .then(() => console.log('Complete'))
    .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
});
