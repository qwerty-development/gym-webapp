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

	// 2. Calculate the credit change (new wallet minus old wallet)
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
	const hasEssentialsChanged =
		essentialsTill && essentialsTill !== userData.essential_till
	if (hasEssentialsChanged) {
		newEssentialsTill = new Date(essentialsTill).toISOString()
	}

	// 5. Prepare update fields for user record
	const updateFields = {
		wallet,
		...updatedTokens,
		refill_date: new Date().toISOString()
	}
	if (hasEssentialsChanged) {
		updateFields.essential_till = newEssentialsTill
	}

	// 6. Update user data
	const { data, error } = await supabase
		.from('users')
		.update(updateFields)
		.eq('id', userId)
	if (error) {
		console.error('Error updating user data:', error.message)
		return { error: 'Failed to update user data: ' + error.message }
	}

	// 7. Build transaction records array for new_transactions
	const transactions = []

	// 8. Record credit change: if positive then credit_refill; if negative then credit_deduction.
	if (creditsAdded !== 0) {
		transactions.push({
			user_id: userData.user_id,
			currency: 'credits',
			amount: newCredits, // positive for refill, negative for deduction
			type: creditsAdded > 0 ? 'credit_refill' : 'credit_deduction',
			description: `User wallet updated by ${creditsAdded} credits`
		})

		// Handle sale bonus: record additional free credits if applicable.
		if (sale && sale > 0 && creditsAdded > 0) {
			const freeCredits = Math.floor(newCredits * (sale / 100))
			transactions.push({
				user_id: userData.user_id,
				currency: 'credits',
				amount: freeCredits, // bonus credits are added
				type: 'credit_sale',
				description: `Free credits from credit refill sale: +${freeCredits} credits`
			})
		}
	}

	// 9. Record token updates – using a custom type "token_update" (ensure your ENUM includes it)
	Object.entries(tokenUpdates).forEach(([tokenKey, amount]) => {
		if (amount !== 0) {
			// Map token key to correct currency. For example, 'semiPrivate_token' becomes 'semi_private_token'
			let currency = tokenKey
			if (tokenKey === 'semiPrivate_token') {
				currency = 'semi_private_token'
			}
			if (tokenKey === 'workoutDay_token') {
				// Optionally map workoutDay_token to an appropriate currency – here we map to 'private_token'
				currency = 'private_token'
			}
			transactions.push({
				user_id: userData.user_id,
				currency,
				amount, // positive if tokens are added; negative if deducted
				type: 'token_update', // custom type – add to your ENUM if needed
				description: `${tokenKey
					.replace('_token', '')
					.replace(/([A-Z])/g, ' $1')
					.trim()} token update: ${amount >= 0 ? '+' : ''}${amount}`
			})
		}
	})

	// 10. Record essentials membership update as a separate transaction.
	if (hasEssentialsChanged) {
		transactions.push({
			user_id: userData.user_id,
			currency: 'none',
			amount: 0,
			type: 'essentials_update', // custom type – ensure it's added to your ENUM
			description: `Essentials membership updated: till ${new Date(
				newEssentialsTill
			).toLocaleDateString()}`
		})
	}

	// 11. Insert all transactions into new_transactions table
	if (transactions.length > 0) {
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactions)
		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}
	}

	// 12. Send email notification
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		user_wallet: wallet,
		creditsAdded,
		sale,
		newCredits,
		tokenUpdates,
		essentialsTill: hasEssentialsChanged ? newEssentialsTill : undefined
	}
	try {
		const responseUser = await fetch('/api/send-refill-email', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
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

	if (data) {
		supabase.from('new_transactions').insert({
			user_id: userId,
			currency: 'credits',
			amount: 0,
			type: `${isFree ? 'free_user' : 'free_user_cancel'}`,
			description: `Free membership updated: ${isFree ? 'Enabled' : 'Disabled'}`
		})
	}

	return { data, error }
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
