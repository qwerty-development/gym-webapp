'use server'

import { checkRoleAdmin } from '../../../../utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { supabaseClient } from '../../../../utils/supabaseClient'

export async function setRole(formData: FormData) {
	// Check that the user trying to set the role is an admin
	if (!checkRoleAdmin('admin')) {
		return { message: 'Not Authorized' }
	}

	try {
		const res = await clerkClient.users.updateUser(
			formData.get('id') as string,
			{
				publicMetadata: { role: formData.get('role') }
			}
		)
		return { message: res.publicMetadata }
	} catch (err) {
		return { message: err }
	}
}

export async function removeAdmin(formData: FormData) {
	if (!checkRoleAdmin('admin')) {
		return { message: 'Not Authorized' }
	}
	try {
		const res = await clerkClient.users.updateUser(
			formData.get('id') as string,
			{
				publicMetadata: {}
			}
		)
		return { message: res.publicMetadata }
	} catch (err) {
		return { message: err }
	}
}

export async function getUsers(query: string) {
	let users = query ? await clerkClient.users.getUserList({ query }) : []
	return users
}

export async function deleteUser(formData: FormData) {
	'use server'

	const userId = formData.get('id') as string

	try {
		// Create Supabase client
		const supabase = await supabaseClient()

		// Delete user from Supabase
		const { error: supabaseError } = await supabase
			.from('users')
			.delete()
			.eq('user_id', userId)

		if (supabaseError) {
			throw new Error(`Supabase deletion failed: ${supabaseError.message}`)
		}

		// Delete user from Clerk
		await clerkClient.users.deleteUser(userId)

		return { success: true }
	} catch (error) {
		console.error('Error deleting user:', error)
		throw error
	}
}
