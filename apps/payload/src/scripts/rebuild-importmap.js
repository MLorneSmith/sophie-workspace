import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function rebuildImportMap() {
  console.log('========================================')
  console.log('Running rebuild-importmap script...')
  console.log('This script completely rebuilds the importMap.js file from scratch')
  console.log('========================================')

  const importMapPath = path.resolve(__dirname, '../app/(payload)/admin/importMap.js')

  // Create a completely new importMap file with the correct mappings
  // This is the most reliable approach to avoid syntax errors

  // Define our custom imports
  const imports = [
    `import { RscEntryLexicalCell as RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'`,
    `import { RscEntryLexicalField as RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e } from '@payloadcms/richtext-lexical/rsc'`,
    `import { BlocksFeatureClient as BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'`,
    `import { InlineToolbarFeatureClient as InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'`,
    `import { HorizontalRuleFeatureClient as HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'`,
    `import { UploadFeatureClient as UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'`,
    `import { LinkFeatureClient as LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864 } from '@payloadcms/richtext-lexical/client'`,
    `import { default as SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/SpecialFieldHandler'`,
    `import { default as UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/UniversalComponent'`,
    `import { default as DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Component'`,
    `import { default as DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/DebugBlock/Field'`,
    `import { default as CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/CallToAction/Component'`,
    `import { default as CallToActionField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/CallToAction/Field'`,
    `import { default as TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/TestBlock/Component'`,
    `import { default as TestBlockField_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../blocks/TestBlock/Field'`,
    `import { default as Component_e70f5e05f09f93e00b997edb1ef0c864 } from '../../../Component'`,
  ]

  // Define our mappings - focused on the essential mappings needed
  const mappings = [
    // Core component mappings - this is the most important mapping for viewing saved content
    `  "./Component#default": Component_e70f5e05f09f93e00b997edb1ef0c864`,

    // Universal component mapping
    `  "blocks/UniversalComponent": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/UniversalComponent#default": UniversalComponent_e70f5e05f09f93e00b997edb1ef0c864`,

    // Block component mappings
    `  "blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/CallToAction/Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/TestBlock/Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,

    // Block component default mappings
    `  "blocks/CallToAction/Component#default": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/CallToAction/Field": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/CallToAction/Field#default": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/TestBlock/Component#default": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/TestBlock/Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/TestBlock/Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/DebugBlock/Component#default": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/DebugBlock/Field": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "blocks/DebugBlock/Field#default": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864`,

    // Block slug mappings
    `  "custom-call-to-action#Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "test-block#Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "debug-block#Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,

    // Absolute path mappings
    `  "/blocks/CallToAction/Component": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/CallToAction/Component#default": CallToActionComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/CallToAction/Field": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/CallToAction/Field#default": CallToActionField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/TestBlock/Component": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/TestBlock/Component#default": TestBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/TestBlock/Field": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/TestBlock/Field#default": TestBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/DebugBlock/Component": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/DebugBlock/Component#default": DebugBlockComponent_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/DebugBlock/Field": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "/blocks/DebugBlock/Field#default": DebugBlockField_e70f5e05f09f93e00b997edb1ef0c864`,

    // Special mappings for _components field
    `  "_components#Component": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "_components#default": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "Field": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "Field#default": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "./Field": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "./Field#default": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,

    // Schema path mappings based on the error messages
    `  "lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components#Component": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "lexical_internal_feature.blocks.lexical_blocks.test-block.fields._components#Component": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "lexical_internal_feature.blocks.lexical_blocks.debug-block.fields._components#Component": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "lexical_internal_feature.blocks.lexical_blocks.custom-call-to-action.fields._components#Field": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "lexical_internal_feature.blocks.lexical_blocks.test-block.fields._components#Field": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "lexical_internal_feature.blocks.lexical_blocks.debug-block.fields._components#Field": SpecialFieldHandler_e70f5e05f09f93e00b997edb1ef0c864`,

    // Standard Payload mappings
    `  "RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e`,
    `  "RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e`,
    `  "BlocksFeatureClient": BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,

    // Specific path mappings for Payload components
    `  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalCell": RscEntryLexicalCell_44fe37237e0ebf4470c9990d8cb7b07e`,
    `  "@payloadcms/richtext-lexical/rsc#RscEntryLexicalField": RscEntryLexicalField_44fe37237e0ebf4470c9990d8cb7b07e`,
    `  "@payloadcms/richtext-lexical/client#BlocksFeatureClient": BlocksFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "@payloadcms/richtext-lexical/client#InlineToolbarFeatureClient": InlineToolbarFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "@payloadcms/richtext-lexical/client#HorizontalRuleFeatureClient": HorizontalRuleFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "@payloadcms/richtext-lexical/client#UploadFeatureClient": UploadFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
    `  "@payloadcms/richtext-lexical/client#LinkFeatureClient": LinkFeatureClient_e70f5e05f09f93e00b997edb1ef0c864`,
  ]

  // Create the importMap content
  const importMapContent = `${imports.join('\n')}\n\nexport const importMap = {\n${mappings.join(',\n')}\n}`

  // Write the importMap file
  fs.writeFileSync(importMapPath, importMapContent, 'utf8')
  console.log('ImportMap file completely rebuilt from scratch')
  console.log('First 500 chars:', importMapContent.substring(0, 500))
}

// Run the function
rebuildImportMap().catch(console.error)
