import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Register a custom loader for .scss files to prevent errors
// This is needed because Node.js ESM doesn't know how to handle .scss files
// @ts-ignore
import { register } from 'node:module'
try {
  // @ts-ignore
  register('ts-node/esm', import.meta.url)
} catch (error) {
  // Ignore errors if ts-node is not available
  console.log('Could not register ts-node/esm, continuing without it')
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fixImportMap() {
  console.log('========================================')
  console.log('Running fix-importmap script...')
  console.log('========================================')

  const importMapPath = path.resolve(__dirname, '../app/(payload)/admin/importMap.js')

  if (fs.existsSync(importMapPath)) {
    console.log('ImportMap file found at:', importMapPath)
    let importMapContent = fs.readFileSync(importMapPath, 'utf8')

    // Check for existing component mappings
    const hasUniversalComponent = importMapContent.includes('./blocks/UniversalComponent')
    const hasComponentDefault = importMapContent.includes('"./Component#default"')
    const hasDebugBlock = importMapContent.includes('./blocks/DebugBlock/Component')

    // Extract all the existing imports
    const importLines: string[] = []
    const exportLines: string[] = []
    let inExport = false

    // Split the file into lines and categorize them
    const lines = importMapContent.split('\n')
    for (const line of lines) {
      if (line.startsWith('export ')) {
        inExport = true
        exportLines.push(line)
      } else if (inExport) {
        exportLines.push(line)
      } else if (line.startsWith('import ')) {
        importLines.push(line)
      }
    }

    // Add our custom imports if they don't exist
    if (!hasUniversalComponent) {
      console.log('Adding UniversalComponent import...')
      importLines.push(
        `import { default as UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/UniversalComponent'`,
      )
    }

    if (!hasDebugBlock) {
      console.log('Adding DebugBlock import...')
      importLines.push(
        `import { default as DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Component'`,
      )
    }

    // Find the opening and closing braces of the importMap object
    const exportContent = exportLines.join('\n')
    const openBraceIndex = exportContent.indexOf('{')
    const closeBraceIndex = exportContent.lastIndexOf('}')

    if (openBraceIndex !== -1 && closeBraceIndex !== -1) {
      // Extract the existing mappings
      const mappingsContent = exportContent.substring(openBraceIndex + 1, closeBraceIndex).trim()
      const mappings = mappingsContent.split(',\n').filter((line) => line.trim() !== '')

      // Add our custom mappings if they don't exist
      if (!hasComponentDefault) {
        console.log('Adding "./Component#default" mapping...')
        mappings.unshift(
          `  "./Component#default": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864`,
        )
      }

      if (!hasDebugBlock) {
        console.log('Adding DebugBlock mapping...')
        mappings.unshift(
          `  "blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
        )
      }

      // Reconstruct the export section
      const newExportContent = 'export const importMap = {\n' + mappings.join(',\n') + '\n}'

      // Reconstruct the entire file
      importMapContent = importLines.join('\n') + '\n\n' + newExportContent

      // Write the modified importMap back to the file
      fs.writeFileSync(importMapPath, importMapContent, 'utf8')
      console.log('ImportMap file updated successfully')
    } else {
      console.error('Could not find importMap object braces')
    }
  } else {
    console.error('ImportMap file not found at:', importMapPath)
  }
}

// Run the function
fixImportMap().catch(console.error)
