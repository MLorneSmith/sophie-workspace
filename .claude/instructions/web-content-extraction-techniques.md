# Web Content Extraction Techniques

This document outlines techniques for extracting content from large web pages, particularly documentation sites, when standard methods like fetch MCP server's HTML and markdown commands return responses that are too large to process.

## Problem Statement

When trying to read content from URLs like `https://makerkit.dev/docs/next-supabase-turbo/recipes/onboarding-checkout`, standard fetch operations may return responses that are too large, overwhelming the API limits. This document presents alternative approaches to extract only the relevant content in manageable chunks.

## Selective Content Extraction Approach

This approach focuses on extracting only specific, relevant parts of a webpage rather than the entire content. It's particularly effective for documentation sites where we're often only interested in the main content area and not the navigation, sidebars, footers, etc.

### Benefits

1. **Reduced Response Size**: By extracting only essential content, the response size is significantly reduced
2. **Structured Data**: Returns content in a structured format (JSON) for easier processing
3. **Content Categorization**: Automatically categorizes content by type (headings, code, paragraphs, etc.)
4. **Focused Information**: Eliminates noise and extracts only what's relevant to your needs
5. **Adaptable**: Can be customized to extract different types of content based on requirements

### Implementation Steps

#### 1. Launch Browser and Navigate to URL

```javascript
<browser_action>
  <action>launch</action>
  <url>
    https://makerkit.dev/docs/next-supabase-turbo/recipes/onboarding-checkout
  </url>
</browser_action>
```

#### 2. Analyze Page Structure

Identify the key elements that contain the valuable content:

```javascript
<browser_action>
<action>type</action>
<text>
// Log the structure to help identify key elements
console.log('Page Structure Analysis:');
console.log('------------------------');

// Check for common documentation content containers
const possibleContentContainers = [
  '.docs-content',
  '.markdown-body',
  '.article-content',
  'main article',
  '.content-container',
  '.documentation',
  '[role="main"]'
];

// Log which selectors exist on the page
possibleContentContainers.forEach(selector => {
  const element = document.querySelector(selector);
  console.log(`${selector}: ${element ? 'Found' : 'Not found'}`);
  if (element) {
    console.log(`  Children: ${element.children.length}`);
    console.log(`  Text length: ${element.innerText.length} characters`);
  }
});
</text>
</browser_action>
```

#### 3. Extract Only Essential Content

Based on the analysis, extract only the main content area:

```javascript
<browser_action>
<action>type</action>
<text>
// Based on our analysis, extract the main content
// (We'll use a selector that matches the actual page structure)
const mainContentSelector = '.docs-content'; // Adjust based on actual page

const mainContent = document.querySelector(mainContentSelector);

if (mainContent) {
  // Extract only the essential information
  const extractedData = {
    title: document.title,
    headings: Array.from(mainContent.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
      level: parseInt(h.tagName.substring(1)),
      text: h.innerText.trim()
    })),
    codeBlocks: Array.from(mainContent.querySelectorAll('pre code')).map(code => code.innerText),
    paragraphs: Array.from(mainContent.querySelectorAll('p')).map(p => p.innerText.trim()),
    lists: Array.from(mainContent.querySelectorAll('ul, ol')).map(list => ({
      type: list.tagName.toLowerCase(),
      items: Array.from(list.querySelectorAll('li')).map(li => li.innerText.trim())
    }))
  };

  console.log('EXTRACTED_CONTENT_START');
  console.log(JSON.stringify(extractedData, null, 2));
  console.log('EXTRACTED_CONTENT_END');
} else {
  console.log('Could not find main content container');
}
</text>
</browser_action>
```

#### 4. Extract Specific Content Types (Optional)

For targeted extraction of specific content types:

```javascript
<browser_action>
<action>type</action>
<text>
// Extract only code examples
const codeBlocks = document.querySelectorAll('pre code');
if (codeBlocks.length > 0) {
  console.log('CODE_EXAMPLES_START');
  codeBlocks.forEach((block, index) => {
    // Try to find a preceding heading or comment to identify the code
    let label = 'Code Example';
    let prevEl = block.parentElement;
    while (prevEl && !label.match(/h[1-6]/i)) {
      prevEl = prevEl.previousElementSibling;
      if (prevEl && prevEl.tagName.match(/H[1-6]/)) {
        label = prevEl.innerText;
        break;
      }
    }

    console.log(`--- ${label} (${index + 1}) ---`);
    console.log(block.innerText);
    console.log('\n');
  });
  console.log('CODE_EXAMPLES_END');
} else {
  console.log('No code examples found');
}
</text>
</browser_action>
```

