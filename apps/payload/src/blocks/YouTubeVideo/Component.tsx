'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../packages/ui/src/shadcn/card'

// Define the type for the component props
type YouTubeVideoData = {
  videoId?: string
  previewUrl?: string
  showPreview?: boolean
  title?: string
  aspectRatio?: string
  [key: string]: any
}

// Define our own component props type
type ComponentProps = {
  data?: YouTubeVideoData
  [key: string]: any
}

// Helper function to extract YouTube ID from URL or ID
const extractYouTubeId = (input: string): string => {
  // Return if input is empty
  if (!input) return ''

  // Regular expression to match YouTube video ID from various URL formats
  const regExp =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
  const match = input.match(regExp)

  if (match && match[1]) {
    // If it's a URL, return the extracted ID
    return match[1]
  }

  // If it's not a URL, assume it's already an ID (validate format if needed)
  return input
}

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
  // Destructure the important properties from props
  const { data } = props

  // Extract data with defaults if missing
  const {
    videoId = '',
    previewUrl = '',
    showPreview = false,
    title = 'YouTube Video',
    aspectRatio = '16:9',
  } = data || {}

  // Extract the YouTube video ID
  const youtubeId = extractYouTubeId(videoId)

  // Calculate padding based on aspect ratio
  const getPaddingBottom = () => {
    if (aspectRatio === '16:9') return '56.25%' // 9/16 = 0.5625 = 56.25%
    if (aspectRatio === '4:3') return '75%' // 3/4 = 0.75 = 75%
    if (aspectRatio === '1:1') return '100%' // Square
    return '56.25%' // Default to 16:9
  }

  // If no videoId is provided, show a placeholder
  if (!youtubeId) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>{title || 'YouTube Video'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center rounded bg-gray-100 p-8">
            <p className="text-gray-500">Please provide a YouTube Video ID or URL</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determine the preview image URL
  const finalPreviewUrl = previewUrl || `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`

  // Render the component with the YouTube video player
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>{title || 'YouTube Video'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
          {showPreview && finalPreviewUrl ? (
            <div
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black"
              onClick={() => {
                // Replace the preview with the iframe
                const container = document.getElementById(`youtube-video-${youtubeId}`)
                if (container) {
                  container.innerHTML = `
                    <iframe
                      src="https://www.youtube.com/embed/${youtubeId}?autoplay=1"
                      loading="lazy"
                      style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture;"
                      allowfullscreen="true"
                      title="${title || 'YouTube Video'}"
                    ></iframe>
                  `
                }
              }}
              id={`youtube-video-${youtubeId}`}
            >
              <img
                src={finalPreviewUrl}
                alt={`Preview for ${title}`}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white bg-opacity-80">
                  <div className="ml-1 h-0 w-0 border-b-8 border-l-16 border-t-8 border-b-transparent border-l-red-600 border-t-transparent"></div>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}`}
              loading="lazy"
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen={true}
              title={title || 'YouTube Video'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Component
