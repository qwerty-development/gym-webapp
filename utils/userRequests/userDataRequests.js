import { supabaseClient } from '../supabaseClient'
export const getWalletBalance = async ({ userId }) => {
	const supabase = await supabaseClient()
	const { data: userData, error } = await supabase
		.from('users')
		.select('wallet') // Selecting only the wallet column
		.eq('user_id', userId)
		.single() // Assuming each user has a unique user_id

	if (error) {
		console.error('Error fetching wallet balance:', error.message)
		return null
	}

	return userData ? userData.wallet : null
}

export const checkUserExists = async userId => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error checking user existence:', error.message)
		return null
	}

	return data
}

// Function to create or update user record in Supabase
export const updateUserRecord = async ({
	userId,
	email,
	firstName,
	lastName,
	userName
}) => {
	const supabase = await supabaseClient()
	const existingUser = await checkUserExists(userId)

	if (existingUser) {
		const { data, error } = await supabase
			.from('users')
			.update({
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			})
			.eq('user_id', userId)

		if (error) {
			console.error('Error updating user record:', error.message)
			return null
		}

		return data
	} else {
		const { data, error } = await supabase.from('users').insert([
			{
				user_id: userId,
				email,
				first_name: firstName,
				last_name: lastName,
				username: userName
			}
		])

		if (error) {
			console.error('Error creating user record:', error.message)
			return null
		}

		return data
	}
}
export const fetchUserTokens = async id => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('private_token, semiPrivate_token, public_token, workoutDay_token,shake_token')
		.eq('user_id', id)
		.single()

	if (error) throw error

	return data
}
export const fetchUserData = async userId => {
	const supabase = supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user data:', error.message)
		return null
	}

	return data
}
export const fetchUserEssentialTill = async userId => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.select('essential_till')
		.eq('user_id', userId)
		.single()

	if (error) {
		console.error('Error fetching user essential_till:', error)
		return null
	}

	return data?.essential_till
}
