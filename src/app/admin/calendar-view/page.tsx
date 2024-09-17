'use client'

import React, { useState, useEffect } from 'react'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import CalendarView from '@/app/components/admin/CalendarView'
import { fetchUpcomingSessions } from '../../../../utils/adminRequests'

const CalendarViewPage = () => {
	const [adminIndividualSessions, setAdminIndividualSessions] = useState<any[]>(
		[]
	)
	const [adminGroupSessions, setAdminGroupSessions] = useState<any[]>([])

	useEffect(() => {
		const fetchSessions = async () => {
			const individualSessions = await fetchUpcomingSessions('individual')
			const groupSessions = await fetchUpcomingSessions('group')
			setAdminIndividualSessions(individualSessions)
			setAdminGroupSessions(groupSessions)
		}
		fetchSessions()
	}, [])

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 py-8'>
				<h1 className='text-4xl font-bold mb-8 text-center'>Calendar View</h1>
				<div className='w-full overflow-x-auto'>
					<CalendarView
						sessions={[...adminIndividualSessions, ...adminGroupSessions]}
					/>
				</div>
			</div>
		</div>
	)
}

export default CalendarViewPage
