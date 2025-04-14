/**
 * Payload CMS Admin Customizations
 * This file adds client-side customizations to the Payload admin panel
 */

// Create a global fallback Lexical editor config
// This prevents the "Cannot destructure property 'config'" error
const addLexicalFallbackConfig = () => {
  if (typeof window !== 'undefined') {
    // Add this script to run after the page loads
    window.addEventListener('load', () => {
      console.log('Adding Lexical editor fallback config...')

      // Create a patched version of the Lexical initialization function
      const patchLexicalEditor = () => {
        // Look for the module that initializes Lexical editors
        const modules = Object.keys(window).filter((key) => key.includes('WEBPACK_IMPORTED_MODULE'))

        // Try to find the Lexical module
        for (const key of modules) {
          const module = (window as any)[key]
          if (module && typeof module.b === 'function') {
            // Found a potential match, create a wrapper
            const originalFn = module.b
            module.b = function (...args: any[]) {
              // Call the original function
              const result = originalFn.apply(this, args)

              // If the result is missing the config property, add it
              if (result && !result.config) {
                return {
                  ...result,
                  config: {
                    theme: {
                      text: {
                        bold: 'lexical-bold',
                        code: 'lexical-code',
                        italic: 'lexical-italic',
                        strikethrough: 'lexical-strikethrough',
                        subscript: 'lexical-subscript',
                        superscript: 'lexical-superscript',
                        underline: 'lexical-underline',
                        underlineStrikethrough: 'lexical-underlineStrikethrough',
                      },
                    },
                    namespace: 'lexical',
                  },
                }
              }

              return result
            }
            console.log('Successfully patched Lexical editor initialization')
            break
          }
        }
      }

      // Add a retry mechanism since modules might load after our code
      let attempts = 0
      const maxAttempts = 10

      const attemptPatch = () => {
        attempts++
        patchLexicalEditor()

        if (attempts < maxAttempts) {
          setTimeout(attemptPatch, 500) // Try again in 500ms
        }
      }

      // Start the patching process
      attemptPatch()
    })
  }
}

// Initialize customizations
const init = () => {
  addLexicalFallbackConfig()
}

export default init
