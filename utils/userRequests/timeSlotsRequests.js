import { supabaseClient } from '../supabaseClient'
export const fetchFilteredUnbookedTimeSlots = async ({
	activityId,
	coachId,
	date
}) => {
	const supabase = await supabaseClient()
	let query = supabase
		.from('time_slots')
		.select(
			`
            id,
            start_time,
            end_time,
            date,
            coach_id,
            activity_id,
            booked,
            user_id
        `
		)
		.is('user_id', null) // Adjust based on your logic for determining unbooked slots

	// Apply filters based on provided arguments
	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)

	const { data, error } = await query

	if (error) {
		console.error('Error fetching filtered unbooked time slots:', error.message)
		return null
	}

	return data
}

export const fetchFilteredUnbookedTimeSlotsGroup = async ({
	activityId,
	coachId,
	date
}) => {
	const supabase = await supabaseClient()
	let query = supabase
		.from('group_time_slots')
		.select(
			`
            id,
            start_time,
            end_time,
            date,
            coach_id,
            activity_id,
            booked,
            user_id,
			count
        `
		)
		.is('booked', false) // Adjust based on your logic for determining unbooked slots

	// Apply filters based on provided arguments
	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)
	// if (startTime && endTime) {
	// 	// Ensures both startTime and endTime are provided for a valid time slot filter
	// 	query = query.gte('start_time', startTime).lte('end_time', endTime)
	// }

	const { data, error } = await query

	if (error) {
		console.error('Error fetching filtered unbooked time slots:', error.message)
		return null
	}

	return data
}
