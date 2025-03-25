import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function fixImportMap() {
  console.log('========================================')
  console.log('Running fix-importmap-simple script...')
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
    const importLines = []
    const exportLines = []
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
        // Filter out imports that reference non-existent files
        if (line.includes("from '../../../Component'")) {
          console.log('Skipping non-existent Component import:', line)
          continue
        }
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
      const mappings = mappingsContent.split(',\n').filter((line) => {
        // Filter out mappings that reference non-existent imports
        if (line.includes('default_67885e32f4cf5b4b663aab10cb808103')) {
          console.log('Skipping non-existent Component mapping:', line)
          return false
        }
        return line.trim() !== ''
      })

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
