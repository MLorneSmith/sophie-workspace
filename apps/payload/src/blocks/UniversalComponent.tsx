'use client'

import React from 'react'
import CallToActionComponent from './CallToAction/Component'
import TestBlockComponent from './TestBlock/Component'
import DebugBlockComponent from './DebugBlock/Component'

type UniversalComponentProps = {
  blockType?: string
  blockName?: string
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
  [key: string]: any
}

/**
 * Universal component that handles block rendering
 * This component is mapped to "./Component#default" in the importMap
 * and serves as the main entry point for rendering blocks
 */
const UniversalComponent: React.FC<UniversalComponentProps> = (props) => {
  // Log detailed information for debugging
  console.log('UniversalComponent received props:', {
    blockType: props.blockType,
    blockName: props.blockName,
    fieldName: props.field?.name,
    path: props.path,
    schemaPath: props.schemaPath || props.SchemaPath,
    hasData: !!props.data,
    hasValue: !!props.value,
  })

  // Special handling for _components field which is part of the block input UI
  if (props.field && props.field.name === '_components') {
    console.log(
      'Found _components field in UniversalComponent - returning null to let Payload handle it',
    )
    // Always return null for _components field to let Payload handle it natively
    // This is critical for the input card to render properly
    return null
  }

  // Determine block type from various sources
  let blockType = props.blockType || ''

  // If blockType is not provided directly, try to extract it from other props
  if (!blockType) {
    // Try to get it from blockName
    if (props.blockName) {
      blockType = props.blockName
      console.log('Using blockName as blockType:', blockType)
    }
    // Try to extract from schema path if available
    else if (props.schemaPath || props.SchemaPath) {
      const schemaPath = props.schemaPath || props.SchemaPath || ''

      // Pattern 1: Exact format from logs
      const exactMatch = schemaPath.match(/blocks\.lexical_blocks\.([^.]+)\.fields/)
      if (exactMatch && exactMatch[1]) {
        blockType = exactMatch[1]
        console.log('Matched exact pattern from schemaPath:', blockType)
      }
      // Pattern 2: Simplified pattern
      else {
        const simpleMatch = schemaPath.match(/([^.]+)\.fields/)
        if (simpleMatch && simpleMatch[1]) {
          blockType = simpleMatch[1]
          console.log('Matched simplified pattern from schemaPath:', blockType)
        }
      }
    }
    // Try to get it from data
    else if (props.data && props.data.blockType) {
      blockType = props.data.blockType
      console.log('Using blockType from data:', blockType)
    }
    // Check for specific properties to infer block type
    else {
      if (props.headline !== undefined || (props.data && props.data.headline !== undefined)) {
        blockType = 'custom-call-to-action'
        console.log('Detected CallToAction from properties')
      } else if (props.text !== undefined || (props.data && props.data.text !== undefined)) {
        blockType = 'test-block'
        console.log('Detected TestBlock from properties')
      } else if (
        props.debugInfo !== undefined ||
        (props.data && props.data.debugInfo !== undefined)
      ) {
        blockType = 'debug-block'
        console.log('Detected DebugBlock from properties')
      }
    }
  }

  console.log('Final determined blockType:', blockType)

  // Normalize data to handle different prop structures
  const data = props.data || props.value || props

  // Render the appropriate component based on block type
  switch (blockType) {
    case 'custom-call-to-action':
      return <CallToActionComponent {...props} data={data} />
    case 'test-block':
      return <TestBlockComponent {...props} data={data} />
    case 'debug-block':
      return <DebugBlockComponent {...props} data={data} />
    default:
      // Debug fallback for unknown block types
      return (
        <div className="p-4 border-2 border-red-500 bg-red-50 rounded-md">
          <h3 className="text-lg font-bold text-red-700">
            Unknown Block Type: {blockType || 'undefined'}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-red-600">Available props:</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(Object.keys(props), null, 2)}
            </pre>
            <p className="mt-2 text-sm text-red-600">Schema Path:</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
              {props.schemaPath || props.SchemaPath || 'Not available'}
            </pre>
            <p className="mt-2 text-sm text-red-600">Data:</p>
            <pre className="mt-1 p-2 bg-white rounded text-xs overflow-auto max-h-40">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        </div>
      )
  }
}

export default UniversalComponent
