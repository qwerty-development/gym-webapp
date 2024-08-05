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

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('wallet, first_name, last_name, email, isFree, private_token')
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

		// Fetch the additions and calculate their total price
		const { data: additionsData, error: additionsError } = await supabase
			.from('market')
			.select('id, name, price')
			.in('name', reservationData.additions || [])

		if (additionsError) {
			throw new Error(
				`Error fetching additions data: ${additionsError.message}`
			)
		}

		const additionsTotalPrice = additionsData.reduce(
			(total, item) => total + item.price,
			0
		)
		totalCreditRefund += additionsTotalPrice

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

		// Increment the quantity of refunded items
		// Increment the quantity of refunded items
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
				console.error('Error updating item quantity:', updateError.message)
				throw new Error(`Error updating item quantity: ${updateError.message}`)
				// You might want to handle this error more gracefully
			}
		}

		// Update the user's wallet and/or tokens
		const newWalletBalance = userData.wallet + totalCreditRefund
		const newTokenBalance = userData.private_token + tokenRefund

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newTokenBalance
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled individual session: ${activityData.name}`,
			type: 'individual session',
			amount: reservationData.booked_with_token
				? '+1 private token'
				: `+${activityData.credits} credits`
		}

		const { error: sessionTransactionError } = await supabase
			.from('transactions')
			.insert(sessionTransactionData)

		if (sessionTransactionError) {
			console.error(
				'Error recording session transaction:',
				sessionTransactionError.message
			)
		}

		// Add transaction record for market item refunds
		if (additionsTotalPrice > 0) {
			const marketTransactionData = {
				user_id: userId,
				name: `Refunded market items for cancelled session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${additionsTotalPrice} credits`
			}

			const { error: marketTransactionError } = await supabase
				.from('transactions')
				.insert(marketTransactionData)

			if (marketTransactionError) {
				console.error(
					'Error recording market transaction:',
					marketTransactionError.message
				)
			}
		}

		// Fetch coach data
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
			refund_amount: reservationData.booked_with_token ? 1 : totalCreditRefund
		}

		// Send cancellation email to admin
		const responseAdmin = await fetch('/api/send-cancel-admin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		if (!responseAdmin.ok) {
			const resultAdmin = await responseAdmin.json()
			throw new Error(
				`Failed to send admin cancellation email: ${resultAdmin.error}`
			)
		}

		// Send cancellation email to user
		const responseUser = await fetch('/api/send-cancel-user', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		if (!responseUser.ok) {
			const resultUser = await responseUser.json()
			throw new Error(
				`Failed to send user cancellation email: ${resultUser.error}`
			)
		}

		// Update reservations state
		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)
		return true
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return false
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

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'wallet, first_name, last_name, email, isFree, public_token, semiPrivate_token'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

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

		// Check if the user booked with a token
		const bookedWithToken = reservationData.booked_with_token.includes(userId)

		// Initialize total refund amount and new token balances
		let totalRefund = 0
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token

		// Determine refund type
		let refundType = 'credits'
		if (bookedWithToken) {
			if (activityData.semi_private) {
				refundType = 'semiPrivateToken'
				newSemiPrivateTokenBalance += 1
			} else {
				refundType = 'publicToken'
				newPublicTokenBalance += 1
			}
		} else if (!userData.isFree) {
			totalRefund += activityData.credits
		}

		// Calculate total additions refund
		const userAdditions = reservationData.additions.filter(
			addition => addition.user_id === userId
		)
		const additionsTotalPrice = userAdditions.reduce(
			(total, addition) =>
				total +
				addition.items.reduce((itemTotal, item) => itemTotal + item.price, 0),
			0
		)
		totalRefund += additionsTotalPrice

		// Remove user's additions from the additions array
		const updatedAdditions = reservationData.additions.filter(
			addition => addition.user_id !== userId
		)

		// Remove user from the user_id array
		const updatedUserIds = reservationData.user_id.filter(id => id !== userId)
		const newCount = updatedUserIds.length
		const isBooked = newCount >= activityData.capacity

		// Remove user from the booked_with_token array
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

		// Increment the quantity of refunded items
		for (const addition of userAdditions) {
			for (const item of addition.items) {
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
					console.error('Error updating item quantity:', updateError.message)
					// You might want to handle this error more gracefully
					throw new Error(
						`Error updating item quantity: ${updateError.message}`
					)
				}
			}
		}
		const newWalletBalance = userData.wallet + totalRefund

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				public_token: newPublicTokenBalance,
				semiPrivate_token: newSemiPrivateTokenBalance
			})
			.eq('user_id', userId)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		let sessionTransactionAmount = ''
		if (refundType === 'credits') {
			sessionTransactionAmount = `+${activityData.credits} credits`
		} else if (refundType === 'semiPrivateToken') {
			sessionTransactionAmount = '+1 semi-private token'
		} else if (refundType === 'publicToken') {
			sessionTransactionAmount = '+1 public token'
		}

		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: sessionTransactionAmount
		}

		const { error: sessionTransactionError } = await supabase
			.from('transactions')
			.insert(sessionTransactionData)

		if (sessionTransactionError) {
			console.error(
				'Error recording session transaction:',
				sessionTransactionError.message
			)
		}

		// Add transaction record for market item refunds
		if (additionsTotalPrice > 0) {
			const marketTransactionData = {
				user_id: userId,
				name: `Refunded market items for cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${additionsTotalPrice} credits`
			}

			const { error: marketTransactionError } = await supabase
				.from('transactions')
				.insert(marketTransactionData)

			if (marketTransactionError) {
				console.error(
					'Error recording market transaction:',
					marketTransactionError.message
				)
			}
		}
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
			refund_type: refundType,
			refund_amount: refundType === 'credits' ? totalRefund : 1
		}

		const responseAdmin = await fetch('/api/send-cancel-admin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		if (!responseAdmin.ok) {
			const resultAdmin = await responseAdmin.json()
			throw new Error(
				`Failed to send admin cancellation email: ${resultAdmin.error}`
			)
		}

		const responseUser = await fetch('/api/send-cancel-user', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		if (!responseUser.ok) {
			const resultUser = await responseUser.json()
			throw new Error(
				`Failed to send user cancellation email: ${resultUser.error}`
			)
		}
		setReservations(prevReservations =>
			prevReservations.filter(reservation => reservation.id !== reservationId)
		)
		return true
	} catch (error) {
		console.error('Cancel reservation error:', error)
		return false
	}
}
