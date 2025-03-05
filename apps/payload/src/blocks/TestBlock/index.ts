import { Block } from 'payload'

const TestBlock: Block = {
  slug: 'test-block',
  labels: {
    singular: 'Test Block',
    plural: 'Test Blocks',
  },
  fields: [
    {
      name: 'text',
      type: 'text',
      defaultValue: 'Test Block',
    },
  ],
  admin: {
    components: {
      Block: './Component',
    },
  },
}

export default TestBlock
