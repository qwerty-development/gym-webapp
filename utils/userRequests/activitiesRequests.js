import { supabaseClient } from '../supabaseClient'
export const fetchAllActivities = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('id, name, credits') // Ensure 'credits' is included
		.eq('group', false)

	if (error) {
		console.error('Error fetching activities:', error.message)
		return []
	}

	return data
}

export const fetchActivities = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase.from('activities').select('id, name')

	if (error) {
		console.error('Error fetching activities:', error.message)
		return []
	}

	return data
}
export const fetchAllActivitiesGroup = async () => {
	const supabase = await supabaseClient()
	const { data, error } = await supabase
		.from('activities')
		.select('id, name, credits, capacity') // Ensure 'credits' is included
		.or('group.eq.true,semi_private.eq.true')
		.neq('name', 'Sunrise Circuit 7')

	if (error) {
		console.error('Error fetching activities:', error.message)
		return []
	}

	return data
}
