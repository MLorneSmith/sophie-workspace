import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

import { getPayloadClient } from '../src/client/payloadClient'

async function listDocumentation() {
  // Get the Payload client
  const payload = await getPayloadClient()

  try {
    // Fetch all documentation
    const docs = await payload.find({
      collection: 'documentation' as any,
      limit: 100,
    })

    console.log(`Found ${docs.totalDocs} documentation items:`)

    // Print a summary of each document
    docs.docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.title} (${doc.slug})`)
      console.log(`   Status: ${doc.status}`)
      console.log(`   Published: ${doc.publishedAt}`)
      console.log(
        `   Categories: ${(doc.categories || []).map((c: any) => c.category).join(', ') || 'None'}`,
      )
      console.log(`   Tags: ${(doc.tags || []).map((t: any) => t.tag).join(', ') || 'None'}`)
      console.log('')
    })
  } catch (error) {
    console.error('Error listing documentation:', error)
  }
}

// Run the function
listDocumentation().catch((error) => {
  console.error('Failed to list documentation:', error)
  process.exit(1)
})
