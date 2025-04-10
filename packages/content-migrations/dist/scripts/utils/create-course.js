"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCourse = createCourse;
/**
 * Script to create a course in Payload CMS
 */
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const url_1 = require("url");
const payload_client_js_1 = require("../utils/payload-client.js");
// Get the current file's directory
const __filename = (0, url_1.fileURLToPath)(import.meta.url);
const __dirname = path_1.default.dirname(__filename);
// Load environment variables based on the NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
console.log(`Loading environment variables from ${envFile}`);
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, `../../${envFile}`) });
/**
 * Creates a course in Payload CMS
 */
async function createCourse() {
    try {
        // Get the Payload client
        const payload = await (0, payload_client_js_1.getPayloadClient)();
        // Check if the course already exists
        const existingCourses = await payload.find({
            collection: 'courses',
            query: {
                slug: 'decks-for-decision-makers',
            },
        });
        if (existingCourses.docs.length > 0) {
            console.log('Course already exists:', existingCourses.docs[0]);
            return existingCourses.docs[0];
        }
        // Create the course
        const course = await payload.create({
            collection: 'courses',
            data: {
                title: 'Decks for Decision Makers',
                slug: 'decks-for-decision-makers',
                description: 'Learn how to create effective presentations for decision makers',
                status: 'published',
                showProgressBar: true,
                estimatedDuration: 240, // 4 hours
                publishedAt: new Date().toISOString(),
            },
        });
        console.log('Course created successfully:', course);
        return course;
    }
    catch (error) {
        console.error('Error creating course:', error);
        throw error;
    }
}
// Run the script if called directly
if (process.argv[1] === (0, url_1.fileURLToPath)(import.meta.url)) {
    createCourse().catch((error) => {
        console.error('Script failed:', error);
        process.exit(1);
    });
}
