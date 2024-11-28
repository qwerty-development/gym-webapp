import { supabaseClient } from '../supabaseClient'
export const fetchUsers = async searchQuery => {
	const supabase = await supabaseClient()
	let query = supabase.from('users').select('*')

	if (searchQuery) {
		query = query.or(
			`username.ilike.%${searchQuery}%,` +
				`first_name.ilike.%${searchQuery}%,` +
				`last_name.ilike.%${searchQuery}%`
		)
	}

	const { data, error } = await query

	if (error) {
		console.error('Error fetching users:', error.message)
		return []
	}

	console.log(data)
	return data
}
async function insertRefillRecord(supabase, userId, amount) {
	const { data, error } = await supabase.from('credit_refill').insert({
		user_id: userId,
		amount: amount
	})

	if (error) {
		console.error('Error inserting refill record:', error.message)
		return { error: 'Failed to insert refill record: ' + error.message }
	}

	return { data }
}

export const updateUserCredits = async (
	userId,
	wallet,
	sale,
	newCredits,
	tokenUpdates,
	essentialsTill
) => {
	const supabase = await supabaseClient()

	// Fetch user details
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select(
			'wallet, first_name, last_name, email, user_id, private_token, semiPrivate_token, public_token, workoutDay_token, shake_token, essential_till'
		)
		.eq('id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: 'User not found' }
	}

	// Calculate the amount of credits added
	const creditsAdded = wallet - userData.wallet

	// Calculate updated token values
	const updatedTokens = {
		private_token: Math.max(
			0,
			userData.private_token + tokenUpdates.private_token
		),
		semiPrivate_token: Math.max(
			0,
			userData.semiPrivate_token + tokenUpdates.semiPrivate_token
		),
		public_token: Math.max(
			0,
			userData.public_token + tokenUpdates.public_token
		),
		workoutDay_token: Math.max(
			0,
			userData.workoutDay_token + tokenUpdates.workoutDay_token
		),
		shake_token: Math.max(0, userData.shake_token + tokenUpdates.shake_token)
	}

	// Handle essential_till update
	let newEssentialsTill = userData.essential_till
	if (essentialsTill) {
		newEssentialsTill = new Date(essentialsTill).toISOString()
	}

	// Update user's wallet, tokens, and essential_till
	const { data, error } = await supabase
		.from('users')
		.update({ wallet, ...updatedTokens, essential_till: newEssentialsTill })
		.eq('id', userId)

	if (error) {
		console.error('Error updating user data:', error.message)
		return {
			error: 'Failed to update user data: ' + error.message
		}
	}

	// Initialize transactions array
	const transactions = []

	// Only add credit refill transaction if credits were actually added/removed
	if (creditsAdded !== 0) {
		// Insert refill record
		const { error: refillError } = await insertRefillRecord(
			supabase,
			userData.user_id,
			newCredits
		)

		if (refillError) {
			console.error('Error inserting refill record:', refillError.message)
		}

		transactions.push({
			user_id: userData.user_id,
			name: 'Credit refill',
			type: 'credit refill',
			amount: `${creditsAdded >= 0 ? '+' : ''}${creditsAdded} credits`
		})

		// If there was a sale and credits were added, add a transaction for the free tokens
		if (sale && sale > 0 && creditsAdded > 0) {
			const freeTokens = Math.floor(newCredits * (sale / 100))
			transactions.push({
				user_id: userData.user_id,
				name: 'Free tokens from credit refill sale',
				type: 'credit refill',
				amount: `+${freeTokens} tokens`
			})
		}
	}

	// Add separate transactions for each token update
	Object.entries(tokenUpdates).forEach(([tokenType, amount]) => {
		if (amount !== 0) {
			const formattedTokenType = tokenType
				.replace('_token', '')
				.split('_')
				.map(word => word.charAt(0).toUpperCase() + word.slice(1))
				.join(' ')

			transactions.push({
				user_id: userData.user_id,
				name: `${formattedTokenType} token update`,
				type: 'token update',
				amount: `${amount > 0 ? '+' : ''}${amount} ${formattedTokenType} token${
					Math.abs(amount) !== 1 ? 's' : ''
				}`
			})
		}
	})

	// Add transaction for essentials update if changed
	if (newEssentialsTill !== userData.essential_till) {
		transactions.push({
			user_id: userData.user_id,
			name: 'Essentials membership update',
			type: 'essentials update',
			amount: `Essentials till ${new Date(
				newEssentialsTill
			).toLocaleDateString()}`
		})
	}

	// Only insert transactions if there are any
	if (transactions.length > 0) {
		const { error: transactionError } = await supabase
			.from('transactions')
			.insert(transactions)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		user_wallet: wallet,
		creditsAdded,
		sale,
		newCredits,
		tokenUpdates,
		essentialsTill: newEssentialsTill
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-refill-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultUser = await responseUser.json()
		if (responseUser.ok) {
			console.log('User email sent successfully')
		} else {
			console.error(`Failed to send user email: ${resultUser.error}`)
		}
	} catch (error) {
		console.error('Error sending user email:', error)
	}

	return { data, error }
}

