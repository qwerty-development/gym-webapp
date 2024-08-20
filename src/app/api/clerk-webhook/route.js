// app/api/clerk-webhook/route.js
import { NextResponse } from 'next/server'
import { supabaseClient } from '../../../../utils/supabaseClient'

export async function POST(request) {
	const supabase = supabaseClient()

	const payload = await request.json()

	const user = payload.data
	// Extract necessary fields from the user object
	const userId = user.id
	const email = user.email_addresses[0].email_address
	const firstName = user.first_name
	const lastName = user.last_name
	const userName = user.username

	const { data: existingUser, error: fetchError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (fetchError && fetchError.code !== 'PGRST116') {
		// PGRST116 is the code for 'No Rows Found'
		console.error('Error checking user existence:', fetchError.message)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}

	let result
	if (existingUser) {
		result = await supabase
			.from('users')
			.update({
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			})
			.eq('user_id', userId)
	} else {
		result = await supabase.from('users').insert([
			{
				user_id: userId,
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			}
		])
	}

	if (result.error) {
		console.error('Error updating/creating user record:', result.error.message)
		return NextResponse.json(
			{ error: 'Internal Server Error' },
			{ status: 500 }
		)
	}

	return NextResponse.json(
		{ message: 'User record updated/created successfully' },
		{ status: 200 }
	)
}

// import { WebhookEvent } from '@clerk/nextjs/server'

// export async function POST(request) {
// 	const payload = await request.json()
// 	console.log(payload)
// }
