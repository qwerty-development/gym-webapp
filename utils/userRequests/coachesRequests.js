import { supabaseClient } from '../supabaseClient'
export const fetchCoaches = async activityId => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

	const { data: coachesData, error: coachesError } = await supabase
		.from('time_slots')
		.select(
			`
            coach:coaches(
                id,
                name,
                profile_picture,
                email
            )
        `
		)
		.eq('activity_id', activityId)
		.is('booked', false)
		.not('coach', 'is', null)
		.gte('date', today)

	if (coachesError) {
		console.error('Error fetching coaches:', coachesError.message)
		return []
	}

	// Remove duplicates and transform data structure
	const uniqueCoaches = Array.from(
		new Set(coachesData.map(item => JSON.stringify(item.coach)))
	).map(str => JSON.parse(str))

	return uniqueCoaches
}

export const fetchCoachesGroup = async activityId => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format

	// Direct join query to get coaches with available group time slots
	const { data: coachesData, error: coachesError } = await supabase
		.from('group_time_slots')
		.select(
			`
            coach:coaches(
                id,
                name,
                profile_picture,
                email
            )
        `
		)
		.eq('activity_id', activityId)
		.is('booked', false)
		.gte('date', today)
		.not('coach', 'is', null)

	if (coachesError) {
		console.error('Error fetching group coaches:', coachesError.message)
		return []
	}

	// Remove duplicates and transform data structure
	const uniqueCoaches = Array.from(
		new Set(coachesData.map(item => JSON.stringify(item.coach)))
	).map(str => JSON.parse(str))

	return uniqueCoaches
}