#### 5. Close Browser

```javascript
<browser_action>
  <action>close</action>
</browser_action>
```

## Alternative Approach: Chunked Reading

For extremely large pages, you can combine selective extraction with chunking to process the content in smaller pieces.

### Implementation Steps

#### 1. Launch Browser and Navigate to URL

Same as in the selective extraction approach.

#### 2. Extract Content by Sections

```javascript
<browser_action>
<action>type</action>
<text>
// Extract content by sections (e.g., headings)
const headings = document.querySelectorAll('h1, h2, h3');
headings.forEach((heading, index) => {
  console.log(`SECTION_${index}_START: ${heading.innerText}`);

  // Get all elements until the next heading
  let content = [];
  let nextElement = heading.nextElementSibling;

  while (nextElement && !['H1', 'H2', 'H3'].includes(nextElement.tagName)) {
    content.push(nextElement.innerText);
    nextElement = nextElement.nextElementSibling;
  }

  console.log(content.join('\n'));
  console.log(`SECTION_${index}_END`);
});
</text>
</browser_action>
```

## Site-Specific Adaptations

Different documentation sites use different structures. Here are some common patterns:

### Makerkit Documentation

```javascript
// Makerkit-specific selectors
const mainContent =
  document.querySelector('.docs-content') ||
  document.querySelector('.prose') ||
  document.querySelector('main');
```

### GitHub Documentation

```javascript
// GitHub-specific selectors
const mainContent = document.querySelector('.markdown-body');
```

### General Documentation Sites

```javascript
// Try multiple common selectors
const mainContent =
  document.querySelector('.docs-content') ||
  document.querySelector('.markdown-body') ||
  document.querySelector('article') ||
  document.querySelector('main') ||
  document.querySelector('.content');
```

## Error Handling and Fallbacks

Always include error handling to gracefully manage unexpected page structures:

```javascript
<browser_action>
<action>type</action>
<text>
try {
  // Primary extraction method
  const mainContent = document.querySelector('.docs-content');

  if (mainContent) {
    // Extract content as shown above
  } else {
    // Fallback to a more generic approach
    console.log('Primary selector not found, trying fallbacks...');

    // Try alternative selectors
    const fallbackContent = document.querySelector('article') ||
                           document.querySelector('main') ||
                           document.querySelector('.content');

    if (fallbackContent) {
      console.log('Found fallback content container');
      // Extract from fallback
    } else {
      // Last resort: extract from body, but be more selective
      console.log('No content containers found, extracting key elements from body');

      // Extract headings, code blocks, and paragraphs directly
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const codeBlocks = Array.from(document.querySelectorAll('pre code'));
      const paragraphs = Array.from(document.querySelectorAll('p'));

      // Log extracted content
      console.log(`Found ${headings.length} headings, ${codeBlocks.length} code blocks, and ${paragraphs.length} paragraphs`);
    }
  }
} catch (error) {
  console.error('Error during extraction:', error.message);
}
</text>
</browser_action>
```

## Best Practices

1. **Analyze Before Extracting**: Always analyze the page structure first to identify the most appropriate selectors
2. **Start Specific, Fall Back to Generic**: Begin with specific selectors for the site, then fall back to more generic ones if needed
3. **Extract by Content Type**: Organize extraction by content type (headings, code, paragraphs) for better structure
4. **Include Context**: When extracting code examples, include surrounding context like headings
5. **Handle Errors Gracefully**: Always include error handling and fallbacks
6. **Limit Response Size**: Focus on extracting only what's needed to keep response sizes manageable
7. **Structure the Output**: Return data in a structured format (like JSON) for easier processing

## When to Use Each Approach

- **Selective Extraction**: Best for documentation pages where you need specific content types (code examples, headings, etc.)
- **Chunked Reading**: Best for extremely large pages that need to be processed in smaller pieces
- **Combined Approach**: For comprehensive documentation where you need both selective extraction and chunking

## Limitations

- Requires knowledge of the page structure (which can change over time)
- May need site-specific adaptations for optimal results
- Browser automation adds overhead compared to direct API calls
- Not suitable for high-volume extraction needs (consider a dedicated scraping solution for those cases)