export const updateUserisFree = async (userId, isFree) => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('users')
		.update({ isFree })
		.eq('id', userId)

	return { data, error } // Return an object containing both data and error
}

export const updateUserCreditsCancellation = async (userId, totalRefund) => {
	const supabase = await supabaseClient()
	const userResponse = await supabase
		.from('users')
		.select('wallet')
		.eq('user_id', userId)
		.single()

	if (userResponse.data) {
		const newWalletBalance = userResponse.data.wallet + totalRefund
		const { data, error } = await supabase
			.from('users')
			.update({ wallet: newWalletBalance })
			.eq('user_id', userId)

		if (error) {
			console.error('Error updating user credits:', error.message)
			return { success: false, error: error.message }
		}
		return { success: true, data }
	} else {
		console.error('User not found or failed to fetch user data')
		return { success: false, error: 'User not found' }
	}
}

export const fetchTotalUsers = async () => {
	const supabase = await supabaseClient()
	try {
		const { data: activeData, error: activeError } = await supabase
			.from('users')
			.select('id')
			.or(
				'wallet.gt.0,private_token.gt.0,public_token.gt.0,punches.gt.0,shake_token.gt.0'
			)

		const { data: totalData, error: totalError } = await supabase
			.from('users')
			.select('id')

		if (activeError || totalError) throw activeError || totalError

		console.log(activeData)
		console.log(totalData)
		return {
			total: totalData?.length || 0,
			active: activeData?.length || 0
		}
	} catch (error) {
		console.error('Error fetching total users:', error)
		return { total: 0, active: 0 }
	}
}

export const fetchUsersWithLowBalances = async () => {
	const supabase = await supabaseClient()

	// Fetch active users with verified phone numbers
	const { data, error } = await supabase
		.from('users')
		.select('*')
		.neq('isFree', true)
		.neq('phone', '')

	if (error) {
		console.error('Error fetching users with low balances:', error)
		return []
	}

	// Filter users based on refined conditions
	const filteredUsers = data.filter(user => {
		const credits = user.wallet || 0
		const privateTokens = user.private_token || 0
		const publicTokens = user.public_token || 0

		// Skip users with no activity
		if (credits === 0 && privateTokens === 0 && publicTokens === 0) {
			return false
		}

		// Include users who are running low on either credits OR tokens
		const hasLowCredits = credits > 0 && credits < 10
		const hasLowPrivateTokens = privateTokens > 0 && privateTokens < 2
		const hasLowPublicTokens = publicTokens > 0 && publicTokens < 2

		// Must have at least one low balance but not be completely empty
		return (
			(hasLowCredits || hasLowPrivateTokens || hasLowPublicTokens) &&
			!(credits === 0 && privateTokens === 0 && publicTokens === 0)
		)
	})

	// Enhanced sorting algorithm
	return filteredUsers.sort((a, b) => {
		// First prioritize users with both low credits and tokens
		const aHasBothLow =
			a.wallet < 10 && (a.private_token < 2 || a.public_token < 2)
		const bHasBothLow =
			b.wallet < 10 && (b.private_token < 2 || b.public_token < 2)

		if (aHasBothLow !== bHasBothLow) {
			return aHasBothLow ? -1 : 1
		}

		// Then sort by lowest credits
		if (a.wallet !== b.wallet) {
			return a.wallet - b.wallet
		}

		// Finally sort by total tokens
		return a.private_token + a.public_token - (b.private_token + b.public_token)
	})
}
