'use client'

import React from 'react'
import UniversalComponent from './blocks/UniversalComponent'

/**
 * Root component that is mapped to "./Component#default" in the importMap
 * This is the entry point for all block components when viewing saved content
 */
const Component: React.FC<any> = (props) => {
  console.log('Root Component received props:', {
    hasBlockType: !!props.blockType,
    hasBlockName: !!props.blockName,
    hasField: !!props.field,
    hasData: !!props.data,
    hasValue: !!props.value,
  })

  return <UniversalComponent {...props} />
}

export default Component
