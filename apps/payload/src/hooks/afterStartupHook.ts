import type { Payload } from 'payload'

/**
 * This hook has been disabled as part of the custom component importMap fix.
 * We're letting Payload generate the importMap automatically instead of manually modifying it.
 *
 * @see z.plan/payload-custom-component-importmap-fix-plan.md for details
 */
export const afterStartupHook = async (payload: Payload): Promise<void> => {
  console.log('========================================')
  console.log('afterStartupHook is now disabled')
  console.log('Letting Payload generate the importMap automatically')
  console.log('========================================')

  // No-op function - we're not modifying the importMap anymore
  return
}
