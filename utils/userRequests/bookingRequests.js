import { supabaseClient } from '../supabaseClient'



export const bookTimeSlot = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Check if the time slot is already booked
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('time_slots')
		.select('booked')
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime,
			end_time: endTime
		})
		.single()

	if (existingSlotError) {
		console.error(
			'Error checking time slot availability:',
			existingSlotError.message
		)
		return { error: existingSlotError.message }
	}

	if (existingSlot && existingSlot.booked) {
		return { error: 'Time slot is already booked.' }
	}

	// Fetch user data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Fetch activity data
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity data:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	let bookingMethod = 'credits'
	let newWalletBalance = userData.wallet
	let newTokenBalance = userData.private_token
	let transactionAmount = ''

	// Special handling for Ice Bath - only accept credits
	if (activityData.name === 'Ice Bath') {
		if (userData.isFree || userData.wallet >= activityData.credits) {
			if (!userData.isFree) {
				newWalletBalance -= activityData.credits
				transactionAmount = `-${activityData.credits} credits`
			} else {
				transactionAmount = '0 credits (free user)'
			}
		} else {
			return {
				error:
					'Ice Bath sessions can only be booked using credits. Not enough credits available.'
			}
		}
	} else {
		// Normal booking logic for other activities
		if (userData.private_token > 0) {
			bookingMethod = 'token'
			newTokenBalance -= 1
			transactionAmount = '-1 private token'
		} else if (userData.isFree || userData.wallet >= activityData.credits) {
			if (!userData.isFree) {
				newWalletBalance -= activityData.credits
				transactionAmount = `-${activityData.credits} credits`
			} else {
				transactionAmount = '0 credits (free user)'
			}
		} else {
			return { error: 'Not enough credits or tokens to book the session.' }
		}
	}

	// Proceed with booking the time slot
	const { data: timeSlotData, error: timeSlotError } = await supabase
		.from('time_slots')
		.update({
			user_id: userId,
			booked: true,
			booked_with_token: bookingMethod === 'token'
		})
		.match({
			activity_id: activityId,
			coach_id: coachId,
			date: date,
			start_time: startTime,
			end_time: endTime
		})

	if (timeSlotError) {
		console.error('Error booking time slot:', timeSlotError.message)
		return { error: timeSlotError.message }
	}

	await deleteConflictingTimeSlots(supabase, coachId, date, startTime, endTime)

	// Update user's account (wallet or tokens)
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			private_token: newTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Add transaction record
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Booked individual session: ${activityData.name}`,
			type: 'individual session',
			amount: transactionAmount
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the booking was successful
	}

	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('*')
		.eq('id', coachId)
		.single()

	if (coachError || !coachData) {
		console.error('Error fetching coach data:', coachError?.message)
		return { error: coachError?.message || 'Coach not found.' }
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		activity_name: activityData.name,
		activity_price:
			bookingMethod === 'token'
				? '1 token'
				: userData.isFree
				? 0
				: activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		coach_email: coachData.email,
		user_wallet: newWalletBalance,
		user_tokens: newTokenBalance,
		booking_method: bookingMethod
	}

	// Send email notification to admin
	try {
		const responseAdmin = await fetch('/api/send-admin-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultAdmin = await responseAdmin.json()
		if (responseAdmin.ok) {
			console.log('Admin email sent successfully')
		} else {
			console.error(`Failed to send admin email: ${resultAdmin.error}`)
		}
	} catch (error) {
		console.error('Error sending admin email:', error)
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-user-email', {
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

	return {
		data: timeSlotData,
		message: `Session booked successfully using ${bookingMethod}.`
	}
}

export const bookTimeSlotGroup = async ({
	activityId,
	coachId,
	date,
	startTime,
	endTime,
	userId
}) => {
	const supabase = await supabaseClient()

	// Check if the time slot is already booked
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select('id, booked, user_id, count, booked_with_token')
		.eq('activity_id', activityId)
		.eq('coach_id', coachId)
		.eq('date', date)
		.eq('start_time', startTime)
		.eq('end_time', endTime)
		.single()

	if (existingSlotError && existingSlotError.code !== 'PGRST116') {
		console.error(
			'Error checking group time slot availability:',
			existingSlotError.message
		)
		return { error: existingSlotError.message }
	}

	if (existingSlot && existingSlot.booked) {
		return { error: 'Time slot is already fully booked.' }
	}

	if (
		existingSlot &&
		existingSlot.user_id &&
		existingSlot.user_id.includes(userId)
	) {
		return { error: 'You are already enrolled in this class.' }
	}

	// Fetch user data
	const { data: userData, error: userError } = await supabase
		.from('users')
		.select('*')
		.eq('user_id', userId)
		.single()

	if (userError || !userData) {
		console.error('Error fetching user data:', userError?.message)
		return { error: userError?.message || 'User not found.' }
	}

	// Fetch activity details including capacity, credits required, and semi-private status
	const { data: activityData, error: activityError } = await supabase
		.from('activities')
		.select('*')
		.eq('id', activityId)
		.single()

	if (activityError || !activityData) {
		console.error('Error fetching activity details:', activityError?.message)
		return { error: activityError?.message || 'Activity not found.' }
	}

	let bookingMethod = 'credits'
	let newWalletBalance = userData.wallet
	let newPublicTokenBalance = userData.public_token
	let newSemiPrivateTokenBalance = userData.semiPrivate_token
	let transactionAmount = ''

	if (activityData.semi_private && userData.semiPrivate_token > 0) {
		bookingMethod = 'semiPrivateToken'
		newSemiPrivateTokenBalance -= 1
		transactionAmount = '-1 semi-private token'
	} else if (!activityData.semi_private && userData.public_token > 0) {
		bookingMethod = 'publicToken'
		newPublicTokenBalance -= 1
		transactionAmount = '-1 public token'
	} else if (userData.isFree || userData.wallet >= activityData.credits) {
		if (!userData.isFree) {
			newWalletBalance -= activityData.credits
			transactionAmount = `-${activityData.credits} credits`
		} else {
			transactionAmount = '0 credits (free user)'
		}
	} else {
		return { error: 'Not enough credits or tokens to book the session.' }
	}

	let newCount = 1
	let user_id = [userId]
	let isBooked = false
	let slotId
	let booked_with_token = []

	if (existingSlot) {
		newCount = existingSlot.count + 1
		user_id = existingSlot.user_id
			? [...existingSlot.user_id, userId]
			: [userId]
		isBooked = newCount === activityData.capacity
		slotId = existingSlot.id
		booked_with_token = existingSlot.booked_with_token || []
	}

	if (bookingMethod === 'publicToken' || bookingMethod === 'semiPrivateToken') {
		booked_with_token.push(userId)
	}

	const upsertData = {
		activity_id: activityId,
		coach_id: coachId,
		date: date,
		start_time: startTime,
		end_time: endTime,
		user_id,
		count: newCount,
		booked: isBooked,
		booked_with_token
	}

	let timeSlotData, timeSlotError

	if (slotId) {
		// Update existing slot
		;({ data: timeSlotData, error: timeSlotError } = await supabase
			.from('group_time_slots')
			.update(upsertData)
			.eq('id', slotId))
	} else {
		// Insert new slot
		;({ data: timeSlotData, error: timeSlotError } = await supabase
			.from('group_time_slots')
			.insert(upsertData)
			.single())

		// Ensure no duplicates by deleting any older entries
		await supabase
			.from('group_time_slots')
			.delete()
			.eq('activity_id', activityId)
			.eq('coach_id', coachId)
			.eq('date', date)
			.eq('start_time', startTime)
			.eq('end_time', endTime)
			.neq('id', timeSlotData.id)
	}

	if (timeSlotError) {
		console.error('Error booking group time slot:', timeSlotError.message)
		return { error: timeSlotError.message }
	}
	await deleteConflictingTimeSlots(supabase, coachId, date, startTime, endTime)

	// Update user's account (wallet or tokens)
	const { error: updateError } = await supabase
		.from('users')
		.update({
			wallet: newWalletBalance,
			public_token: newPublicTokenBalance,
			semiPrivate_token: newSemiPrivateTokenBalance
		})
		.eq('user_id', userId)

	if (updateError) {
		console.error('Error updating user data:', updateError.message)
		return { error: updateError.message }
	}

	// Add transaction record
	const { error: transactionError } = await supabase
		.from('transactions')
		.insert({
			user_id: userId,
			name: `Booked ${
				activityData.semi_private ? 'semi-private' : 'public'
			} class session: ${activityData.name}`,
			type: 'class session',
			amount: transactionAmount
		})

	if (transactionError) {
		console.error('Error recording transaction:', transactionError.message)
		// Note: We don't return here as the booking was successful
	}

	const { data: coachData, error: coachError } = await supabase
		.from('coaches')
		.select('*')
		.eq('id', coachId)
		.single()

	if (coachError || !coachData) {
		console.error('Error fetching coach data:', coachError?.message)
		return { error: coachError?.message || 'Coach not found.' }
	}

	// Prepare email data
	const emailData = {
		user_name: userData.first_name + ' ' + userData.last_name,
		user_email: userData.email,
		activity_name: activityData.name,
		activity_price:
			bookingMethod === 'semiPrivateToken'
				? '1 semi-private token'
				: bookingMethod === 'publicToken'
				? '1 public token'
				: activityData.credits,
		activity_date: date,
		start_time: startTime,
		end_time: endTime,
		coach_name: coachData.name,
		coach_email: coachData.email,
		user_wallet: newWalletBalance,
		user_public_tokens: newPublicTokenBalance,
		user_semi_private_tokens: newSemiPrivateTokenBalance,
		booking_method: bookingMethod,
		is_semi_private: activityData.semi_private
	}

	try {
		const responseAdmin = await fetch('/api/send-admin-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(emailData)
		})

		const resultAdmin = await responseAdmin.json()
		if (responseAdmin.ok) {
			console.log('Admin email sent successfully')
		} else {
			console.error(`Failed to send admin email: ${resultAdmin.error}`)
		}
	} catch (error) {
		console.error('Error sending admin email:', error)
	}

	// Send email notification to user
	try {
		const responseUser = await fetch('/api/send-user-email', {
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

	// Send email notifications (admin and user)
	// ... (keep the existing email sending logic)

	return {
		data: timeSlotData,
		message: `Group session booked successfully using ${
			bookingMethod === 'semiPrivateToken'
				? 'semi-private token'
				: bookingMethod === 'publicToken'
				? 'public token'
				: 'credits'
		}.`
	}
}

async function deleteConflictingTimeSlots(
	supabase,
	coachId,
	date,
	startTime,
	endTime
) {
	// Delete all conflicting individual time slots
	const { error: individualError } = await supabase
		.from('time_slots')
		.delete()
		.eq('coach_id', coachId)
		.eq('date', date)
		.neq('booked', true)
		.filter('start_time', 'lt', endTime)
		.filter('end_time', 'gt', startTime)

	if (individualError) {
		console.error(
			'Error deleting conflicting individual slots:',
			individualError.message
		)
	}

	// Delete all conflicting group time slots
	const { error: groupError } = await supabase
		.from('group_time_slots')
		.delete()
		.eq('coach_id', coachId)
		.eq('date', date)
		.eq('count', 0)
		.filter('start_time', 'lt', endTime)
		.filter('end_time', 'gt', startTime)

	if (groupError) {
		console.error('Error deleting conflicting group slots:', groupError.message)
	}
}
