/**
 * Script to test authentication with Payload CMS
 */
import { getPayloadClient } from '../utils/payload-client.js';

/**
 * Tests authentication with Payload CMS
 */
async function testAuth() {
  try {
    // Get the Payload client
    console.log('Getting Payload client...');
    const payload = await getPayloadClient();

    // Try to find documents in a collection
    console.log(
      'Testing authentication by finding documents in the documentation collection...',
    );
    const { docs } = await payload.find({
      collection: 'documentation',
      limit: 1,
    });

    console.log(`Authentication successful! Found ${docs.length} documents.`);
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

// Run the test
testAuth().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
