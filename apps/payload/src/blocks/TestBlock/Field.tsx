'use client'

import React from 'react'
import { Input } from '../../../../../packages/ui/src/shadcn/input'
import { Label } from '../../../../../packages/ui/src/shadcn/label'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../packages/ui/src/shadcn/card'

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
    <Card className="p-4 mb-4">
      <CardHeader>
        <CardTitle>Test Block</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Text</Label>
          <Input value={value || 'Test Block'} onChange={handleChange} />
        </div>
      </CardContent>
    </Card>
  )
}

export default Field
