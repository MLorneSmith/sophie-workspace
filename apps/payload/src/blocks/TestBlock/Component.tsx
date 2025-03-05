'use client'

import React, { useEffect } from 'react'

type TestBlockProps = {
  blockType: string
  blockName?: string
  text?: string
  htmlContent?: string // Add htmlContent property to store the HTML
  data?: Record<string, any> // Add data property for storing additional data
  html?: string // Add html property for compatibility
  toHTML?: () => string // Add toHTML method
}

// Function to generate HTML content
function generateHtmlContent(props: TestBlockProps): string {
  const { text = 'Test Block' } = props || {}

  return `
    <div class="my-6 p-6 bg-blue-100 rounded-lg">
      <div class="flex items-center">
        <img
          src="/images/doodle.png"
          alt="Doodle"
          class="w-8 h-auto transform -rotate-45 mr-4"
        />
        <h3 class="text-xl font-bold mb-2">Test Block</h3>
        <img
          src="/images/doodle.png"
          alt="Doodle"
          class="w-8 h-auto transform rotate-45 ml-4"
        />
      </div>
      <p class="text-gray-700">${text}</p>
    </div>
  `
}

export const Component: React.FC<{ data: TestBlockProps }> = ({ data }) => {
  const { text = 'Test Block' } = data || {}

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
    <div className="my-6 p-6 bg-blue-100 rounded-lg">
      <div className="flex items-center">
        <img
          src="/images/doodle.png"
          alt="Doodle"
          className="w-8 h-auto transform -rotate-45 mr-4"
        />
        <h3 className="text-xl font-bold mb-2">Test Block</h3>
        <img
          src="/images/doodle.png"
          alt="Doodle"
          className="w-8 h-auto transform rotate-45 ml-4"
        />
      </div>
      <p className="text-gray-700">{text}</p>

      {/* Hidden div with HTML content for serialization */}
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}

export default Component
