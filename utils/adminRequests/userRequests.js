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

	// 1. Fetch current user data
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

	// 2. Calculate the credit change
	const creditsAdded = wallet - userData.wallet

	// 3. Calculate updated token values by adding to existing values
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

	// 4. Handle essential_till update
	let newEssentialsTill = userData.essential_till
	if (essentialsTill) {
		newEssentialsTill = new Date(essentialsTill).toISOString()
	}

	// 5. Update user data
	const { data, error } = await supabase
		.from('users')
		.update({
			wallet,
			...updatedTokens,
			essential_till: newEssentialsTill,
			refill_date: new Date().toISOString()
		})
		.eq('id', userId)

	if (error) {
		console.error('Error updating user data:', error.message)
		return { error: 'Failed to update user data: ' + error.message }
	}

	// 6. Initialize transactions array
	const transactions = []

	// 7. Handle credit transactions
	if (creditsAdded !== 0) {
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

		// Handle sale bonus
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

	// 8. Handle token transactions
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
				amount: `${
					amount >= 0 ? '+' : ''
				}${amount} ${formattedTokenType} token${
					Math.abs(amount) !== 1 ? 's' : ''
				}`
			})
		}
	})

	// 9. Handle essentials transaction
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

	// 10. Record all transactions
	if (transactions.length > 0) {
		const { error: transactionError } = await supabase
			.from('transactions')
			.insert(transactions)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	// 11. Send email notification
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

	try {
		const responseUser = await fetch('/api/send-refill-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		if (!responseUser.ok) {
			const resultUser = await responseUser.json()
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
	try {
		const supabase = await supabaseClient()

		const { count: totalCount, error: totalError } = await supabase
			.from('users')
			.select('*', { count: 'exact', head: true })

		if (totalError) throw totalError

		const twoMonthsAgo = new Date()
		twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2)

		const { count: activeCount, error: activeError } = await supabase
			.from('users')
			.select('*', { count: 'exact', head: true })
			.or(`refill_date.gte.${twoMonthsAgo.toISOString()},isFree.eq.true`)

		if (activeError) throw activeError

		return {
			total: totalCount || 0,
			active: activeCount || 0
		}
	} catch (error) {
		console.error('Error fetching user counts:', error)
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
