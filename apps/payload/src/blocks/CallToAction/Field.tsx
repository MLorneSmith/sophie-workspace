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

  return (
    <Card className="p-4 mb-4">
      <CardHeader>
        <CardTitle>Call To Action</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <TextField
          label="Headline"
          value={value.headline || 'FREE Course Trial'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('headline', e.target.value)
          }
        />
        <TextField
          label="Subheadline"
          value={
            value.subheadline ||
            'Start improving your presentations skills immediately with our free trial of the Decks for Decision Makers course.'
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleChange('subheadline', e.target.value)
          }
        />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <TextField
              label="Left Button Label"
              value={value.leftButtonLabel || 'Individuals'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('leftButtonLabel', e.target.value)
              }
            />
            <TextField
              label="Left Button URL"
              value={value.leftButtonUrl || '/free-trial/individual'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('leftButtonUrl', e.target.value)
              }
            />
          </div>
          <div>
            <TextField
              label="Right Button Label"
              value={value.rightButtonLabel || 'Teams'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('rightButtonLabel', e.target.value)
              }
            />
            <TextField
              label="Right Button URL"
              value={value.rightButtonUrl || '/free-trial/teams'}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange('rightButtonUrl', e.target.value)
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Field
