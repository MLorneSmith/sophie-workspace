import { Block } from 'payload'

export const CallToAction: Block = {
  slug: 'call-to-action',
  interfaceName: 'CallToActionBlock',
  labels: {
    singular: 'Call To Action',
    plural: 'Call To Actions',
  },
  imageAltText: 'Call To Action component',
  fields: [
    {
      name: 'headline',
      type: 'text',
      defaultValue: 'FREE Course Trial',
      required: true,
    },
    {
      name: 'subheadline',
      type: 'text',
      defaultValue:
        'Start improving your presentations skills immediately with our free trail of the Decks for Decision Makers course.',
      required: true,
    },
    {
      name: 'leftButtonLabel',
      type: 'text',
      defaultValue: 'Individuals',
      required: true,
    },
    {
      name: 'leftButtonUrl',
      type: 'text',
      defaultValue: '/free-trial/individual',
      required: true,
    },
    {
      name: 'rightButtonLabel',
      type: 'text',
      defaultValue: 'Teams',
      required: true,
    },
    {
      name: 'rightButtonUrl',
      type: 'text',
      defaultValue: '/free-trial/teams',
      required: true,
    },
  ],
}
