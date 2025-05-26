'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../packages/ui/src/shadcn/card'

// Define the type for the component props
type BunnyVideoData = {
  videoId?: string
  libraryId?: string
  previewUrl?: string
  showPreview?: boolean
  title?: string
  aspectRatio?: string
  [key: string]: any
}

// Define our own component props type
type ComponentProps = {
  data?: BunnyVideoData
  [key: string]: any
}

// The component receives props from Lexical
const Component: React.FC<ComponentProps> = (props) => {
  // Destructure the important properties from props
  const { data } = props

  // Extract data with defaults if missing
  const {
    videoId = '',
    libraryId = '264486', // Default library ID
    previewUrl = '',
    showPreview = false,
    title = 'Video',
    aspectRatio = '16:9',
  } = data || {}

  // Calculate padding based on aspect ratio
  const getPaddingBottom = () => {
    if (aspectRatio === '16:9') return '56.25%' // 9/16 = 0.5625 = 56.25%
    if (aspectRatio === '4:3') return '75%' // 3/4 = 0.75 = 75%
    if (aspectRatio === '1:1') return '100%' // Square
    return '56.25%' // Default to 16:9
  }

  // If no videoId is provided, show a placeholder
  if (!videoId) {
    return (
      <Card className="my-6">
        <CardHeader>
          <CardTitle>{title || 'Video'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-100 flex items-center justify-center p-8 rounded">
            <p className="text-gray-500">Please provide a Bunny.net Video ID</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Determine the preview image URL
  const finalPreviewUrl =
    previewUrl || (videoId ? `https://vz-ba416ac3-bac.b-cdn.net/${videoId}/preview.webp` : '')

  // Render the component with the Bunny.net video player
  return (
    <Card className="my-6">
      <CardHeader>
        <CardTitle>{title || 'Video'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" style={{ paddingBottom: getPaddingBottom() }}>
          {showPreview && finalPreviewUrl ? (
            <div
              className="absolute inset-0 flex items-center justify-center bg-black cursor-pointer"
              onClick={() => {
                // This would ideally toggle a state to show the video instead
                // But for simplicity, we'll just replace the preview with the iframe
                const container = document.getElementById(`bunny-video-${videoId}`)
                if (container) {
                  container.innerHTML = `
                    <iframe
                      src="https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=0"
                      loading="lazy"
                      style="border: none; position: absolute; top: 0; left: 0; height: 100%; width: 100%;"
                      allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
                      allowfullscreen="true"
                      title="${title || 'Bunny.net Video'}"
                    ></iframe>
                  `
                }
              }}
              id={`bunny-video-${videoId}`}
            >
              <img
                src={finalPreviewUrl}
                alt={`Preview for ${title}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-16 border-l-blue-600 ml-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <iframe
              src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=0`}
              loading="lazy"
              style={{
                border: 'none',
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '100%',
              }}
              allow="accelerometer; gyroscope; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
              title={title || 'Bunny.net Video'}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default Component
