import path from 'path'
import { fileURLToPath } from 'url'

import { parseYamlFile } from '../lib/file-parser'
import type { PayloadResponse } from '../lib/types'
import { textToLexical } from '../lib/lexical-converter'
import { logger } from '../lib/logger'
import { initPayloadRestAPI } from '../lib/payload-api'

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define types for the YAML data structure
interface SurveyAnswer {
  answer: string
}

interface SurveyQuestion {
  question: string
  answers: SurveyAnswer[]
  questioncategory: string
  questionspin: string
}

interface SurveyYaml {
  title: string
  questions: SurveyQuestion[]
  status: string
  language: string
}

/**
 * Load survey data from a YAML file into Payload CMS
 */
export async function loadSurveyFromYaml(options: {
  yamlFilePath: string
  apiUrl?: string
  email?: string
  password?: string
}) {
  const { yamlFilePath, apiUrl, email, password } = options

  logger.section('Loading Survey from YAML')
  logger.info(`YAML file path: ${yamlFilePath}`)

  try {
    // Parse the YAML file
    logger.info('Parsing YAML file...')
    const surveyYaml = parseYamlFile(yamlFilePath) as SurveyYaml
    logger.info(`Survey title: ${surveyYaml.title}`)
    logger.info(`Found ${surveyYaml.questions.length} questions`)

    // Initialize the Payload REST API
    const api = await initPayloadRestAPI({ apiUrl, email, password })

    // Check if the survey already exists
    logger.info('Checking if survey already exists...')
    const slug = createSlugFromTitle(surveyYaml.title)
    const checkResponse = (await api.callAPI(
      `surveys?where[slug][equals]=${slug}`,
    )) as PayloadResponse

    let survey
    if (checkResponse.docs && checkResponse.docs.length > 0) {
      // Survey already exists, use it
      survey = { doc: checkResponse.docs[0] }
      logger.info(`Using existing survey with ID: ${survey.doc.id}`)

      // Check if startMessage is a string and needs to be updated
      if (typeof survey.doc.startMessage === 'string') {
        logger.info('Updating existing survey startMessage to Lexical format...')

        // Create Lexical editor object from string
        const lexicalObject = textToLexical(
          'Welcome to the survey! This will help you evaluate your current skills and identify areas where you can improve.',
        )

        // Update the survey with the Lexical editor object
        const updateStartMessageResponse = await api.callAPI(`surveys/${survey.doc.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            startMessage: lexicalObject,
          }),
        })

        logger.success('Successfully updated startMessage to Lexical format')
      }
    } else {
      logger.info('Creating new survey...')

      // Create the survey using the REST API
      const surveyData = {
        title: surveyYaml.title,
        slug,
        description: `${surveyYaml.title} survey`,
        startMessage: textToLexical(
          'Welcome to the survey! This will help you evaluate your current skills and identify areas where you can improve.',
        ),
        status: surveyYaml.status || 'published',
      }

      // Create the survey
      const surveyResponse = (await api.callAPI('surveys', {
        method: 'POST',
        body: JSON.stringify(surveyData),
      })) as PayloadResponse

      survey = surveyResponse
      logger.success(`Survey created with ID: ${survey.doc.id}`)
    }

    // Create the questions from the YAML file
    const questions = surveyYaml.questions.map((q: SurveyQuestion, index: number) => {
      // Map the YAML question to the Payload question format
      return {
        text: q.question,
        description: '', // No description in the YAML
        category: q.questioncategory.toLowerCase(),
        type: 'multiple_choice',
        required: true,
        questionspin: q.questionspin.charAt(0).toUpperCase() + q.questionspin.slice(1),
        options: q.answers.map((a: SurveyAnswer) => ({ option: a.answer })),
        position: index,
      }
    })

    logger.info(`Prepared ${questions.length} questions for creation`)

    // Create each question and collect the IDs
    const createdQuestionIds = []
    for (const question of questions) {
      const questionResponse = (await api.callAPI('survey_questions', {
        method: 'POST',
        body: JSON.stringify(question),
      })) as PayloadResponse

      createdQuestionIds.push(questionResponse.doc.id)
      logger.debug(`Created question: ${questionResponse.doc.id}`)
    }

    // Update the survey with the question IDs
    const updateResponse = await api.callAPI(`surveys/${survey.doc.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        questions: createdQuestionIds,
      }),
    })

    logger.success('Survey loaded successfully!')
    return { success: true, surveyId: survey.doc.id }
  } catch (error) {
    logger.error('Error loading survey:', error)
    return { success: false, error }
  }
}

/**
 * Create a slug from a title
 */
function createSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
}

/**
 * Main function to load a survey from a YAML file
 */
export async function loadSurvey(yamlFilePath: string) {
  const absolutePath = path.resolve(yamlFilePath)
  return loadSurveyFromYaml({ yamlFilePath: absolutePath })
}
