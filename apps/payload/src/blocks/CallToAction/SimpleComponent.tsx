'use client'

import React, { useEffect } from 'react'

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
  htmlContent?: string // Add htmlContent property to store the HTML
  data?: Record<string, any> // Add data property for storing additional data
  html?: string // Add html property for compatibility
  toHTML?: () => string // Add toHTML method
}

// Function to generate HTML content
function generateHtmlContent(props: CallToActionProps): string {
  const {
    headline = 'FREE Course Trial',
    subheadline = 'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
    leftButtonLabel = 'Individuals',
    leftButtonUrl = '/free-trial/individual',
    rightButtonLabel = 'Teams',
    rightButtonUrl = '/free-trial/teams',
  } = props || {}

  return `
    <div class="my-6 p-6 bg-gray-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
      <div class="flex-1">
        <h3 class="text-xl font-bold mb-2">${headline}</h3>
        <p class="text-gray-700">${subheadline}</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative">
          <img
            src="/images/doodle.png"
            alt="Doodle"
            class="absolute -left-10 top-1/2 -translate-y-1/2 w-8 h-auto transform -rotate-90"
          />
          <a
            href="${leftButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            ${leftButtonLabel}
          </a>
        </div>
        <div class="relative">
          <a
            href="${rightButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            ${rightButtonLabel}
          </a>
          <img
            src="/images/doodle.png"
            alt="Doodle"
            class="absolute -right-10 top-1/2 -translate-y-1/2 w-8 h-auto transform rotate-90"
          />
        </div>
      </div>
    </div>
  `
}

export const SimpleComponent: React.FC<{ data: CallToActionProps }> = ({ data }) => {
  const {
    headline = 'FREE Course Trial',
    subheadline = 'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
    leftButtonLabel = 'Individuals',
    leftButtonUrl = '/free-trial/individual',
    rightButtonLabel = 'Teams',
    rightButtonUrl = '/free-trial/teams',
  } = data || {}

  // Generate HTML content
  const htmlContent = generateHtmlContent(data)

  // Store the HTML content directly in the node data
  useEffect(() => {
    if (data) {
      // Store HTML content in multiple locations for better compatibility
      data.htmlContent = htmlContent
      data.html = htmlContent

      // Also store it in data.data for better compatibility
      if (!data.data) {
        data.data = {}
      }
      data.data.htmlContent = htmlContent
      data.data.html = htmlContent

      // Add a toHTML method to the data object
      if (typeof data.toHTML !== 'function') {
        data.toHTML = () => htmlContent
      }

      // Log for debugging
      console.log('Stored HTML content in data:', {
        htmlContent: data.htmlContent?.substring(0, 50) + '...',
        dataHtmlContent: data.data?.htmlContent?.substring(0, 50) + '...',
      })
    }
  }, [data, htmlContent])

  return (
    <div className="my-6 p-6 bg-gray-100 rounded-lg flex flex-col md:flex-row justify-between items-center gap-6">
      {/* Text content on the left */}
      <div className="flex-1">
        <h3 className="text-xl font-bold mb-2">{headline}</h3>
        <p className="text-gray-700">{subheadline}</p>
      </div>

      {/* Buttons on the right */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Left button with doodle */}
        <div className="relative">
          <div className="absolute -left-10 top-1/2 -translate-y-1/2">
            <img
              src="/images/doodle.png"
              alt="Doodle"
              className="w-8 h-auto transform -rotate-90"
            />
          </div>
          <a
            href={leftButtonUrl}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
          >
            {leftButtonLabel}
          </a>
        </div>

        {/* Right button with doodle */}
        <div className="relative">
          <a
            href={rightButtonUrl}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          >
            {rightButtonLabel}
          </a>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2">
            <img src="/images/doodle.png" alt="Doodle" className="w-8 h-auto transform rotate-90" />
          </div>
        </div>
      </div>

      {/* Hidden div with HTML content for serialization */}
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}

// We don't need a static toHTML method since we're storing the HTML content in the data object

export default SimpleComponent
