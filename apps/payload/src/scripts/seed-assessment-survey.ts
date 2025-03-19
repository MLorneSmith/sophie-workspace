import dotenv from 'dotenv'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'

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

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
})

// Log environment variables for debugging
console.log('Environment variables loaded')
console.log('DATABASE_URI:', process.env.DATABASE_URI ? 'Set' : 'Not set')
console.log('PAYLOAD_SECRET:', process.env.PAYLOAD_SECRET ? '[REDACTED]' : 'Not set')

// Path to the YAML file with survey questions
const YAML_FILE_PATH = path.resolve(__dirname, './self-assessment.yaml')

/**
 * Parse the YAML file with survey questions
 */
async function parseSurveyYaml() {
  try {
    console.log('Reading YAML file from:', YAML_FILE_PATH)
    const fileContent = fs.readFileSync(YAML_FILE_PATH, 'utf8')
    const parsedYaml = yaml.parse(fileContent)

    console.log('Successfully parsed YAML file')
    return parsedYaml
  } catch (error) {
    console.error('Error parsing YAML file:', error)
    throw error
  }
}

/**
 * Seed the database with a sample assessment survey using REST API
 * This approach avoids issues with Payload initialization
 */
async function seedAssessmentSurvey() {
  try {
    // Payload API URL - Payload runs on port 3020
    const PAYLOAD_API_URL = 'http://localhost:3020/api'

    // Admin credentials - these should be environment variables in production
    const ADMIN_EMAIL = 'michael@slideheroes.com'
    const ADMIN_PASSWORD = 'aiesec1992'

    console.log('Testing Payload API connection...')

    // Test the API connection with a collection endpoint
    try {
      // Try to access the surveys collection - this should exist
      const testResponse = await fetch(`${PAYLOAD_API_URL}/surveys`)
      console.log(
        'API connection test:',
        testResponse.status === 200 ? 'Success' : `Failed (${testResponse.status})`,
      )

      if (testResponse.status !== 200) {
        // If that fails, try another common endpoint
        const fallbackResponse = await fetch(`${PAYLOAD_API_URL}/version`)
        if (fallbackResponse.status === 200) {
          console.log('Fallback API connection test: Success')
        } else {
          console.log('API response:', await testResponse.text())
          throw new Error(`Failed to connect to Payload API: ${testResponse.status}`)
        }
      }
    } catch (error) {
      console.error('API connection test failed:', error)
      throw new Error(
        'Failed to connect to Payload API. Make sure Payload is running on port 3020.',
      )
    }

    // Authenticate with Payload
    console.log('Authenticating with Payload...')
    let authToken = ''
    try {
      const loginResponse = await fetch(`${PAYLOAD_API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        }),
      })

      if (!loginResponse.ok) {
        console.log('Login response:', await loginResponse.text())
        throw new Error(`Failed to authenticate: ${loginResponse.status}`)
      }

      const loginData = (await loginResponse.json()) as any
      authToken = loginData.token
      console.log('Authentication successful')
    } catch (error) {
      console.error('Authentication failed:', error)
      throw new Error('Failed to authenticate with Payload. Check your credentials.')
    }

    // Parse the YAML file
    console.log('Parsing YAML file...')
    const surveyYaml = await parseSurveyYaml()
    console.log('Survey title from YAML:', surveyYaml.title)
    console.log('Found', surveyYaml.questions.length, 'questions in YAML file')

    console.log('Checking if assessment survey already exists...')

    // Check if the survey already exists
    const checkResponse = await fetch(`${PAYLOAD_API_URL}/surveys?where[slug][equals]=assessment`, {
      headers: {
        Authorization: `JWT ${authToken}`,
      },
    })

    if (!checkResponse.ok) {
      throw new Error(`Failed to check for existing survey: ${await checkResponse.text()}`)
    }

    const checkData = (await checkResponse.json()) as any
    let survey

    if (checkData.docs && checkData.docs.length > 0) {
      // Survey already exists, use it
      survey = { doc: checkData.docs[0] }
      console.log('Using existing survey with ID:', survey.doc.id)

      // Check if startMessage is a string and needs to be updated
      if (typeof survey.doc.startMessage === 'string') {
        console.log('Updating existing survey startMessage to Lexical format...')

        // Create Lexical editor object from string
        const lexicalObject = {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Welcome to the Presentation Skills Assessment! This survey will help you evaluate your current skills and identify areas where you can improve. The assessment takes about 5-10 minutes to complete.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'For each question, select the option that best describes your current skill level or experience. Be honest in your responses to get the most accurate results.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        }

        // Update the survey with the Lexical editor object
        const updateStartMessageResponse = await fetch(
          `${PAYLOAD_API_URL}/surveys/${survey.doc.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `JWT ${authToken}`,
            },
            body: JSON.stringify({
              startMessage: lexicalObject,
            }),
          },
        )

        if (!updateStartMessageResponse.ok) {
          console.log('Failed to update startMessage:', await updateStartMessageResponse.text())
        } else {
          console.log('Successfully updated startMessage to Lexical format')
        }
      }
    } else {
      console.log('Creating new assessment survey...')

      // Create the survey using the REST API
      const surveyData = {
        title: surveyYaml.title || 'Presentation Skills Assessment',
        slug: 'assessment',
        description:
          'This assessment will help you identify your strengths and areas for improvement in presentation skills.',
        startMessage: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Welcome to the Presentation Skills Assessment! This survey will help you evaluate your current skills and identify areas where you can improve. The assessment takes about 5-10 minutes to complete.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'For each question, select the option that best describes your current skill level or experience. Be honest in your responses to get the most accurate results.',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        categories: [
          {
            name: 'Structure',
            key: 'structure',
            description: 'Skills related to organizing and structuring your presentations',
          },
          {
            name: 'Story',
            key: 'story',
            description: 'Skills related to storytelling and narrative in presentations',
          },
          {
            name: 'Substance',
            key: 'substance',
            description: 'Skills related to content and evidence in presentations',
          },
          {
            name: 'Style',
            key: 'style',
            description: 'Skills related to visual design and presentation style',
          },
          {
            name: 'Self-Confidence',
            key: 'self-confidence',
            description: 'Skills related to confidence and delivery in presentations',
          },
        ],
        status: 'published',
      }

      // Create the survey using the REST API with authentication
      const surveyResponse = await fetch(`${PAYLOAD_API_URL}/surveys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${authToken}`,
        },
        body: JSON.stringify(surveyData),
      })

      if (!surveyResponse.ok) {
        throw new Error(`Failed to create survey: ${await surveyResponse.text()}`)
      }

      survey = (await surveyResponse.json()) as any
      console.log('Survey created with ID:', survey.doc.id)
    }

    // Create the questions from the YAML file
    const questions = (surveyYaml as SurveyYaml).questions.map(
      (q: SurveyQuestion, index: number) => {
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
      },
    )

    console.log(`Prepared ${questions.length} questions for creation`)

    // Create each question and collect the IDs
    const createdQuestionIds = []
    for (const question of questions) {
      const questionResponse = await fetch(`${PAYLOAD_API_URL}/survey_questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${authToken}`,
        },
        body: JSON.stringify(question),
      })

      if (!questionResponse.ok) {
        throw new Error(`Failed to create question: ${await questionResponse.text()}`)
      }

      const questionData = (await questionResponse.json()) as any
      createdQuestionIds.push(questionData.doc.id)
      console.log(`Created question: ${questionData.doc.id}`)
    }

    // Update the survey with the question IDs
    const updateResponse = await fetch(`${PAYLOAD_API_URL}/surveys/${survey.doc.id as string}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${authToken}`,
      },
      body: JSON.stringify({
        questions: createdQuestionIds,
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`Failed to update survey: ${await updateResponse.text()}`)
    }

    console.log('Assessment survey seeded successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error seeding assessment survey:', error)
    process.exit(1)
  }
}

seedAssessmentSurvey()
