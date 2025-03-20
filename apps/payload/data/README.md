# Payload CMS Data Directory

This directory contains data files that are loaded into Payload CMS using the data loader scripts.

## Directory Structure

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

## Purpose

This directory serves as a centralized location for all content that will be loaded into Payload CMS. By keeping the data files separate from the scripts, we can:

1. **Maintain Content Separately**: Content can be updated without modifying the scripts
2. **Version Control**: Track changes to content separately from code changes
3. **Collaboration**: Make it easier for content creators to work with the files
4. **Backup**: Easily backup and restore content

## Usage

The data in this directory is loaded into Payload CMS using the scripts in the `src/scripts` directory. The scripts are configured to use these paths by default:

```bash
# Load survey data
pnpm seed:survey

# Load course data
pnpm seed:course

# Load both survey and course data
pnpm seed:all
```

## Adding New Content

### Adding a New Survey

1. Create a new YAML file in the `surveys` directory
2. Follow the format of the existing survey files
3. Run `pnpm seed:survey path/to/your/new-survey.yaml` to load it

### Adding New Course Content

1. Add new lesson files to the `courses/lessons` directory
2. Add new quiz files to the `courses/quizzes` directory
3. Run `pnpm seed:course` to load the updated content

## Relationship Between Lessons and Quizzes

Quizzes are associated with lessons based on filename matching. For example, a lesson file named `structure.mdoc` will be associated with a quiz file named `structure-quiz.mdoc`.
