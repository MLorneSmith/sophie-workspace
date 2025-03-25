import { Block } from 'payload'

const DebugBlock: Block = {
  slug: 'debug-block',
  labels: {
    singular: 'Debug Block',
    plural: 'Debug Blocks',
  },
  fields: [
    {
      name: 'debugInfo',
      type: 'text',
      defaultValue: 'Debug information will appear here',
      admin: {
        components: {
          Field: './Field',
        },
      },
    },
  ],
  admin: {
    components: {
      Block: './Component',
    },
  },
}

export default DebugBlock
