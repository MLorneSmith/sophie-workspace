import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch'

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../../.env'),
})

/**
 * Initialize the REST API connection and authenticate
 */
export async function initPayloadRestAPI(options: {
  apiUrl?: string
  email?: string
  password?: string
}) {
  const PAYLOAD_API_URL = options.apiUrl || 'http://localhost:3020/api'
  const ADMIN_EMAIL = options.email || 'michael@slideheroes.com'
  const ADMIN_PASSWORD = options.password || 'aiesec1992'

  console.log('Testing Payload API connection...')

  // Test the API connection
  try {
    const testResponse = await fetch(`${PAYLOAD_API_URL}/surveys`)
    console.log(
      'API connection test:',
      testResponse.status === 200 ? 'Success' : `Failed (${testResponse.status})`,
    )

    if (testResponse.status !== 200) {
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
    throw new Error('Failed to connect to Payload API. Make sure Payload is running on port 3020.')
  }

  // Authenticate with Payload
  console.log('Authenticating with Payload...')
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
    const authToken = loginData.token
    console.log('Authentication successful')

    return {
      apiUrl: PAYLOAD_API_URL,
      authToken,
      async callAPI(endpoint: string, options: any = {}) {
        const response = await fetch(`${PAYLOAD_API_URL}/${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            'Content-Type': 'application/json',
            Authorization: `JWT ${authToken}`,
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API call failed: ${response.status} - ${errorText}`)
        }

        return response.json()
      },
    }
  } catch (error) {
    console.error('Authentication failed:', error)
    throw new Error('Failed to authenticate with Payload. Check your credentials.')
  }
}
