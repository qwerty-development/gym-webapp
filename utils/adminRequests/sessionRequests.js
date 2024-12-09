import { supabaseClient } from '../supabaseClient'

export const fetchAllBookedSlotsToday = async () => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0] // Get today's date in YYYY-MM-DD format
	const currentTime = new Date().toLocaleTimeString('en-US', { hour12: false }) // Get current time in HH:MM:SS format

	// Fetch booked time slots for today
	const { data: individualSlots, error: individualError } = await supabase
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
		.eq('date', today)
		.eq('booked', true)
		.gt('end_time', currentTime)

	if (individualError) {
		console.error(
			'Error fetching individual time slots:',
			individualError.message
		)
		return []
	}

	// Fetch booked group time slots for today
	const { data: groupSlots, error: groupError } = await supabase
		.from('group_time_slots')
		.select(
			`
            id,
            activities ( name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            user_id,
            booked
        `
		)
		.eq('date', today)
		.eq('booked', true)
		.gt('end_time', currentTime)

	if (groupError) {
		console.error('Error fetching group time slots:', groupError.message)
		return []
	}

	// Fetch users for group slots
	const userIds = groupSlots.flatMap(slot => slot.user_id)
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

	// Transform individual slots
	const transformedIndividualSlots = individualSlots.map(slot => ({
		coachName: slot.coaches?.name || 'N/A',
		activityName: slot.activities?.name || 'N/A',
		startTime: slot.start_time,
		endTime: slot.end_time,
		date: slot.date,
		users: slot.users
			? [`${slot.users.first_name} ${slot.users.last_name}`]
			: []
	}))

	// Transform group slots
	const transformedGroupSlots = groupSlots.map(slot => ({
		coachName: slot.coaches?.name || 'N/A',
		activityName: slot.activities?.name || 'N/A',
		startTime: slot.start_time,
		endTime: slot.end_time,
		date: slot.date,
		users: slot.user_id.map(userId => {
			const user = usersMap[userId]
			return user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
		})
	}))

	// Combine and sort all slots
	const allSlots = [
		...transformedIndividualSlots,
		...transformedGroupSlots
	].sort((a, b) => a.startTime.localeCompare(b.startTime))

	return allSlots
}

export const fetchTodaysSessions = async () => {
	const supabase = await supabaseClient()
	const today = new Date().toISOString().split('T')[0]

	const { count: individualCount, error: individualError } = await supabase
		.from('time_slots')
		.select('*', { count: 'exact', head: true })
		.eq('date', today)
		.eq('booked', true)

	const { count: groupCount, error: groupError } = await supabase
		.from('group_time_slots')
		.select('*', { count: 'exact', head: true })
		.eq('date', today)
		.eq('booked', true)

	if (individualError || groupError) {
		console.error(
			"Error fetching today's sessions:",
			individualError?.message || groupError?.message
		)
		return 0
	}

	return (individualCount || 0) + (groupCount || 0)
}
export const fetchUpcomingSessions = async type => {
	const supabase = await supabaseClient()
	const now = new Date().toISOString()
	const OneMonthAgo = new Date(
		new Date().setMonth(new Date().getMonth() - 1)
	).toISOString()
	if (type === 'individual') {
		const { data: individualSessions, error } = await supabase
			.from('time_slots')
			.select(
				`
            id,
            activities ( id, name, credits ),
            coaches ( name ),
            date,
            start_time,
            end_time,
            users ( user_id, first_name, last_name ),
            booked,
            additions
        `
			)
			.gte('date', OneMonthAgo.split('T')[0])
			.eq('booked', true)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })

		if (error) {
			console.error('Error fetching individual sessions:', error.message)
			return []
		}

		const transformedSessions = individualSessions.map(session => ({
			...session,
			user: { user_id: session.users.user_id },
			activity: {
				name: session.activities.name
			}
		}))

		return transformedSessions || []
	} else {
		const { data: groupSessions, error } = await supabase
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
        booked,
        additions,
        count
      `
			)
			.gte('date', OneMonthAgo.split('T')[0])
			.gt('count', 0)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })

		if (error) {
			console.error('Error fetching group sessions:', error.message)
			return []
		}

		const userIds = groupSessions.flatMap(slot => slot.user_id)
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

		const transformedSessions = groupSessions.map(session => ({
			...session,
			users: session.user_id
				.map(userId => usersMap[userId] || null)
				.filter(Boolean),
			additions: session.additions || []
		}))

		return transformedSessions
	}
}

export const fetchUpcomingSessions2 = async type => {
	const supabase = await supabaseClient()
	const now = new Date()
	const oneWeekAgo = new Date(now)
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 3)

	const currentDate = now.toISOString()
	const pastWeekDate = oneWeekAgo.toISOString()

	if (type === 'individual') {
		const { data: individualSessions, error } = await supabase
			.from('time_slots')
			.select(
				`
                id,
                activities ( id, name, credits ),
                coaches ( name ),
                date,
                start_time,
                end_time,
                users ( user_id, first_name, last_name ),
                booked,
                additions
            `
			)
			.gte('date', pastWeekDate.split('T')[0])
			.eq('booked', true)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })

		if (error) {
			console.error('Error fetching individual sessions:', error.message)
			return []
		}

		const transformedSessions = individualSessions.map(session => ({
			...session,
			user: { user_id: session.users.user_id },
			activity: {
				name: session.activities.name
			},
			isPast: new Date(`${session.date}T${session.end_time}`) < now
		}))

		return transformedSessions || []
	} else {
		const { data: groupSessions, error } = await supabase
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
                booked,
                additions,
                count
            `
			)
			.gte('date', pastWeekDate.split('T')[0])
			.gt('count', 0)
			.order('date', { ascending: true })
			.order('start_time', { ascending: true })

		if (error) {
			console.error('Error fetching group sessions:', error.message)
			return []
		}

		const userIds = groupSessions.flatMap(slot => slot.user_id)
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

		const transformedSessions = groupSessions.map(session => ({
			...session,
			users: session.user_id
				.map(userId => usersMap[userId] || null)
				.filter(Boolean),
			additions: session.additions || [],
			isPast: new Date(`${session.date}T${session.end_time}`) < now
		}))

		return transformedSessions
	}
}
