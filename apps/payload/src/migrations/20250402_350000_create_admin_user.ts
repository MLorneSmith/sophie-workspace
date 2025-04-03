import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Create Admin User Migration
 *
 * This migration creates an admin user with the correct password hashing.
 */
export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log('Running create admin user migration')

  try {
    // First, check if the user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'michael@slideheroes.com',
        },
      },
    })

    // If the user exists, delete it
    if (existingUsers.docs && existingUsers.docs.length > 0) {
      await payload.delete({
        collection: 'users',
        id: existingUsers.docs[0].id,
      })
    }

    // Create the admin user using Payload's API
    // This ensures the password is hashed correctly
    const user = await payload.create({
      collection: 'users',
      data: {
        email: 'michael@slideheroes.com',
        password: 'aiesec1992',
      },
    })

    console.log('Admin user created successfully with ID:', user.id)
  } catch (error) {
    console.error('Error in create admin user migration:', error)
    throw error
  }
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  console.log('Running down migration for create admin user')

  try {
    // Find the user
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'michael@slideheroes.com',
        },
      },
    })

    // Delete the user if it exists
    if (existingUsers.docs && existingUsers.docs.length > 0) {
      await payload.delete({
        collection: 'users',
        id: existingUsers.docs[0].id,
      })
    }

    console.log('Create admin user down migration completed successfully')
  } catch (error) {
    console.error('Error in create admin user down migration:', error)
    throw error
  }
}
