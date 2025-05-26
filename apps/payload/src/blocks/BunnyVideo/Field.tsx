'use client'

import React from 'react'
import { Input } from '../../../../../packages/ui/src/shadcn/input'
import { Label } from '../../../../../packages/ui/src/shadcn/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../packages/ui/src/shadcn/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../packages/ui/src/shadcn/select'
import { Switch } from '../../../../../packages/ui/src/shadcn/switch'

// Define the type for the field props
type FieldProps = {
  path: string
  name: string
  label?: string
  value?: any
  onChange?: (value: any) => void
  [key: string]: any
}

// Custom TextField component
type TextFieldProps = {
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const TextField: React.FC<TextFieldProps> = ({ label, value, onChange }) => {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={onChange} />
    </div>
  )
}

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
  const { path, value = {}, onChange } = props

  // Handle field changes
  const handleChange = (fieldName: string, fieldValue: any) => {
    if (onChange) {
      onChange({
        ...value,
        [fieldName]: fieldValue,
      })
    }
  }

  // Handle aspect ratio selection
  const handleAspectRatioChange = (newRatio: string) => {
    handleChange('aspectRatio', newRatio)
  }

  return (
    <Card className="p-4 mb-4">
      <CardHeader>
        <CardTitle>Bunny.net Video</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextField
          label="Video ID"
          value={value.videoId || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('videoId', e.target.value)
          }
        />
        <div className="text-xs text-gray-500 mb-4">
          <p>Example: 2620df68-c2a8-4255-986e-24c1d4c1dbf2</p>
        </div>

        <TextField
          label="Library ID"
          value={value.libraryId || '264486'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('libraryId', e.target.value)
          }
        />
        <div className="text-xs text-gray-500 mb-4">
          <p>Default: 264486</p>
        </div>

        <div className="border-t pt-4 mb-4">
          <p className="text-sm font-medium mb-2">Preview Options</p>
          <TextField
            label="Custom Preview Image URL (optional)"
            value={value.previewUrl || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange('previewUrl', e.target.value)
            }
          />
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="show-preview"
              checked={value.showPreview || false}
              onCheckedChange={(checked) => handleChange('showPreview', checked)}
            />
            <Label htmlFor="show-preview">Show preview image before playing</Label>
          </div>
        </div>
        <TextField
          label="Title (optional)"
          value={value.title || 'Video'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('title', e.target.value)
          }
        />
        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select value={value.aspectRatio || '16:9'} onValueChange={handleAspectRatioChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select aspect ratio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
              <SelectItem value="4:3">4:3 (Standard)</SelectItem>
              <SelectItem value="1:1">1:1 (Square)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export default Field
