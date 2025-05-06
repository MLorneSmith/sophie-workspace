'use client'

import React from 'react'
import { Input } from '@kit/ui/input'
import { Label } from '@kit/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card'

// Define the type for the field props
type FieldProps = {
  path: string
  name: string
  label?: string
  value?: any
  onChange?: (value: any) => void
  [key: string]: any
}

/**
 * This component is used for the input card in the Lexical editor
 */
const Field: React.FC<FieldProps> = (props) => {
  const { path, value = {}, onChange } = props

  // Handle field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(e.target.value)
    }
  }

  return (
    <Card className="p-4 mb-4 bg-red-50">
      <CardHeader>
        <CardTitle>Debug Block</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Debug Information</Label>
          <Input value={value || 'Debug information will appear here'} onChange={handleChange} />
        </div>
        <div className="text-xs text-gray-500">
          <p>Path: {path}</p>
          <p>Current value: {JSON.stringify(value)}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default Field
