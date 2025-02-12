import { supabaseClient } from '../supabaseClient'
export const fetchReservations = async userId => {
	const supabase = supabaseClient() // Ensure you're correctly initializing this with any necessary tokens
	const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

	const { data, error } = await supabase
		.from('time_slots')
		.select(
			` *,
            id,
            user_id,
            start_time,
            end_time,
            date,
            additions,
            activity:activities (
                id,
                name,
                credits
            ),
            coach:coaches (
                id,
                name,
                email
            )
        `
		)
		.eq('user_id', userId)
		.gte('date', today) // Use greater than or equal to filter for date

	if (error) {
		console.error('Error fetching reservations:', error.message)
		return null
	}

	return data.map(reservation => {
		return reservation
	})
}

export const fetchReservationsGroup = async userId => {
	const supabase = supabaseClient() // Ensure you're correctly initializing this with any necessary tokens
	const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

	const { data, error } = await supabase
		.from('group_time_slots')
		.select(
			` *,
            id,
            user_id,
            start_time,
            end_time,
            date,
            count,
            additions,
            activity:activities (
                id,
                name,
                credits
            ),
            coach:coaches (
                id,
                name,
                email
            )
        `
		)
		.contains('user_id', [userId])
		.gte('date', today) // Use greater than or equal to filter for date

	if (error) {
		console.error('Error fetching reservations:', error.message)
		return null
	}

	return data.map(reservation => reservation)
}

// utils/requests.js

// Function to cancel a reservation
// Function to cancel a reservation
// Function to cancel a reservation
export const cancelReservation = async (
	reservationId,
	userId,
	setReservations
) => {
	const supabase = await supabaseClient()

	try {
		// Fetch the reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('time_slots')
			.select(
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions, booked_with_token'
			)
			.eq('id', reservationId)
			.single()

		if (reservationError || !reservationData) {
			throw new Error(
				`Error fetching reservation: ${
					reservationError?.message || 'Reservation not found'
				}`
			)
		}

		if (!reservationData.booked || reservationData.user_id !== userId) {
			throw new Error('Unauthorized to cancel this reservation.')
		}

		// Fetch user data including punches
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'wallet, first_name, last_name, email, isFree, private_token, shake_token, punches'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		// Initialize refund variables
		let totalCreditRefund = 0
		let tokenRefund = 0
		let shakeTokenRefund = 0
		let punchesToDeduct = 0
		let shakeTokenPenalty = 0

		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits, name')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity credits: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Determine refund type based on how the session was booked
		if (reservationData.booked_with_token) {
			tokenRefund = 1
		} else if (!userData.isFree) {
			totalCreditRefund += activityData.credits
		}

		// Fetch the additions and handle protein items specially
		const { data: additionsData, error: additionsError } = await supabase
			.from('market')
			.select('id, name, price')
			.in('name', reservationData.additions || [])

		if (additionsError) {
			throw new Error(
				`Error fetching additions data: ${additionsError.message}`
			)
		}

		// Separate protein items from other additions
		const proteinItems = additionsData.filter(
			item =>
				item.name.toLowerCase().includes('protein shake') ||
				item.name.toLowerCase().includes('protein pudding')
		)
		const otherItems = additionsData.filter(
			item =>
				!item.name.toLowerCase().includes('protein shake') &&
				!item.name.toLowerCase().includes('protein pudding')
		)

		// Calculate refunds for non-protein items
		const otherItemsTotalPrice = otherItems.reduce(
			(total, item) => total + item.price,
			0
		)
		totalCreditRefund += otherItemsTotalPrice

		// Handle protein items
		const proteinItemsCount = proteinItems.length
		if (proteinItemsCount > 0) {
			// Return shake tokens instead of credits
			shakeTokenRefund = proteinItemsCount

			// Handle punch card adjustments
			if (userData.punches > 0) {
				punchesToDeduct = proteinItemsCount
				const newPunchCount = userData.punches - punchesToDeduct

				// Check if user benefited from loyalty reward
				if (
					Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)
				) {
					shakeTokenPenalty = 2 // Deduct 2 tokens as penalty
				}
			}
		}

		// Update the time slot to cancel the reservation
		const { error: updateError } = await supabase
			.from('time_slots')
			.update({
				user_id: null,
				booked: false,
				additions: [],
				booked_with_token: false
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		// Update item quantities
		for (const item of additionsData) {
			const { data, error: quantityError } = await supabase
				.from('market')
				.select('quantity')
				.eq('id', item.id)
				.single()

			if (quantityError) {
				console.error('Error fetching item quantity:', quantityError.message)
				continue
			}

			const newQuantity = (data.quantity || 0) + 1

			const { error: updateError } = await supabase
				.from('market')
				.update({ quantity: newQuantity })
				.eq('id', item.id)

			if (updateError) {
				throw new Error(`Error updating item quantity: ${updateError.message}`)
			}
		}

		// Calculate new user balances
		const newWalletBalance = userData.wallet + totalCreditRefund
		const newPrivateTokenBalance = userData.private_token + tokenRefund
		const newShakeTokenBalance =
			userData.shake_token + shakeTokenRefund - shakeTokenPenalty
		const newPunchCount = Math.max(0, userData.punches - punchesToDeduct)

		// Update the user's balances
		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newPrivateTokenBalance,
				shake_token: newShakeTokenBalance,
				punches: newPunchCount
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		// Record transactions
		const transactions = []

		// Session cancellation transaction
		transactions.push({
			user_id: userId,
			name: `Cancelled individual session: ${activityData.name}`,
			type: 'individual session',
			amount: reservationData.booked_with_token
				? '+1 private token'
				: `+${activityData.credits} credits`
		})

		// Regular items refund transaction
		if (otherItemsTotalPrice > 0) {
			transactions.push({
				user_id: userId,
				name: `Refunded items for cancelled session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${otherItemsTotalPrice} credits`
			})
		}

		// Protein items refund transaction
		if (shakeTokenRefund > 0) {
			transactions.push({
				user_id: userId,
				name: `Returned shake tokens for cancelled protein items`,
				type: 'market transaction',
				amount: `+${shakeTokenRefund} shake tokens`
			})
		}

		// Punch deduction transaction
		if (punchesToDeduct > 0) {
			transactions.push({
				user_id: userId,
				name: `Deducted punches from cancelled protein items`,
				type: 'punch card adjustment',
				amount: `-${punchesToDeduct} punches`
			})
		}

		// Token penalty transaction
		if (shakeTokenPenalty > 0) {
			transactions.push({
				user_id: userId,
				name: 'Token penalty for cancelled loyalty reward',
				type: 'punch card penalty',
				amount: '-2 shake tokens'
			})
		}

		const { error: transactionError } = await supabase
			.from('transactions')
			.insert(transactions)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}

		// Fetch coach data for email
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('*')
			.eq('id', reservationData.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		// Prepare email data
		const emailData = {
			user_name: userData.first_name + ' ' + userData.last_name,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_type: reservationData.booked_with_token ? 'token' : 'credits',
			refund_amount: reservationData.booked_with_token ? 1 : totalCreditRefund,
			protein_items_refund:
				shakeTokenRefund > 0
					? {
							tokens: shakeTokenRefund,
							penalty: shakeTokenPenalty,
							punches_deducted: punchesToDeduct
					  }
					: null
		}

		// Send emails
		await Promise.all([
			fetch('/api/send-cancel-admin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailData)
			}),
			fetch('/api/send-cancel-user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailData)
			})
		])

		// Update reservations state
		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)

		return {
			success: true,
			message:
				shakeTokenPenalty > 0
					? `Reservation cancelled. ${shakeTokenRefund} shake tokens returned. 2 tokens deducted as loyalty reward penalty.`
					: `Reservation cancelled successfully.`
		}
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return {
			success: false,
			error: error.message
		}
	}
}

