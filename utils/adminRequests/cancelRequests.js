import { supabaseClient } from '../supabaseClient'
export const cancelGroupBooking = async timeSlotId => {
	const supabase = await supabaseClient()

	try {
		// Fetch existing group time slot data
		const { data: existingSlot, error: existingSlotError } = await supabase
			.from('group_time_slots')
			.select(
				'user_id, count, activity_id, additions, coach_id, date, start_time, end_time, booked_with_token'
			)
			.eq('id', timeSlotId)
			.single()

		if (existingSlotError || !existingSlot) {
			throw new Error(existingSlotError?.message || 'Group Time Slot not found')
		}

		// Fetch activity data
		const { data: activityData, error: activityError } = await supabase
			.from('activities')
			.select('credits, name, semi_private')
			.eq('id', existingSlot.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(activityError?.message || 'Activity not found')
		}

		// Fetch coach data
		const { data: coachData, error: coachError } = await supabase
			.from('coaches')
			.select('name, email')
			.eq('id', existingSlot.coach_id)
			.single()

		if (coachError) {
			throw new Error(`Error fetching coach data: ${coachError.message}`)
		}

		// Process refunds for all users
		for (const userId of existingSlot.user_id) {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select(
					'wallet, isFree, first_name, last_name, email, public_token, semiPrivate_token, shake_token, punches'
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

			// Initialize refund variables
			let totalRefund = 0
			let newPublicTokenBalance = userData.public_token
			let newSemiPrivateTokenBalance = userData.semiPrivate_token
			let newShakeTokenBalance = userData.shake_token
			let shakeTokenRefund = 0
			let shakeTokenPenalty = 0
			let punchesToDeduct = 0

			// Handle session token refund
			const bookedWithToken = existingSlot.booked_with_token.includes(userId)
			if (bookedWithToken) {
				if (activityData.semi_private) {
					newSemiPrivateTokenBalance += 1
				} else {
					newPublicTokenBalance += 1
				}
			} else if (!userData.isFree) {
				totalRefund += activityData.credits
			}

			// Handle additions
			const userAddition = existingSlot.additions.find(
				addition => addition.user_id === userId
			)

			if (userAddition) {
				// Separate protein items from other items
				const proteinItems = userAddition.items.filter(
					item =>
						item.name.toLowerCase().includes('protein shake') ||
						item.name.toLowerCase().includes('protein pudding')
				)
				const otherItems = userAddition.items.filter(
					item =>
						!item.name.toLowerCase().includes('protein shake') &&
						!item.name.toLowerCase().includes('protein pudding')
				)

				// Handle regular items refund
				const otherItemsTotalPrice = otherItems.reduce(
					(total, item) => total + item.price,
					0
				)
				totalRefund += otherItemsTotalPrice

				// Handle protein items
				const proteinItemsCount = proteinItems.length
				if (proteinItemsCount > 0) {
					shakeTokenRefund = proteinItemsCount

					// Handle punch card
					if (userData.punches > 0) {
						punchesToDeduct = proteinItemsCount
						const newPunchCount = userData.punches - punchesToDeduct

						// Check for loyalty reward penalty
						if (
							Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)
						) {
							shakeTokenPenalty = 2
						}
					}
				}

				// Update market quantities
				for (const item of userAddition.items) {
					const { data: marketItem, error: quantityError } = await supabase
						.from('market')
						.select('quantity')
						.eq('id', item.id)
						.single()

					if (!quantityError && marketItem) {
						const newQuantity = (marketItem.quantity || 0) + 1
						await supabase
							.from('market')
							.update({ quantity: newQuantity })
							.eq('id', item.id)
					}
				}
			}

			// Calculate final balances
			const newWalletBalance = userData.wallet + totalRefund
			const finalShakeTokenBalance =
				newShakeTokenBalance + shakeTokenRefund - shakeTokenPenalty
			const newPunchCount = Math.max(0, userData.punches - punchesToDeduct)

			// Update user balances
			const { error: userUpdateError } = await supabase
				.from('users')
				.update({
					wallet: newWalletBalance,
					public_token: newPublicTokenBalance,
					semiPrivate_token: newSemiPrivateTokenBalance,
					shake_token: finalShakeTokenBalance,
					punches: newPunchCount
				})
				.eq('user_id', userId)

			if (userUpdateError) {
				console.error(
					`Error updating user data for ${userId}:`,
					userUpdateError.message
				)
				continue
			}

			// Record transactions
			const transactions = []

			// Session cancellation transaction
			transactions.push({
				user_id: userId,
				name: `Cancelled ${
					activityData.semi_private ? 'semi-private' : 'public'
				} class session: ${activityData.name}`,
				type: 'class session',
				amount: bookedWithToken
					? activityData.semi_private
						? '+1 semi-private token'
						: '+1 public token'
					: `+${activityData.credits} credits`
			})

			// Regular items refund transaction
			if (totalRefund > 0) {
				transactions.push({
					user_id: userId,
					name: 'Refunded regular items from cancelled session',
					type: 'market transaction',
					amount: `+${totalRefund} credits`
				})
			}

			// Protein items transactions
			if (shakeTokenRefund > 0) {
				transactions.push({
					user_id: userId,
					name: 'Returned shake tokens for cancelled protein items',
					type: 'market transaction',
					amount: `+${shakeTokenRefund} shake tokens`
				})
			}

			if (punchesToDeduct > 0) {
				transactions.push({
					user_id: userId,
					name: 'Deducted punches from cancelled protein items',
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

			await supabase.from('transactions').insert(transactions)

			// Send cancellation email
			const emailData = {
				user_name: `${userData.first_name} ${userData.last_name}`,
				user_email: userData.email,
				activity_name: activityData.name,
				activity_date: existingSlot.date,
				start_time: existingSlot.start_time,
				end_time: existingSlot.end_time,
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

			try {
				await fetch('/api/send-cancel-user', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(emailData)
				})
			} catch (error) {
				console.error('Error sending cancellation email:', error)
			}
		}

		// Update the group time slot
		const { error: updateError } = await supabase
			.from('group_time_slots')
			.update({
				user_id: [],
				count: 0,
				booked: false,
				additions: [],
				booked_with_token: []
			})
			.eq('id', timeSlotId)

		if (updateError) {
			throw new Error(`Error updating group time slot: ${updateError.message}`)
		}

		// Create success message
		let message =
			'Group session cancelled successfully. All participants have been notified.'

		return {
			success: true,
			message,
			data: existingSlot
		}
	} catch (error) {
		console.error('Error cancelling group booking:', error)
		return {
			success: false,
			error: error.message || 'Failed to cancel group booking'
		}
	}
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

		// Fetch additions from market including prices
		const { data: additionsData, error: additionsError } = await supabase
			.from('market')
			.select('id, name, price, quantity')
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

		// Calculate regular refunds
		const otherItemsTotalPrice = otherItems.reduce(
			(total, item) => total + item.price,
			0
		)

		// Increment quantities for all items
		for (const item of additionsData) {
			const newQuantity = (item.quantity || 0) + 1
			await supabase
				.from('market')
				.update({ quantity: newQuantity })
				.eq('id', item.id)
		}

		// Fetch user data including punches
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select(
				'isFree, first_name, last_name, email, wallet, private_token, shake_token, punches'
			)
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
			.select('credits, name')
			.eq('id', reservationData.activity_id)
			.single()

		if (activityError || !activityData) {
			throw new Error(
				`Error fetching activity data: ${
					activityError?.message || 'Activity not found'
				}`
			)
		}

		// Initialize refund variables
		let totalCreditRefund = otherItemsTotalPrice
		let tokenRefund = 0
		let shakeTokenRefund = proteinItems.length
		let punchesToDeduct = proteinItems.length
		let shakeTokenPenalty = 0

		// Handle session refund
		if (reservationData.booked_with_token) {
			tokenRefund = 1
		} else if (!userData.isFree) {
			totalCreditRefund += activityData.credits
		}

		// Handle punch card logic for protein items
		if (punchesToDeduct > 0 && userData.punches > 0) {
			const newPunchCount = userData.punches - punchesToDeduct
			// Check if user benefited from loyalty reward
			if (Math.floor(userData.punches / 10) > Math.floor(newPunchCount / 10)) {
				shakeTokenPenalty = 2 // Deduct 2 tokens as penalty
			}
		}

		// Update user balances
		const newWalletBalance = userData.wallet + totalCreditRefund
		const newTokenBalance = userData.private_token + tokenRefund
		const newShakeTokenBalance =
			userData.shake_token + shakeTokenRefund - shakeTokenPenalty
		const newPunchCount = Math.max(0, userData.punches - punchesToDeduct)

		// Update time slot
		const { error: updateError } = await supabase
			.from('time_slots')
			.update({
				user_id: null,
				booked: false,
				additions: [],
				booked_with_token: false
			})
			.eq('id', reservation.id)

		if (updateError) {
			throw new Error(`Failed to cancel booking: ${updateError.message}`)
		}

		// Update user data
		const { error: userUpdateError } = await supabase
			.from('users')
			.update({
				wallet: newWalletBalance,
				private_token: newTokenBalance,
				shake_token: newShakeTokenBalance,
				punches: newPunchCount
			})
			.eq('user_id', reservation.user?.user_id)

		if (userUpdateError) {
			throw new Error(`Error updating user data: ${userUpdateError.message}`)
		}

		// Record transactions
		const transactions = []

		// Session cancellation transaction
		transactions.push({
			user_id: reservation.user?.user_id,
			name: `Cancelled individual session: ${activityData.name}`,
			type: 'individual session',
			amount: reservationData.booked_with_token
				? '+1 private token'
				: userData.isFree
				? '0 credits (free session)'
				: `+${activityData.credits} credits`
		})

		// Regular items refund transaction
		if (otherItemsTotalPrice > 0) {
			transactions.push({
				user_id: reservation.user?.user_id,
				name: `Refunded regular items for cancelled session: ${activityData.name}`,
				type: 'market transaction',
				amount: `+${otherItemsTotalPrice} credits`
			})
		}

		// Protein items transactions
		if (shakeTokenRefund > 0) {
			transactions.push({
				user_id: reservation.user?.user_id,
				name: `Returned shake tokens for cancelled protein items`,
				type: 'market transaction',
				amount: `+${shakeTokenRefund} shake tokens`
			})
		}

		if (punchesToDeduct > 0) {
			transactions.push({
				user_id: reservation.user?.user_id,
				name: `Deducted punches from cancelled protein items`,
				type: 'punch card adjustment',
				amount: `-${punchesToDeduct} punches`
			})
		}

		if (shakeTokenPenalty > 0) {
			transactions.push({
				user_id: reservation.user?.user_id,
				name: 'Token penalty for cancelled loyalty reward',
				type: 'punch card penalty',
				amount: '-2 shake tokens'
			})
		}

		await supabase.from('transactions').insert(transactions)

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
			activity_name: activityData.name,
			activity_date: reservationData.date,
			start_time: reservationData.start_time,
			end_time: reservationData.end_time,
			coach_name: coachData.name,
			coach_email: coachData.email,
			refund_details: {
				credits: totalCreditRefund > 0 ? totalCreditRefund : null,
				private_token: tokenRefund > 0 ? tokenRefund : null,
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

		// Send cancellation emails
		await sendCancellationEmails(emailData)

		// Create success message
		let message = 'Session cancelled successfully.'
		if (shakeTokenPenalty > 0) {
			message = `Session cancelled. ${shakeTokenRefund} shake tokens returned. 2 tokens deducted as loyalty reward penalty.`
		} else if (shakeTokenRefund > 0) {
			message = `Session cancelled. ${shakeTokenRefund} shake tokens returned.`
		}

		return {
			success: true,
			message
		}
	} catch (error) {
		console.error('Error cancelling booking:', error)
		return {
			success: false,
			error: error.message
		}
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
