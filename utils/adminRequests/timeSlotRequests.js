import { supabaseClient } from '../supabaseClient'

export const fetchTimeSlots = async () => {
	const supabase = await supabaseClient()

	const today = new Date()

	const { data, error } = await supabase
		.from('time_slots')
		.select(
			`
            id,
            activities ( name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            users ( user_id, first_name, last_name ),
            booked
        `
		)
		.gte('date', today.toISOString().split('T')[0])

	if (error) {
		console.error('Error fetching time slots:', error.message)
		return []
	}

	// Transform the data to ensure it fits the Reservation type
	const transformedData = data.map(slot => ({
		id: slot.id,
		activity: slot.activities
			? { name: slot.activities.name, credits: slot.activities.credits }
			: null,
		coach: slot.coaches ? { name: slot.coaches.name } : null,
		date: slot.date,
		start_time: slot.start_time,
		end_time: slot.end_time,
		user: slot.users
			? {
					user_id: slot.users.user_id,
					first_name: slot.users.first_name,
					last_name: slot.users.last_name
			  }
			: null,
		booked: slot.booked
	}))

	// Sort the transformed data
	const sortedData = transformedData.sort((a, b) => {
		const dateA = new Date(a.date + 'T' + a.start_time)
		const dateB = new Date(b.date + 'T' + b.start_time)
		return dateA.getTime() - dateB.getTime()
	})

	return sortedData
}

export const fetchGroupTimeSlots = async () => {
	const supabase = await supabaseClient()

	// Get today's date at the start of the day (midnight)
	const today = new Date()

	const { data, error } = await supabase
		.from('group_time_slots')
		.select(
			`
            id,
            activities ( name, credits, capacity ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            user_id,
            booked
        `
		)
		.gte('date', today.toISOString().split('T')[0]) // Filter for dates from today onwards

	if (error) {
		console.error('Error fetching group time slots:', error.message)
		return []
	}

	const userIds = data.flatMap(slot => slot.user_id)
	const { data: usersData, error: usersError } = await supabase
		.from('users')
		.select('user_id, first_name, last_name')
		.in('user_id', userIds)

	if (usersError) {
		console.error('Error fetching users:', usersError.message)
		return []
	}

	const usersMap = usersData.reduce((acc, user) => {
		acc[user.user_id] = user
		return acc
	}, {})

	const transformedData = data.map(slot => ({
		id: slot.id,
		activity: slot.activities
			? {
					name: slot.activities.name,
					credits: slot.activities.credits,
					capacity: slot.activities.capacity
			  }
			: null,
		coach: slot.coaches ? { name: slot.coaches.name } : null,
		date: slot.date,
		start_time: slot.start_time,
		end_time: slot.end_time,
		users: slot.user_id.map(userId => usersMap[userId] || null),
		booked: slot.booked
	}))

	// Sort the transformed data
	const sortedData = transformedData.sort((a, b) => {
		const dateA = new Date(a.date + 'T' + a.start_time)
		const dateB = new Date(b.date + 'T' + b.start_time)
		return dateA.getTime() - dateB.getTime()
	})

	return sortedData
}

export const checkExistingTimeSlot = async timeSlot => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('time_slots')
		.select('*')
		.eq('coach_id', timeSlot.coach_id)
		.eq('activity_id', timeSlot.activity_id)
		.eq('date', timeSlot.date)
		.eq('start_time', timeSlot.start_time)
		.eq('end_time', timeSlot.end_time)

	if (error) {
		console.error('Error checking existing time slot:', error.message)
		return { error: error.message }
	}

	return { exists: data && data.length > 0 }
}

export const checkExistingGroupTimeSlot = async timeSlot => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('group_time_slots')
		.select('*')
		.eq('coach_id', timeSlot.coach_id)
		.eq('activity_id', timeSlot.activity_id)
		.eq('date', timeSlot.date)
		.eq('start_time', timeSlot.start_time)
		.eq('end_time', timeSlot.end_time)

	if (error) {
		console.error('Error checking existing group time slot:', error.message)
		return { error: error.message }
	}

	return { exists: data && data.length > 0 }
}

export const addTimeSlot = async timeSlot => {
	// Check if the time slot already exists
	const { exists, error: checkError } = await checkExistingTimeSlot(timeSlot)
	if (checkError) {
		return { success: false, error: checkError }
	}

	if (exists) {
		return { success: false, error: 'Time slot already exists' }
	}

	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('time_slots').insert([timeSlot])

	if (error) {
		console.error('Error adding new time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const addTimeSlotGroup = async timeSlot => {
	// Check if the group time slot already exists
	const { exists, error: checkError } = await checkExistingGroupTimeSlot(
		timeSlot
	)
	if (checkError) {
		return { success: false, error: checkError }
	}

	if (exists) {
		return { success: false, error: 'Group time slot already exists' }
	}

	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('group_time_slots')
		.insert([timeSlot])

	if (error) {
		console.error('Error adding new group time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const deleteTimeSlot = async timeSlotId => {
	const supabase = await supabaseClient()
	const { error } = await supabase
		.from('time_slots')
		.delete()
		.match({ id: timeSlotId }) // Use `.eq('id', timeSlotId)` if your DB requires

	if (error) {
		console.error('Error deleting time slot:', error.message)
		return false
	}

	return true
}

export const deleteGroupTimeSlot = async timeSlotId => {
	const supabase = await supabaseClient()
	const { error } = await supabase
		.from('group_time_slots')
		.delete()
		.match({ id: timeSlotId }) // Use `.eq('id', timeSlotId)` if your DB requires

	if (error) {
		console.error('Error deleting time slot:', error.message)
		return false
	}
	return true
}

export const updateTimeSlot = async timeSlot => {
	if (!timeSlot.id) {
		console.error('Time Slot ID is required for update.')
		return { success: false, error: 'Time Slot ID is required for update.' }
	}

	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('time_slots')
		.update({
			booked: timeSlot.booked,
			user_id: timeSlot.user_id,
			additions: timeSlot.additions // Ensure you update only necessary fields
		})
		.eq('id', timeSlot.id)

	if (error) {
		console.error('Error updating time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}

export const updateGroupTimeSlot = async timeSlot => {
	if (!timeSlot.id) {
		console.error('Group Time Slot ID is required for update.')
		return {
			success: false,
			error: 'Group Time Slot ID is required for update.'
		}
	}

	const supabase = await supabaseClient()

	// Fetch existing group time slot data
	const { data: existingSlot, error: existingSlotError } = await supabase
		.from('group_time_slots')
		.select('user_id, count, activity_id')
		.eq('id', timeSlot.id)
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

	// Add the new user_id to the existing user_id array

	// Fetch activity details to check the capacity
	// Determine if the slot should be marked as booked

	// Update the group time slot
	const { data, error } = await supabase
		.from('group_time_slots')
		.update({
			user_id: [],
			count: 0,
			booked: false
		})
		.eq('id', timeSlot.id)

	if (error) {
		console.error('Error updating group time slot:', error.message)
		return { success: false, error: error.message }
	}

	return { success: true, data }
}
