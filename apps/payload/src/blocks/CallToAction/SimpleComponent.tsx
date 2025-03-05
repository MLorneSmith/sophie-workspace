'use client'

import React, { useEffect } from 'react'
import { Button } from '@kit/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@kit/ui/card'
import { cn } from '@kit/ui/utils'

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
    <div class="my-6 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="text-2xl font-semibold leading-none tracking-tight">${headline}</h3>
        <p class="text-muted-foreground">${subheadline}</p>
      </div>
      <div class="p-6 pt-0 flex flex-col sm:flex-row justify-end gap-4">
        <div class="relative">
          <div class="absolute -left-10 top-1/2 -translate-y-1/2">
            <img
              src="/images/doodle.png"
              alt="Doodle"
              class="w-8 h-auto transform -rotate-90"
            />
          </div>
          <a
            href="${leftButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            ${leftButtonLabel}
          </a>
        </div>
        <div class="relative">
          <a
            href="${rightButtonUrl}"
            class="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            ${rightButtonLabel}
          </a>
          <div class="absolute -right-10 top-1/2 -translate-y-1/2">
            <img src="/images/doodle.png" alt="Doodle" class="w-8 h-auto transform rotate-90" />
          </div>
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
    <Card className="my-6">
      <CardHeader>
        <CardTitle>{headline}</CardTitle>
        <CardDescription>{subheadline}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row justify-end gap-4">
        <div className="relative">
          <div className="absolute -left-10 top-1/2 -translate-y-1/2">
            <img
              src="/images/doodle.png"
              alt="Doodle"
              className="w-8 h-auto transform -rotate-90"
            />
          </div>
          <Button variant="default" asChild>
            <a href={leftButtonUrl}>{leftButtonLabel}</a>
          </Button>
        </div>
        <div className="relative">
          <Button variant="outline" asChild>
            <a href={rightButtonUrl}>{rightButtonLabel}</a>
          </Button>
          <div className="absolute -right-10 top-1/2 -translate-y-1/2">
            <img src="/images/doodle.png" alt="Doodle" className="w-8 h-auto transform rotate-90" />
          </div>
        </div>
      </CardContent>

      {/* Hidden div with HTML content for serialization */}
      <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </Card>
  )
}

// We don't need a static toHTML method since we're storing the HTML content in the data object

export default SimpleComponent
