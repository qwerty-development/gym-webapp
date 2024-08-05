import { supabaseClient } from '../supabaseClient'
export const cancelGroupBooking = async timeSlotId => {
	const supabase = await supabaseClient()

	// Fetch existing group time slot data
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select(
			'user_id, count, activity_id, additions, coach_id, date, start_time, end_time, booked_with_token'
		)
		.eq('id', timeSlotId)
		.single()

	if (existingSlotError) {
		console.error(
			'Error fetching existing group time slot:',
			existingSlotError.message
		)
		return { success: false, error: existingSlotError.message }
	}

	if (!existingSlot) {
		return { success: false, error: 'Group Time Slot not found.' }
	}

	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('credits, name, semi_private')
		.eq('id', existingSlot.activity_id)
		.single()

	if (activityError || !activityData) {
		console.error(
			'Error fetching activity data:',
			activityError?.message || 'Activity not found'
		)
		return {
			success: false,
			error: activityError?.message || 'Activity not found'
		}
	}

	const activityCredits = activityData.credits

	// Fetch coach data
	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('name, email')
		.eq('id', existingSlot.coach_id)
		.single()

	if (coachError) {
		console.error('Error fetching coach data:', coachError.message)
		return { success: false, error: coachError.message }
	}

	// Process refunds and send emails to all users in the user_id array
	for (const userId of existingSlot.user_id) {
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'wallet, isFree, first_name, last_name, email, public_token, semiPrivate_token'
			)
			.eq('user_id', userId)
			.single()

		if (userError || !userData) {
			console.error(
				`Error fetching user data for user ${userId}:`,
				userError?.message || 'User not found'
			)
			continue
		}

		const bookedWithToken = existingSlot.booked_with_token.includes(userId)
		let totalRefund = 0
		let newPublicTokenBalance = userData.public_token
		let newSemiPrivateTokenBalance = userData.semiPrivate_token

		if (bookedWithToken) {
			if (activityData.semi_private) {
				newSemiPrivateTokenBalance += 1
			} else {
				newPublicTokenBalance += 1
			}
		} else if (!userData.isFree) {
			totalRefund += activityCredits
		}

		// Check if user has any additions
		const userAddition = existingSlot.additions.find(
			addition => addition.user_id === userId
		)
		let additionsTotalPrice = 0
		if (userAddition) {
			additionsTotalPrice = userAddition.items.reduce(
				(total, item) => total + item.price,
				0
			)
			totalRefund += additionsTotalPrice

			for (const item of userAddition.items) {
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
			console.error(
				`Error updating user data for user ${userId}:`,
				userUpdateError.message
			)
		}

		// Create transaction for class session cancellation
		const sessionTransactionData = {
			user_id: userId,
			name: `Cancelled ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: bookedWithToken
				? activityData.semi_private
					? '+1 semi-private token'
					: '+1 public token'
				: `+${activityCredits} credits`
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

		// Create transaction for market items refund if applicable
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
		// Prepare email data for each user
		const emailData = {
			user_name: `${userData.first_name} ${userData.last_name}`,
			user_email: userData.email,
			activity_name: activityData.name,
			activity_date: existingSlot.date,
			start_time: existingSlot.start_time,
			end_time: existingSlot.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_type: bookedWithToken
				? activityData.semi_private
					? 'semi-private token'
					: 'public token'
				: 'credits',
			refund_amount: bookedWithToken ? 1 : totalRefund
		}

		// Send cancellation email to user
		try {
			const responseUser = await fetch('/api/send-cancel-user', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(emailData)
			})

			if (!responseUser.ok) {
				const resultUser = await responseUser.json()
				console.error(
					`Failed to send user cancellation email: ${resultUser.error}`
				)
			}
		} catch (error) {
			console.error('Error sending user cancellation email:', error)
		}
	}

	// Update the group time slot to clear users and reset count
	const { data, error } = await supabase
		.from('group_time_slots')
		.update({
			user_id: [],
			count: 0,
			booked: false,
			additions: [],
			booked_with_token: []
		})
		.eq('id', timeSlotId)

	if (error) {
		console.error('Error updating group time slot:', error.message)
		return { success: false, error: error.message }
	}

	// Send cancellation email to admin
	const adminEmailData = {
		activity_name: activityData.name,
		activity_date: existingSlot.date,
		start_time: existingSlot.start_time,
		end_time: existingSlot.end_time,
		coach_name: coachData.name,
		coach_email: coachData.email,
		cancelled_users: existingSlot.count
	}

	try {
		const responseAdmin = await fetch('/api/send-cancel-admin', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(adminEmailData)
		})

		if (!responseAdmin.ok) {
			const resultAdmin = await responseAdmin.json()
			console.error(
				`Failed to send admin cancellation email: ${resultAdmin.error}`
			)
		}
	} catch (error) {
		console.error('Error sending admin cancellation email:', error)
	}

	return { success: true, data }
}

export const cancelBookingIndividual = async reservation => {
	const supabase = await supabaseClient()

	try {
		// Fetch reservation details
		const { data: reservationData, error: reservationError } = await supabase
			.from('time_slots')
			.select(
				'additions, coach_id, date, start_time, end_time, booked_with_token, activity_id'
			)
			.eq('id', reservation.id)
			.single()

		if (reservationError || !reservationData) {
			throw new Error(reservationError?.message || 'Reservation not found')
		}

		// Fetch additions prices from the market table
		const { data: additionsData, error: additionsError } = await supabase
			.from('market')
			.select('id, name, price, quantity')
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
		for (const item of additionsData) {
			const newQuantity = (item.quantity || 0) + 1

			const { error: updateError } = await supabase
				.from('market')
				.update({ quantity: newQuantity })
				.eq('id', item.id)

			if (updateError) {
				console.error('Error updating item quantity:', updateError.message)
				// You might want to handle this error more gracefully
			}
		}

		// Fetch user data
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('isFree, first_name, last_name, email, wallet, private_token')
			.eq('user_id', reservation.user?.user_id)
			.single()

		if (userError || !userData) {
			throw new Error(
				`Error fetching user data: ${userError?.message || 'User not found'}`
			)
		}

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity data: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		let totalCreditRefund = additionsTotalPrice
		let tokenRefund = 0

		if (reservationData.booked_with_token) {
			tokenRefund = 1
		} else if (!userData.isFree) {
			totalCreditRefund += activityData.credits
		}

		const updatedSlot = {
			id: reservation.id,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			date: reservationData.date,
			activity_id: reservationData.activity_id,
			coach_id: reservationData.coach_id,
			user_id: null,
			booked: false,
			additions: [],
			booked_with_token: false
		}

		// Update the time slot
		const { error: updateError } = await supabase
			.from('time_slots')
			.update(updatedSlot)
			.eq('id', reservation.id)

		if (updateError) {
			throw new Error(`Failed to cancel booking: ${updateError.message}`)
		}

		// Update user's wallet and tokens
		const newWalletBalance = userData.wallet + totalCreditRefund
		const newTokenBalance = userData.private_token + tokenRefund

		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newTokenBalance
			})
			.eq('user_id', reservation.user?.user_id)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		// Record transactions
		const sessionTransactionData = {
			user_id: reservation.user?.user_id,
			name: `Cancelled individual session: ${reservation.activity?.name}`,
			type: 'individual session',
			amount: reservationData.booked_with_token
				? '+1 private token'
				: userData.isFree
				? '0 credits (free session)'
				: `+${activityData.credits} credits`
		}

		const { error: sessionTransactionError } = await supabase
			.from('transactions')
			.insert(sessionTransactionData)

		if (sessionTransactionError) {
			console.error(
				'Error recording session cancellation transaction:',
				sessionTransactionError.message
			)
		}

		// Add transaction record for refunded additions (if any)
		if (additionsTotalPrice > 0) {
			const marketTransactionData = {
				user_id: reservation.user?.user_id,
				name: `Refunded market items for cancelled session: ${reservation.activity?.name}`,
				type: 'market transaction',
				amount: `+${additionsTotalPrice} credits`
			}

			const { error: marketTransactionError } = await supabase
				.from('transactions')
				.insert(marketTransactionData)

			if (marketTransactionError) {
				console.error(
					'Error recording market refund transaction:',
					marketTransactionError.message
				)
			}
		}

		// Fetch coach data
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name, email')
			.eq('id', reservationData.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		// Prepare email data
		const emailData = {
			user_name: `${userData.first_name} ${userData.last_name}`,
			user_email: userData.email,
			activity_name: reservation.activity?.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_type: reservationData.booked_with_token ? 'token' : 'credits',
			refund_amount: reservationData.booked_with_token
				? tokenRefund
				: totalCreditRefund
		}

		// Send cancellation emails
		await sendCancellationEmails(emailData)

		console.log('Booking cancelled successfully.')
		return { success: true }
	} catch (error) {
		console.error('Error cancelling booking:', error)
		return { success: false, error }
	}
}

async function sendCancellationEmails(emailData) {
	try {
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
	} catch (error) {
		console.error('Error sending cancellation emails:', error)
	}
}
