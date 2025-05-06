'use client'

import React from 'react'
import RenderBlocks from './blocks/RenderBlocks'

/**
 * Root component that is mapped to "./Component#default" in the importMap
 * This component handles rendering blocks from the Lexical editor
 */
const Component: React.FC<any> = (props) => {
  // Log props for debugging
  console.log('Root Component received props:', props)

  // If this is a block, render it using RenderBlocks
  if (props.blockType) {
    return <RenderBlocks blocks={[props]} />
  }

  // If this is a collection of blocks, render them all
  if (props.blocks && Array.isArray(props.blocks)) {
    return <RenderBlocks blocks={props.blocks} />
  }

  // Fallback for unknown content
  return (
    <div className="p-4 border-2 border-yellow-500 bg-yellow-50 rounded-md">
      <h3 className="text-lg font-bold text-yellow-700">Unknown Content Structure</h3>
      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-40">
        {JSON.stringify(props, null, 2)}
      </pre>
    </div>
  )
}

export default Component
