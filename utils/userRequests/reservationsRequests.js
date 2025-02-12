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

		// Fetch activity data
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
		// If booked with token, refund 1 private token; if not free, refund credits.
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

		// Handle protein items: refund shake tokens and calculate punch adjustments
		const proteinItemsCount = proteinItems.length
		if (proteinItemsCount > 0) {
			shakeTokenRefund = proteinItemsCount
			if (userData.punches > 0) {
				punchesToDeduct = proteinItemsCount
				const newPunchCount = userData.punches - punchesToDeduct
				// If loyalty reward was achieved, apply penalty
				if (
					Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)
				) {
					shakeTokenPenalty = 2
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

		// Update market item quantities (return each refunded item)
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

			const { error: updateQtyError } = await supabase
				.from('market')
				.update({ quantity: newQuantity })
				.eq('id', item.id)

			if (updateQtyError) {
				throw new Error(
					`Error updating item quantity: ${updateQtyError.message}`
				)
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

		// Prepare new transaction records using the new system

		// Session cancellation transaction
		let sessionTx
		if (reservationData.booked_with_token) {
			sessionTx = {
				user_id,
				currency: 'private_token',
				amount: 1, // refund 1 token
				type: 'individual_cancel_token',
				description: `Cancelled individual session: ${activityData.name}`
			}
		} else if (!userData.isFree) {
			sessionTx = {
				user_id,
				currency: 'credits',
				amount: activityData.credits,
				type: 'individual_cancel_credit',
				description: `Cancelled individual session: ${activityData.name}`
			}
		} else {
			sessionTx = {
				user_id,
				currency: 'none',
				amount: 0,
				type: 'individual_cancel_free',
				description: `Cancelled individual session (free user): ${activityData.name}`
			}
		}

		// Build an array of transactions
		const transactions = [sessionTx]

		// Regular items refund transaction (for non-protein additions)
		if (otherItemsTotalPrice > 0) {
			transactions.push({
				user_id,
				currency: 'credits',
				amount: otherItemsTotalPrice,
				type: 'market_refund',
				description: `Refunded items for cancelled session: ${activityData.name}`
			})
		}

		// Protein items refund transaction (shake tokens refund)
		if (shakeTokenRefund > 0) {
			transactions.push({
				user_id,
				currency: 'shake_token',
				amount: shakeTokenRefund,
				type: 'shake_token_refund',
				description: 'Returned shake tokens for cancelled protein items'
			})
		}

		// Punch deduction transaction
		if (punchesToDeduct > 0) {
			transactions.push({
				user_id,
				currency: 'punches',
				amount: -punchesToDeduct,
				type: 'punch_remove',
				description: 'Deducted punches from cancelled protein items'
			})
		}

		// Token penalty transaction
		if (shakeTokenPenalty > 0) {
			transactions.push({
				user_id,
				currency: 'shake_token',
				amount: -shakeTokenPenalty,
				type: 'loyalty_penalty',
				description: 'Token penalty for cancelled loyalty reward'
			})
		}

		// Insert all cancellation-related transactions into new_transactions
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactions)

		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}

		// Fetch coach data for email notifications
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
				credits: totalCreditRefund > 0 ? totalCreditRefund : null,
				class_token: reservationData.booked_with_token ? 'private' : null,
				shake_tokens:
					shakeTokenRefund > 0
						? { returned: shakeTokenRefund, penalty: shakeTokenPenalty }
						: null,
				punches_deducted: punchesToDeduct
			}
		}

		// Send email notifications
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

		// Return success message
		const message =
			shakeTokenPenalty > 0
				? `Reservation cancelled. ${shakeTokenRefund} shake tokens returned. 2 tokens deducted as loyalty reward penalty.`
				: `Reservation cancelled successfully.`

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

