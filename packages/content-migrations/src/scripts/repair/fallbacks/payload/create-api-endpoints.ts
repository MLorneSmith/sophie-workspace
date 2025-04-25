import fs from 'fs';
import path from 'path';

/**
 * Creates API endpoints for fallback system in Payload
 */
export async function createApiEndpoints() {
  try {
    const apiDir = path.join(
      process.cwd(),
      'apps/payload/src/routes/api/fallbacks',
    );

    // Create API directory if it doesn't exist
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }

    // Create the relationships endpoint file
    const relationshipsEndpointPath = path.join(apiDir, 'relationships.ts');
    const relationshipsEndpointContent = `
import { Payload } from 'payload';
import { Request, Response } from 'express';
import payload from 'payload';
import { sql } from 'drizzle-orm';

/**
 * API endpoint to provide fallback relationship data
 * Used by the useFallbackRelationships hook
 */
export default async (req: Request, res: Response): Promise<Response> => {
  try {
    const { collection, id, field, relationTo } = req.query;
    
    // Validate required parameters
    if (!collection || !id || !field) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: collection, id, and field are required',
      });
    }
    
    // Initialize success response
    let success = false;
    let value = null;
    let method = 'none';
    
    // Try different fallback methods in order of preference
    
    // Method 1: Try the database view first
    try {
      const query = \`
        SELECT related_ids FROM payload.relationship_fallbacks_view 
        WHERE collection = $1 AND document_id = $2 AND field_name = $3
      \`;
      
      const result = await payload.db.drizzle.execute(sql\`
        SELECT related_ids FROM payload.relationship_fallbacks_view 
        WHERE collection = \${collection.toString()} 
        AND document_id = \${id.toString()} 
        AND field_name = \${field.toString()}
      \`);
      
      if (result && result[0] && result[0].related_ids) {
        value = Array.isArray(result[0].related_ids) 
          ? result[0].related_ids 
          : [result[0].related_ids];
        
        success = true;
        method = 'database_view';
      }
    } catch (dbError) {
      console.log('Database view fallback failed:', dbError);
      // Continue to next method
    }
    
    // Method 2: Try direct SQL query if database view failed
    if (!success) {
      try {
        // Convert collection and field to relevant table and column names
        const collectionTable = collection.toString();
        const fieldColumn = field.toString().replace(/\\./, '_');
        const relationTable = Array.isArray(relationTo) 
          ? relationTo[0].toString() 
          : relationTo ? relationTo.toString() : '';
        
        // Query the relevant relationships table directly
        const relationshipTableName = \`\${collectionTable}_\${fieldColumn}_rels\`;
        
        const result = await payload.db.drizzle.execute(sql\`
          SELECT array_agg(parent_id) as related_ids
          FROM payload.\${sql.raw(relationshipTableName)} 
          WHERE child_id = \${id.toString()}
        \`);
        
        if (result && result[0] && result[0].related_ids) {
          value = Array.isArray(result[0].related_ids) 
            ? result[0].related_ids 
            : [result[0].related_ids];
          
          success = true;
          method = 'direct_sql';
        }
      } catch (sqlError) {
        console.log('Direct SQL fallback failed:', sqlError);
        // Continue to next method
      }
    }
    
    // Method 3: Try static mappings if previous methods failed
    if (!success) {
      try {
        // Load static mapping file
        const mappingPath = path.join(
          process.cwd(), 
          'packages/content-migrations/src/data/mappings',
          \`\${collection.toString()}_\${field.toString()}.json\`
        );
        
        if (fs.existsSync(mappingPath)) {
          const mappings = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
          const docId = id.toString();
          
          if (mappings[docId]) {
            value = mappings[docId];
            success = true;
            method = 'static_mapping';
          }
        }
      } catch (mappingError) {
        console.log('Static mapping fallback failed:', mappingError);
        // This is the last method, so we're out of options
      }
    }
    
    // Log the result
    console.log(\`Fallback for \${collection}/\${id}/\${field}: \${method} -> \${success ? 'SUCCESS' : 'FAILED'}\`);
    
    // Return the result
    return res.status(200).json({
      success,
      value,
      method,
      request: {
        collection,
        id,
        field,
        relationTo,
      },
    });
  } catch (error) {
    console.error('Error in fallback relationships endpoint:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error in fallback system',
    });
  }
};
`;

    fs.writeFileSync(relationshipsEndpointPath, relationshipsEndpointContent);
    console.log(
      `Created relationships endpoint at ${relationshipsEndpointPath}`,
    );

    // Create a web app API endpoint for error logging
    const webApiDir = path.join(process.cwd(), 'apps/web/app/api/log-error');

    if (!fs.existsSync(webApiDir)) {
      fs.mkdirSync(webApiDir, { recursive: true });
    }

    const errorLogEndpointPath = path.join(webApiDir, 'route.ts');
    const errorLogEndpointContent = `
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@kit/shared/logger';

/**
 * API route to log frontend errors for fallback system monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();
    
    // Create logging context
    const ctx = {
      service: 'fallbacks',
      type: errorData.type || 'unknown',
      collection: errorData.collection || 'unknown',
      field: errorData.field || 'unknown',
      url: errorData.url || request.url || 'unknown',
    };
    
    // Log the error with standardized format
    logger.warn(
      ctx,
      \`Frontend fallback activated: \${errorData.message || 'No message provided'}\`,
      {
        stack: errorData.stack,
        componentStack: errorData.componentStack,
        fallbackMethod: errorData.fallbackMethod,
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the error itself
    logger.error(
      { service: 'fallbacks_api' },
      'Error logging frontend fallback',
      { error }
    );
    
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
`;

    fs.writeFileSync(errorLogEndpointPath, errorLogEndpointContent);
    console.log(`Created error logging endpoint at ${errorLogEndpointPath}`);

    return { success: true };
  } catch (error) {
    console.error('Error creating API endpoints:', error);
    return { success: false, error };
  }
}

// Run the function directly if executed as a script
if (require.main === module) {
  createApiEndpoints()
    .then((result) => {
      if (result.success) {
        console.log('Successfully created API endpoints for fallback system');
        process.exit(0);
      } else {
        console.error('Failed to create API endpoints:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}
