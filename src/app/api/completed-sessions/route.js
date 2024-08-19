import { NextResponse } from 'next/server'
import { supabaseClient } from '../../../../utils/supabaseClient'

export async function GET(request) {
	const { searchParams } = new URL(request.url)
	const userId = searchParams.get('userId')
	const page = parseInt(searchParams.get('page') || '1')
	const limit = parseInt(searchParams.get('limit') || '10')
	const sortBy = searchParams.get('sortBy') || 'date'
	const sortOrder = searchParams.get('sortOrder') || 'desc'
	const filter = searchParams.get('filter') || 'all'
	const startDate = searchParams.get('startDate')
	const endDate = searchParams.get('endDate')
	const activityType = searchParams.get('activityType')

	const supabase = await supabaseClient()
	const offset = (page - 1) * limit

	const now = new Date()
	const today = now.toISOString().split('T')[0]
	const currentTime = now.toTimeString().split(' ')[0]

	let privateQuery = supabase
		.from('time_slots')
		.select(
			`
            id,
            date,
            start_time,
            end_time,
            booked,
            user_id,
            activity:activities (id, name, credits),
            coach:coaches (id, name, email),
            additions
        `
		)
		.eq('user_id', userId)
		.eq('booked', true)
		.or(`date.lt.${today},and(date.eq.${today},end_time.lte.${currentTime})`)

	let groupQuery = supabase
		.from('group_time_slots')
		.select(
			`
            id,
            date,
            start_time,
            end_time,
            booked,
            user_id,
            activity:activities (id, name, credits),
            coach:coaches (id, name, email),
            additions
        `
		)
		.contains('user_id', [userId])
		.or(`date.lt.${today},and(date.eq.${today},end_time.lte.${currentTime})`)

	// Apply filter
	if (filter === 'private') {
		groupQuery = null
	} else if (filter === 'group') {
		privateQuery = null
	}

	// Apply date range filter
	if (startDate && endDate) {
		if (privateQuery)
			privateQuery = privateQuery.gte('date', startDate).lte('date', endDate)
		if (groupQuery)
			groupQuery = groupQuery.gte('date', startDate).lte('date', endDate)
	}

	// Apply activity type filter
	if (activityType) {
		if (privateQuery)
			privateQuery = privateQuery.eq('activity.id', activityType)
		if (groupQuery) groupQuery = groupQuery.eq('activity.id', activityType)
	}

	// Fetch data
	const [privateResult, groupResult] = await Promise.all([
		privateQuery ? privateQuery : { data: [] },
		groupQuery ? groupQuery : { data: [] }
	])

	let allSessions = [
		...(privateResult.data || []).map(session => ({
			...session,
			sessionType: 'private'
		})),
		...(groupResult.data || []).map(session => ({
			...session,
			sessionType: 'group'
		}))
	]

	// Sort
	allSessions.sort((a, b) => {
		const aValue = a[sortBy]
		const bValue = b[sortBy]
		if (sortOrder === 'asc') {
			return aValue > bValue ? 1 : -1
		} else {
			return aValue < bValue ? 1 : -1
		}
	})

	// Calculate summary
	const totalSessions = allSessions.length
	const totalPrivateSessions = allSessions.filter(
		session => session.sessionType === 'private'
	).length
	const totalGroupSessions = totalSessions - totalPrivateSessions

	// Paginate
	const totalCount = allSessions.length
	const paginatedSessions = allSessions.slice(offset, offset + limit)

	return NextResponse.json({
		sessions: paginatedSessions,
		totalCount,
		currentPage: page,
		totalPages: Math.ceil(totalCount / limit),
		summary: {
			totalSessions,
			totalPrivateSessions,
			totalGroupSessions
		}
	})
}
