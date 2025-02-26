import React from 'react';

// Function to render Lexical content
export function PayloadContentRenderer({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null;
  }

  // For Lexical content, extract the text and render it
  // In a real implementation, you would use a proper Lexical renderer
  try {
    const lexicalContent = content as any;
    if (lexicalContent.root && lexicalContent.root.children) {
      return (
        <div className="payload-content">
          {lexicalContent.root.children.map((node: any, i: number) => {
            // Handle different node types
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
