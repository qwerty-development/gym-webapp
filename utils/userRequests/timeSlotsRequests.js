import { supabaseClient } from '../supabaseClient'
export const fetchFilteredUnbookedTimeSlots = async ({
	activityId,
	coachId,
	date
}) => {
	const supabase = await supabaseClient()
	const oneWeekAgo = new Date()
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

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
		.eq('booked', false)
		.gte('date', oneWeekAgo.toISOString().split('T')[0]) // Get slots from a week ago

	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)

	const { data, error } = await query

	if (error) {
		console.error('Error fetching time slots:', error.message)
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
	const oneWeekAgo = new Date()
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

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
		.eq('booked', false)
		.gte('date', oneWeekAgo.toISOString().split('T')[0]) // Get slots from a week ago

	if (activityId) query = query.eq('activity_id', activityId)
	if (coachId) query = query.eq('coach_id', coachId)
	if (date) query = query.eq('date', date)

	const { data, error } = await query

	if (error) {
		console.error('Error fetching group time slots:', error.message)
		return null
	}

	return data
}
