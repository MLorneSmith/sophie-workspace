'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

// Define the type for our component props
type CallToActionProps = {
  blockType: string
  blockName?: string
  headline?: string
  subheadline?: string
  leftButtonLabel?: string
  leftButtonUrl?: string
  rightButtonLabel?: string
  rightButtonUrl?: string
}

export const Component: React.FC<{ data: CallToActionProps }> = ({ data }) => {
  const {
    headline,
    subheadline,
    leftButtonLabel,
    leftButtonUrl,
    rightButtonLabel,
    rightButtonUrl,
  } = data || {}

  return (
    <div className="my-6 p-6 bg-gray-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
      {/* Text content on the left */}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2">{headline}</h3>
        <p className="text-gray-700">{subheadline}</p>
      </div>

      {/* Buttons on the right */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left button with left doodle */}
        <div className="relative">
          <img
            src="/images/doodle.png"
            alt="Doodle"
            className="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-auto transform -rotate-90"
          />
          <Button asChild>
            <a href={leftButtonUrl}>{leftButtonLabel}</a>
          </Button>
        </div>

        {/* Right button with right doodle */}
        <div className="relative">
          <Button asChild variant="outline">
            <a href={rightButtonUrl}>{rightButtonLabel}</a>
          </Button>
          <img
            src="/images/doodle.png"
            alt="Doodle"
            className="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-auto transform rotate-90"
          />
        </div>
      </div>
    </div>
  )
}

export default Component
