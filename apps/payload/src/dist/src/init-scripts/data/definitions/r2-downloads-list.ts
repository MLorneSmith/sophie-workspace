/**
 * This file is a Single Source of Truth for the list of files in the 'downloads' R2 bucket.
 * It should be populated with the complete list of objects obtained from the Cloudflare R2 API.
 */

export const R2_DOWNLOADS_LIST: {
  key: string;
  size: number;
  contentType: string;
}[] = [
  {
    key: '201 Our Process.pdf',
    size: 215163,
    contentType: 'application/pdf',
  },
  {
    key: '202 The Who.pdf',
    size: 280203,
    contentType: 'application/pdf',
  },
  {
    key: '203 The Why - Introductions.pdf',
    size: 311899,
    contentType: 'application/pdf',
  },
  {
    key: '204 The Why - Next Steps.pdf',
    size: 285794,
    contentType: 'application/pdf',
  },
  {
    key: '301 Idea Generation.pdf',
    size: 1593877,
    contentType: 'application/pdf',
  },
  {
    key: '302 What is Structure.pdf',
    size: 480516,
    contentType: 'application/pdf',
  },
  {
    key: '401 Using Stories.pdf',
    size: 843451,
    contentType: 'application/pdf',
  },
  {
    key: '403 Storyboards in Presentations.pdf',
    size: 230137,
    contentType: 'application/pdf',
  },
  {
    key: '501 Visual Perception.pdf',
    size: 311914,
    contentType: 'application/pdf',
  },
  {
    key: '503 Detail Fundamental Elements.pdf',
    size: 1705024,
    contentType: 'application/pdf',
  },
  {
    key: '504 Gestalt Principles of Visual Perception.pdf',
    size: 212835,
    contentType: 'application/pdf',
  },
  {
    key: '505 Slide Composition.pdf',
    size: 1111516,
    contentType: 'application/pdf',
  },
  {
    key: '601 Fact-based Persuasion Overview.pdf',
    size: 760476,
    contentType: 'application/pdf',
  },
  {
    key: '602 Tables v Graphs.pdf',
    size: 323336,
    contentType: 'application/pdf',
  },
  {
    key: '604 Standard Graphs.pdf',
    size: 794342,
    contentType: 'application/pdf',
  },
  {
    key: '605 Specialist Graphs.pdf',
    size: 594734,
    contentType: 'application/pdf',
  },
  {
    key: '701 Preparation and Practice.pdf',
    size: 438485,
    contentType: 'application/pdf',
  },
  {
    key: '702 Performance.pdf',
    size: 245125,
    contentType: 'application/pdf',
  },
  {
    key: 'Audience Map.pdf',
    size: 169009,
    contentType: 'application/pdf',
  },
  {
    key: 'SlideHeroes Golden Rules.pdf',
    size: 325858,
    contentType: 'application/pdf',
  },
  {
    key: 'SlideHeroes Presentation Template.zip',
    size: 325858,
    contentType: 'application/zip',
  },
  {
    key: 'SlideHeroes Swipe File.zip',
    size: 325858,
    contentType: 'application/zip',
  },
];

// Example format for an object in the array:
// {
//   key: "your-file-name.pdf",
//   size: 12345, // size in bytes
//   contentType: "application/pdf", // MIME type
// }
