'use client'

import React from 'react'

type SpecialFieldHandlerProps = {
  field?: {
    name: string
    type: string
    admin: any
  }
  path?: string
  schemaPath?: string
  SchemaPath?: string
  data?: any
  value?: any
  onChange?: (value: any) => void
  [key: string]: any
}

/**
 * Special component that handles the _components field
 * This component is specifically designed to handle _components fields
 * and render appropriate UI for block input cards
 */
const SpecialFieldHandler: React.FC<SpecialFieldHandlerProps> = (props) => {
  // Log detailed information for debugging
  console.log('SpecialFieldHandler received props:', {
    fieldName: props.field?.name,
    path: props.path,
    schemaPath: props.schemaPath || props.SchemaPath,
    hasData: !!props.data,
    hasValue: !!props.value,
  })

  // For _components field, we need to extract the block type from the schema path
  // and render the appropriate Field component
  if (props.field?.name === '_components') {
    console.log('Found _components field - extracting block type from schema path')

    // Extract block type from schema path
    const schemaPath = props.schemaPath || props.SchemaPath || ''
    console.log('Schema path:', schemaPath)

    // Try to extract block type using different patterns
    let blockType = ''

    // Pattern 1: lexical_blocks.{blockType}.fields._components
    const blockMatch = schemaPath.match(/lexical_blocks\.([^.]+)\.fields/)
    if (blockMatch && blockMatch[1]) {
      blockType = blockMatch[1]
      console.log('Extracted block type from schema path:', blockType)
    }

    // If we couldn't extract the block type, default to test-block
    if (!blockType) {
      blockType = 'test-block'
      console.log('Using default block type:', blockType)
    }

    // Import the TestBlockField component
    const TestBlockField = React.lazy(() => import('./TestBlock/Field'))

    // Return the appropriate Field component based on the block type
    return (
      <React.Suspense fallback={<div>Loading field component...</div>}>
        <TestBlockField
          path={props.path || ''}
          name={props.field?.name || ''}
          value={props.value}
          onChange={props.onChange}
        />
      </React.Suspense>
    )
  }

  // For other fields, we can render our own UI or pass to appropriate field component
  console.log('SpecialFieldHandler handling non-_components field:', props.field?.name)

  // For simplicity, just return a debug message for non-_components fields
  return (
    <div className="p-2 border border-yellow-500 bg-yellow-50 rounded">
      <p className="text-sm text-yellow-700">Field: {props.field?.name}</p>
      <p className="text-sm text-yellow-700">Path: {props.path}</p>
    </div>
  )
}

export default SpecialFieldHandler
