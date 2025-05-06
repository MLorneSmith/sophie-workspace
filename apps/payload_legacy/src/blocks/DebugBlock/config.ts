import { Block } from 'payload'

export const DebugBlock: Block = {
  slug: 'debug-block',
  interfaceName: 'DebugBlock',
  labels: {
    singular: 'Debug Block',
    plural: 'Debug Blocks',
  },
  fields: [
    {
      name: 'debugInfo',
      type: 'text',
      defaultValue: 'Debug information will appear here',
    },
  ],
}