export const cancelReservationGroup = async (
	reservationId,
	userId,
	setReservations
) => {
	const supabase = await supabaseClient()

	try {
		// Fetch the reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('group_time_slots')
			.select(
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions, booked_with_token'
			)
			.eq('id', reservationId)
			.single()

		if (reservationError || !reservationData) {
			throw new Error(
				`Error fetching reservation: ${
					reservationError?.message || 'Reservation not found'
				}`
			)
		}

		if (!reservationData.user_id.includes(userId)) {
			throw new Error('Unauthorized to cancel this reservation.')
		}

		// Fetch user data including punches and shake tokens
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'wallet, first_name, last_name, email, isFree, public_token, semiPrivate_token, shake_token, punches'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		// Initialize refund variables
		let totalRefund = 0
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token
		let newShakeTokenBalance = userData.shake_token
		let shakeTokenRefund = 0
		let shakeTokenPenalty = 0
		let punchesToDeduct = 0

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits, name, semi_private')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity data: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Handle class token refund
		const bookedWithToken = reservationData.booked_with_token.includes(userId)
		if (bookedWithToken) {
			if (activityData.semi_private) {
				newSemiPrivateTokenBalance += 1
			} else {
				newPublicTokenBalance += 1
			}
		} else if (!userData.isFree) {
			totalRefund += activityData.credits
		}

		// Handle additions and protein items
		const userAdditions = reservationData.additions.filter(
			addition => addition.user_id === userId
		)

		// Separate protein items from other additions
		const proteinItems = []
		const otherItems = []

		userAdditions.forEach(addition => {
			addition.items.forEach(item => {
				if (
					item.name.toLowerCase().includes('protein shake') ||
					item.name.toLowerCase().includes('protein pudding')
				) {
					proteinItems.push(item)
				} else {
					otherItems.push(item)
				}
			})
		})

		// Calculate refunds for non-protein items
		const otherItemsTotalPrice = otherItems.reduce(
			(total, item) => total + item.price,
			0
		)
		totalRefund += otherItemsTotalPrice

		// Handle protein items
		const proteinItemsCount = proteinItems.length
		if (proteinItemsCount > 0) {
			// Return shake tokens instead of credits
			shakeTokenRefund = proteinItemsCount

			// Handle punch card adjustments
			if (userData.punches > 0) {
				punchesToDeduct = proteinItemsCount
				const newPunchCount = userData.punches - punchesToDeduct

				// Check if user benefited from loyalty reward
				if (
					Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)
				) {
					shakeTokenPenalty = 2 // Deduct 2 tokens as penalty
				}
			}
		}

		newShakeTokenBalance =
			userData.shake_token + shakeTokenRefund - shakeTokenPenalty

		// Update group time slot data
		const updatedAdditions = reservationData.additions.filter(
			addition => addition.user_id !== userId
		)
		const updatedUserIds = reservationData.user_id.filter(id => id !== userId)
		const newCount = updatedUserIds.length
		const isBooked = newCount >= activityData.capacity
		const updatedBookedWithToken = reservationData.booked_with_token.filter(
			id => id !== userId
		)

		const { error: updateError } = await supabase
			.from('group_time_slots')
			.update({
				user_id: updatedUserIds,
				count: newCount,
				booked: isBooked,
				additions: updatedAdditions,
				booked_with_token: updatedBookedWithToken
			})
			.eq('id', reservationId)

		if (updateError) {
			throw new Error(`Error canceling reservation: ${updateError.message}`)
		}

		// Update market item quantities
		for (const addition of userAdditions) {
			for (const item of addition.items) {
				const { data, error: quantityError } = await supabase
					.from('market')
					.select('quantity')
					.eq('id', item.id)
					.single()

				if (quantityError) continue

				const newQuantity = (data.quantity || 0) + 1
				await supabase
					.from('market')
					.update({ quantity: newQuantity })
					.eq('id', item.id)
			}
		}

		// Update user balances
		const newWalletBalance = userData.wallet + totalRefund
		const newPunchCount = Math.max(0, userData.punches - punchesToDeduct)

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				public_token: newPublicTokenBalance,
				semiPrivate_token: newSemiPrivateTokenBalance,
				shake_token: newShakeTokenBalance,
				punches: newPunchCount
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		// Record transactions
		const transactions = []

		// Class session cancellation
		if (bookedWithToken) {
			transactions.push({
				user_id: userId,
				name: `Cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'class session',
				amount: activityData.semi_private
					? '+1 semi-private token'
					: '+1 public token'
			})
		} else if (totalRefund > 0) {
			transactions.push({
				user_id: userId,
				name: `Cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'class session',
				amount: `+${activityData.credits} credits`
			})
		}

		// Regular items refund
		if (otherItemsTotalPrice > 0) {
			transactions.push({
				user_id: userId,
				name: `Refunded items for cancelled class session`,
				type: 'market transaction',
				amount: `+${otherItemsTotalPrice} credits`
			})
		}

		// Protein items handling
		if (shakeTokenRefund > 0) {
			transactions.push({
				user_id: userId,
				name: `Returned shake tokens for cancelled protein items`,
				type: 'market transaction',
				amount: `+${shakeTokenRefund} shake tokens`
			})
		}

		if (punchesToDeduct > 0) {
			transactions.push({
				user_id: userId,
				name: `Deducted punches from cancelled protein items`,
				type: 'punch card adjustment',
				amount: `-${punchesToDeduct} punches`
			})
		}

		if (shakeTokenPenalty > 0) {
			transactions.push({
				user_id: userId,
				name: 'Token penalty for cancelled loyalty reward',
				type: 'punch card penalty',
				amount: '-2 shake tokens'
			})
		}

		const { error: transactionError } = await supabase
			.from('transactions')
			.insert(transactions)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}

		// Handle email notifications
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('*')
			.eq('id', reservationData.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		const emailData = {
			user_name: userData.first_name + ' ' + userData.last_name,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_details: {
				credits: totalRefund > 0 ? totalRefund : null,
				class_token: bookedWithToken
					? activityData.semi_private
						? 'semi-private'
						: 'public'
					: null,
				shake_tokens:
					shakeTokenRefund > 0
						? {
								returned: shakeTokenRefund,
								penalty: shakeTokenPenalty
						  }
						: null,
				punches_deducted: punchesToDeduct
			}
		}

		// Send emails
		await Promise.all([
			fetch('/api/send-cancel-admin', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailData)
			}),
			fetch('/api/send-cancel-user', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(emailData)
			})
		])

		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)

		// Create success message
		let message = 'Group reservation cancelled successfully.'
		if (shakeTokenPenalty > 0) {
			message = `Group reservation cancelled. ${shakeTokenRefund} shake tokens returned. 2 tokens deducted as loyalty reward penalty.`
		} else if (shakeTokenRefund > 0) {
			message = `Group reservation cancelled. ${shakeTokenRefund} shake tokens returned.`
		}

		return {
			success: true,
			message
		}
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return {
			success: false,
			error: error.message
		}
	}
}
