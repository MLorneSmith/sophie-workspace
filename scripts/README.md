# SlideHeroes Scripts

This directory contains utility scripts for the SlideHeroes application.

## Update Test User Progress

The `update-test-user-progress.ts` script is used to update the course progress for the <test2@slideheroes.com> user. It marks all lessons as complete except for lessons 702, 801, and 802.

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install
```

### Usage

```bash
# Run the script
npm run update-test-user
```

### What the Script Does

1. Gets the user ID for <test2@slideheroes.com>
2. Fetches all lessons for the "Decks for Decision Makers" course
3. Marks all lessons as complete except for lessons 702, 801, and 802
4. Updates the overall course progress

This script is useful for testing the certificate generation functionality, as it will trigger the certificate generation process when the course is marked as complete.
