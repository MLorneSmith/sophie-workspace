# Survey System Implementation

This directory contains the implementation of the survey system for SlideHeroes. The system allows users to take
surveys, track their progress, and view their results.

## Architecture

The survey system is built using:

1. **Payload CMS** - For managing survey content (surveys, questions, options)
2. **Supabase** - For storing user responses and progress
3. **Next.js** - For the frontend UI

### Directory Structure

- `_lib/server/` - Server-side code including server actions
- `_components/` - Reusable React components
- `survey/` - Survey page and components
- `page.tsx` - Assessment introduction page

## Database Schema

### Payload CMS Collections

- `surveys` - Survey metadata, categories, and questions
- `survey_questions` - Individual questions with options
- `survey_responses` - User responses to surveys

### Supabase Tables

- `survey_responses` - Links between users and their Payload CMS responses
- `survey_progress` - Tracks user progress through surveys

## API Layer

The API layer is implemented in the `@kit/payload` package, which provides functions for:

- Fetching surveys and questions
- Creating and updating survey responses
- Tracking user progress

## Usage

### Running the Survey System

1. Start the Payload CMS server:

   ```bash
   cd apps/payload
   pnpm dev
   ```

2. Start the Next.js web app:

   ```bash
   cd apps/web
   pnpm dev
   ```

3. Access the survey at: <http://localhost:3000/home/assessment>

### Seeding Sample Data

To seed the database with a sample assessment survey:

1. Install dependencies:

   ```bash
   cd apps/payload
   pnpm install
   ```

2. Run the seed script:

   ```bash
   pnpm seed:assessment
   ```

## Authentication

The survey system uses Supabase authentication to identify users. Users must be logged in to take surveys and view
their results.

## Implementation Details

### Survey Flow

1. User visits the assessment introduction page
2. User starts the survey
3. User answers questions one by one
4. Progress is saved after each question
5. After completing all questions, user sees a summary of their results

### Data Flow

1. Survey content is fetched from Payload CMS
2. User responses are saved to both Payload CMS and Supabase
3. Progress is tracked in Supabase
4. Results are calculated and displayed to the user
