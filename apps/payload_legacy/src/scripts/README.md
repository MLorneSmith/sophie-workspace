# Payload CMS Data Loaders

This directory contains scripts for loading data into Payload CMS, specifically for the survey system and course system.

## Overview

The scripts provide a unified approach for loading both survey data from YAML files and course data from Markdoc files into Payload CMS. The implementation uses the Payload REST API for both systems, ensuring consistency and reliability.

## Directory Structure

### Scripts Directory

```
scripts/
├── lib/                      # Shared utilities
│   ├── file-parser.ts        # File parsing utilities
│   ├── lexical-converter.ts  # Conversion to Lexical format
│   ├── logger.ts             # Logging utilities
│   ├── payload-api.ts        # Payload API client
│   └── types.ts              # Common type definitions
├── loaders/                  # Content loaders
│   ├── course-loader.ts      # Course data loader
│   └── survey-loader.ts      # Survey data loader
├── seed-all.ts               # Main script for loading all data
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

### Data Directory

We've created a common location for storing data files that will be loaded into Payload CMS:

```
data/
├── surveys/                  # Survey YAML files
│   └── self-assessment.yaml  # Self-assessment survey
└── courses/                  # Course data
    ├── lessons/              # Lesson Markdoc files
    │   ├── basic-graphs.mdoc
    │   ├── before-we-begin.mdoc
    │   └── ...
    └── quizzes/              # Quiz Markdoc files
        ├── basic-graphs-quiz.mdoc
        ├── elements-of-design-detail-quiz.mdoc
        └── ...
```

This structure provides a centralized location for all content that will be loaded into Payload CMS, making it easier to manage and update.

## Installation

The dependencies for these scripts are included in the main Payload app's package.json. To install them:

```bash
cd apps/payload
pnpm install
```

## Usage

The scripts can be used to load survey data, course data, or both. They are available as npm scripts in the main package.json:

### Building the Scripts

```bash
pnpm seed:build
```

### Loading Survey Data

```bash
# Using default path (data/surveys/self-assessment.yaml)
pnpm seed:survey

# Using custom path
pnpm seed:survey path/to/survey.yaml
```

### Loading Course Data

```bash
# Using default paths (data/courses/lessons and data/courses/quizzes)
pnpm seed:course

# Using custom paths
pnpm seed:course path/to/lessons path/to/quizzes
```

### Loading Both Survey and Course Data

```bash
# Using default paths
pnpm seed:all

# Using custom paths
pnpm seed:all path/to/survey.yaml path/to/lessons path/to/quizzes
```

### Options

- `-v, --verbose`: Enable verbose logging
- `-q, --quiet`: Suppress all but error logs
- `-u, --url <url>`: Payload API URL (default: http://localhost:3020/api)
- `-e, --email <email>`: Admin email (default: michael@slideheroes.com)
- `-p, --password <password>`: Admin password (default: aiesec1992)

## Data Formats

### Survey Data

Survey data should be in YAML format with the following structure:

```yaml
title: Survey Title
questions:
  - question: Question text
    answers:
      - answer: Answer option 1
      - answer: Answer option 2
    questioncategory: category
    questionspin: positive
status: published
language: en
```

### Course Data

Course data consists of lessons and quizzes in Markdoc format:

#### Lesson Format

```markdown
---
title: Lesson Title
status: published
description: Lesson description
lessonID: 1
chapter: chapter-name
lessonNumber: 1
lessonLength: 10
image: /path/to/image.png
publishedAt: 2024-01-01
language: en
order: 1
---

Lesson content here...
```

#### Quiz Format

```markdown
---
title: Quiz Title
questions:
  - question: Question text
    answers:
      - answer: Answer option 1
        correct: true
      - answer: Answer option 2
        correct: false
    questiontype: single-answer
status: published
publishedAt: 2024-01-01
language: en
order: 1
---
```

## Implementation Details

### Common Infrastructure

The scripts share common infrastructure for:

- Authentication with Payload CMS
- Error handling and logging
- Progress reporting
- File parsing
- Content conversion to Lexical format

### Survey Loader

The survey loader:

1. Parses the YAML file
2. Creates or updates the survey in Payload CMS
3. Creates the questions
4. Updates the survey with the question IDs

### Course Loader

The course loader:

1. Parses the Markdoc files for lessons and quizzes
2. Creates or updates the course in Payload CMS
3. Creates the quizzes
4. Creates the lessons with references to quizzes
5. Updates the course with the lesson IDs

## Extending the Scripts

To add support for additional content types:

1. Create a new loader in the `loaders` directory
2. Add the necessary type definitions in `types.ts`
3. Add a new command to `seed-all.ts`
