import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fixLexicalImportMap() {
  console.log('========================================')
  console.log('Running fix-lexical-importmap script...')
  console.log('========================================')

  const importMapPath = path.resolve(__dirname, '../app/(payload)/admin/importMap.js')

  if (fs.existsSync(importMapPath)) {
    console.log('ImportMap file found at:', importMapPath)

    // Create a completely new importMap file with the correct mappings
    // This is a more direct approach than trying to modify the existing file

    // First, read the existing file to extract the standard imports
    const existingContent = fs.readFileSync(importMapPath, 'utf8')

    // Extract all the existing imports for standard Lexical components
    const importLines = []
    const standardMappings = []

    // Extract standard imports and mappings
    const lines = existingContent.split('\n')
    let inExport = false

    for (const line of lines) {
      if (line.startsWith('export ')) {
        inExport = true
      } else if (
        !inExport &&
        line.startsWith('import ') &&
        !line.includes("from '../../../Component'") &&
        !line.includes("from '../../../blocks/")
      ) {
        // Keep standard imports but filter out our custom ones
        importLines.push(line)
      } else if (
        inExport &&
        line.includes(':') &&
        !line.includes('UniversalComponent') &&
        !line.includes('DebugBlockComponent') &&
        !line.includes('default_67885e32f4cf5b4b663aab10cb808103') &&
        !line.includes('"./Component#default"')
      ) {
        // Keep standard mappings but filter out our custom ones
        standardMappings.push(line)
      }
    }

    // Add our custom imports
    importLines.push(
      `import { default as UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/UniversalComponent'`,
    )
    importLines.push(
      `import { default as DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Component'`,
    )
    importLines.push(
      `import { default as CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/CallToAction/Component'`,
    )
    importLines.push(
      `import { default as TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/TestBlock/Component'`,
    )

    // Create our custom mappings - remove trailing commas to avoid syntax errors
    const customMappings = [
      `  "./Component#default": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "blocks/CallToAction/Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "blocks/TestBlock/Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,

      // Add specific Lexical editor mappings for input cards
      `  "lexical_blocks.custom-call-to-action.fields._components#Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "lexical_blocks.test-block.fields._components#Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "lexical_blocks.debug-block.fields._components#Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,

      // Add additional mappings for different path patterns
      `  "custom-call-to-action#Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "test-block#Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "debug-block#Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,

      // Add mappings for the block components themselves
      `  "blocks/CallToAction/Component#default": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "blocks/TestBlock/Component#default": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
      `  "blocks/DebugBlock/Component#default": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    ]

    // Combine all mappings
    const allMappings = [...customMappings, ...standardMappings]

    // Create the new importMap content - ensure proper comma handling
    // Join with commas between entries, but not after the last entry
    const mappingsString = allMappings.join(',\n')
    const newImportMapContent = `${importLines.join('\n')}\n\nexport const importMap = {\n${mappingsString}\n}`

    // Write the new importMap file
    fs.writeFileSync(importMapPath, newImportMapContent, 'utf8')
    console.log('ImportMap file completely rewritten with correct mappings')
  } else {
    console.error('ImportMap file not found at:', importMapPath)
  }
}

// Run the function
fixLexicalImportMap().catch(console.error)
