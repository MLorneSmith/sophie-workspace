import React from 'react';

// Helper function to find HTML content in various locations
function findHtmlContent(node: any): string | null {
  // Check all possible locations where HTML content might be stored
  if (node.htmlContent) return node.htmlContent;
  if (node.html) return node.html;
  if (node.data?.htmlContent) return node.data.htmlContent;
  if (node.data?.html) return node.data.html;
  if (typeof node.toHTML === 'function') return node.toHTML();
  if (node.fields?.htmlContent) return node.fields.htmlContent;
  if (node.fields?.html) return node.fields.html;
  
  return null;
}

// Function to render Lexical content
export function PayloadContentRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null;
  }

  // For Lexical content, extract the text and render it
  try {
    const lexicalContent = content as any;
    if (lexicalContent.root && lexicalContent.root.children) {
      return (
        <div className="payload-content">
          {lexicalContent.root.children.map((node: any, i: number) => {
            // Handle custom blocks
            // Check for Call To Action block
            if (
              node.type === 'custom-call-to-action' ||
              (node.fields && node.fields.blockType === 'custom-call-to-action') ||
              node.blockType === 'custom-call-to-action'
            ) {
              console.log('Found Call To Action block:', node);
              
              // Try to extract the HTML content from various locations
              let htmlContent = findHtmlContent(node);
              
              if (htmlContent) {
                console.log(
                  'Using HTML content for Call To Action:',
                  htmlContent.substring(0, 100) + '...',
                );
                return (
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                );
              }
            }
            
            // Check for Test Block
            if (
              node.type === 'test-block' ||
              (node.fields && node.fields.blockType === 'test-block') ||
              node.blockType === 'test-block'
            ) {
              console.log('Found Test Block:', node);
              
              // Try to extract the HTML content from various locations
              let htmlContent = findHtmlContent(node);
              
              if (htmlContent) {
                console.log(
                  'Using HTML content for Test Block:',
                  htmlContent.substring(0, 100) + '...',
                );
                return (
                  <div
                    key={i}
                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                  />
                );
              }
            }

            // Handle standard node types
            if (node.type === 'paragraph') {
              return (
                <p key={i}>
                  {node.children.map((textNode: any, j: number) => (
                    <span key={j}>{textNode.text}</span>
                  ))}
                </p>
              );
            }

            if (node.type === 'heading') {
              // Use a switch statement to handle different heading levels
              const tag = node.tag || 'h2'; // Default to h2 if tag is not specified

              switch (tag) {
                case 'h1':
                  return (
                    <h1 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h1>
                  );
                case 'h2':
                  return (
                    <h2 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h2>
                  );
                case 'h3':
                  return (
                    <h3 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h3>
                  );
                case 'h4':
                  return (
                    <h4 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h4>
                  );
                case 'h5':
                  return (
                    <h5 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h5>
                  );
                case 'h6':
                  return (
                    <h6 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h6>
                  );
                default:
                  return (
                    <h2 key={i}>
                      {node.children.map((textNode: any, j: number) => (
                        <span key={j}>{textNode.text}</span>
                      ))}
                    </h2>
                  );
              }
            }

            // For any unhandled node types, log them for debugging
            console.log('Unhandled node type:', node.type, node);
            return null;
          })}
        </div>
      );
    }
  } catch (error) {
    console.error('Error rendering Lexical content:', error);
  }

  // Fallback for non-Lexical content
  return <div dangerouslySetInnerHTML={{ __html: String(content) }} />;
}