export const cancelReservationGroup = async (
	reservationId,
	userId,
	setReservations
) => {
	const supabase = await supabaseClient()

	try {
		// Fetch the group reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('group_time_slots')
			.select(
				'activity_id, user_id, booked, coach_id, date, start_time, end_time, additions, booked_with_token, capacity'
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
			.select('credits, name, semi_private, capacity')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity data: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Build the session cancellation transaction record
		const bookedWithToken = reservationData.booked_with_token.includes(userId)
		let sessionTx = null
		if (bookedWithToken) {
			if (activityData.semi_private) {
				sessionTx = {
					user_id,
					currency: 'semi_private_token',
					amount: 1, // refund 1 semi-private token
					type: 'semi_cancel_token',
					description: `Cancelled semi-private class session: ${activityData.name}`
				}
				newSemiPrivateTokenBalance += 1
			} else {
				sessionTx = {
					user_id,
					currency: 'public_token',
					amount: 1, // refund 1 public token
					type: 'group_cancel_token',
					description: `Cancelled public class session: ${activityData.name}`
				}
				newPublicTokenBalance += 1
			}
		} else {
			// Not booked with token: refund credits or mark free cancellation
			if (userData.isFree) {
				if (activityData.semi_private) {
					sessionTx = {
						user_id,
						currency: 'none',
						amount: 0,
						type: 'semi_cancel_free',
						description: `Cancelled semi-private class session (free user): ${activityData.name}`
					}
				} else {
					sessionTx = {
						user_id,
						currency: 'none',
						amount: 0,
						type: 'group_cancel_free',
						description: `Cancelled public class session (free user): ${activityData.name}`
					}
				}
			} else {
				if (activityData.semi_private) {
					sessionTx = {
						user_id,
						currency: 'credits',
						amount: activityData.credits,
						type: 'semi_cancel_credit',
						description: `Cancelled semi-private class session: ${activityData.name}`
					}
				} else {
					sessionTx = {
						user_id,
						currency: 'credits',
						amount: activityData.credits,
						type: 'group_cancel_credit',
						description: `Cancelled public class session: ${activityData.name}`
					}
				}
				totalRefund += activityData.credits
			}
		}

		// Process additions: filter out those for this user
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

		// Refund for non-protein items
		const otherItemsTotalPrice = otherItems.reduce(
			(total, item) => total + item.price,
			0
		)
		totalRefund += otherItemsTotalPrice

		// Handle protein items: refund shake tokens and adjust punch count
		const proteinItemsCount = proteinItems.length
		if (proteinItemsCount > 0) {
			shakeTokenRefund = proteinItemsCount
			if (userData.punches > 0) {
				punchesToDeduct = proteinItemsCount
				const newPunchCount = userData.punches - punchesToDeduct
				if (
					Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)
				) {
					shakeTokenPenalty = 2
				}
			}
		}
		newShakeTokenBalance =
			userData.shake_token + shakeTokenRefund - shakeTokenPenalty

		// Update group time slot data: remove the cancelling user from user lists
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

		// Update market item quantities for each addition in userAdditions
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

		// Prepare transaction records array. Start with the session cancellation record.
		const transactions = [sessionTx]

		// Refund for non-protein additions (market refund)
		if (otherItemsTotalPrice > 0) {
			transactions.push({
				user_id,
				currency: 'credits',
				amount: otherItemsTotalPrice,
				type: 'market_refund',
				description: `Refunded items for cancelled class session: ${activityData.name}`
			})
		}

		// Refund for protein items (shake token refund)
		if (shakeTokenRefund > 0) {
			transactions.push({
				user_id,
				currency: 'shake_token',
				amount: shakeTokenRefund,
				type: 'shake_token_refund',
				description: 'Returned shake tokens for cancelled protein items'
			})
		}

		// Punch deduction transaction
		if (punchesToDeduct > 0) {
			transactions.push({
				user_id,
				currency: 'punches',
				amount: -punchesToDeduct,
				type: 'punch_remove',
				description: 'Deducted punches from cancelled protein items'
			})
		}

		// Token penalty transaction
		if (shakeTokenPenalty > 0) {
			transactions.push({
				user_id,
				currency: 'shake_token',
				amount: -shakeTokenPenalty,
				type: 'loyalty_penalty',
				description: 'Token penalty for cancelled loyalty reward'
			})
		}

		// Insert all cancellation transactions into new_transactions table
		const { error: transactionError } = await supabase
			.from('new_transactions')
			.insert(transactions)
		if (transactionError) {
			console.error('Error recording transactions:', transactionError.message)
		}

		// Fetch coach data for email notifications
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('*')
			.eq('id', reservationData.coach_id)
			.single()
		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		const emailData = {
			user_name: `${userData.first_name} ${userData.last_name}`,
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
						? 'semi_private'
						: 'public'
					: null,
				shake_tokens:
					shakeTokenRefund > 0
						? { returned: shakeTokenRefund, penalty: shakeTokenPenalty }
						: null,
				punches_deducted: punchesToDeduct
			}
		}

		// Send cancellation emails to admin and user
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

		// Compose success message
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
		console.error('Error cancelling reservation:', error)
		return {
			success: false,
			error: error.message || 'Failed to cancel group reservation'
		}
	}
}
