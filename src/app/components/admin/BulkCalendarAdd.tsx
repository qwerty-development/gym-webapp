import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FaCalendarPlus,
	FaSearch,
	FaFilter,
	FaCalendarAlt,
	FaClock,
	FaUser
} from 'react-icons/fa'
import { RiCalendarCheckFill } from 'react-icons/ri'
import { format } from 'date-fns'

export default function BulkCalendarAdd({ sessions, isVisible, onClose }: any) {
	const [selectedSessions, setSelectedSessions] = useState(new Set())
	const [searchTerm, setSearchTerm] = useState('')
	const [dateFilter, setDateFilter] = useState('all')
	const [filteredSessions, setFilteredSessions] = useState(sessions)
	const [addingToCalendar, setAddingToCalendar] = useState(false)
	const [showSuccessMessage, setShowSuccessMessage] = useState(false)
	const [processedCount, setProcessedCount] = useState(0)
	const [totalToProcess, setTotalToProcess] = useState(0)

	// Prevent background scroll when modal is open
	useEffect(() => {
		if (isVisible) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isVisible])

	useEffect(() => {
		setSelectedSessions(new Set())
		setFilteredSessions(sessions)
	}, [sessions])

	useEffect(() => {
		filterSessions()
	}, [searchTerm, dateFilter, sessions])

	const filterSessions = () => {
		let filtered = [...sessions]

		if (searchTerm) {
			filtered = filtered.filter(
				session =>
					session.activities.name
						.toLowerCase()
						.includes(searchTerm.toLowerCase()) ||
					session.coaches.name.toLowerCase().includes(searchTerm.toLowerCase())
			)
		}

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		switch (dateFilter) {
			case 'today':
				filtered = filtered.filter(
					session =>
						new Date(session.date).toDateString() === today.toDateString()
				)
				break
			case 'week':
				const nextWeek = new Date(today)
				nextWeek.setDate(today.getDate() + 7)
				filtered = filtered.filter(session => {
					const sessionDate = new Date(session.date)
					return sessionDate >= today && sessionDate <= nextWeek
				})
				break
			case 'month':
				const nextMonth = new Date(today)
				nextMonth.setMonth(today.getMonth() + 1)
				filtered = filtered.filter(session => {
					const sessionDate = new Date(session.date)
					return sessionDate >= today && sessionDate <= nextMonth
				})
				break
		}

		filtered.sort((a, b) => {
			const dateCompare =
				new Date(a.date).getTime() - new Date(b.date).getTime()
			if (dateCompare === 0) {
				return a.start_time.localeCompare(b.start_time)
			}
			return dateCompare
		})

		setFilteredSessions(filtered)
	}

	const toggleSelectAll = () => {
		if (selectedSessions.size === filteredSessions.length) {
			setSelectedSessions(new Set())
		} else {
			setSelectedSessions(
				new Set(filteredSessions.map((_: any, index: any) => index))
			)
		}
	}

	const toggleSessionSelection = (index: unknown) => {
		const newSelected = new Set(selectedSessions)
		if (newSelected.has(index)) {
			newSelected.delete(index)
		} else {
			newSelected.add(index)
		}
		setSelectedSessions(newSelected)
	}

	const formatGoogleCalendarDate = (
		dateStr: { split: (arg0: string) => [any, any, any] },
		timeStr: { split: (arg0: string) => [any, any] }
	) => {
		const [year, month, day] = dateStr.split('-')
		const [hours, minutes] = timeStr.split(':')
		const date = new Date(year, month - 1, day, hours, minutes)
		return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
	}

	const createGoogleCalendarUrl = (session: {
		date: any
		start_time: any
		end_time: any
		activities: { name: any }
		coaches: { name: any }
		users: {
			map: (arg0: (u: any) => string) => any[]
			first_name: any
			last_name: any
		}
		additions: any[]
	}) => {
		const startDateTime = formatGoogleCalendarDate(
			session.date,
			session.start_time
		)
		const endDateTime = formatGoogleCalendarDate(session.date, session.end_time)

		const title = `${session.activities.name} with ${session.coaches.name}`
		let description = `Coach: ${session.coaches.name}\n`
		description += `Activity: ${session.activities.name}\n\n`

		if (session.users) {
			description += 'Participants: '
			if (Array.isArray(session.users)) {
				description += session.users
					.map(
						(u: { first_name: any; last_name: any }) =>
							`${u.first_name} ${u.last_name}`
					)
					.join(', ')
			} else {
				description += `${session.users.first_name} ${session.users.last_name}`
			}
		}

		if (session.additions && session.additions.length > 0) {
			description += '\n\nAdditions: '
			if (typeof session.additions[0] === 'string') {
				description += session.additions.join(', ')
			} else {
				description += session.additions
					.map((addition: { items: any[] }) =>
						addition.items.map((item: any) => item.name).join(', ')
					)
					.join(', ')
			}
		}

		const baseUrl = 'https://www.google.com/calendar/render'
		const params = new URLSearchParams({
			action: 'TEMPLATE',
			text: title,
			details: description,
			dates: `${startDateTime}/${endDateTime}`,
			ctz: 'Asia/Beirut'
		})

		return `${baseUrl}?${params.toString()}`
	}

	const handleAddAllToCalendar = async () => {
		if (selectedSessions.size === 0) return

		setAddingToCalendar(true)
		setProcessedCount(0)
		setTotalToProcess(selectedSessions.size)

		// Process sessions with a slight delay between each to prevent browser blocking
		const selectedSessionsArray = Array.from(selectedSessions).map(
			(index: any) => filteredSessions[index]
		)

		for (let i = 0; i < selectedSessionsArray.length; i++) {
			const session = selectedSessionsArray[i]
			const calendarUrl = createGoogleCalendarUrl(session)

			// Open in new tab
			window.open(calendarUrl, '_blank')

			// Update progress
			setProcessedCount(i + 1)

			// Add a small delay between openings to prevent browser blocking
			await new Promise(resolve => setTimeout(resolve, 300))
		}

		setAddingToCalendar(false)
		setShowSuccessMessage(true)
		setTimeout(() => setShowSuccessMessage(false), 3000)
	}

	if (!isVisible) return null

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 bg-black    bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50'
			onClick={onClose}>
			<motion.div
				initial={{ scale: 0.9, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				exit={{ scale: 0.9, opacity: 0 }}
				className='bg-gray-800 rounded-xl    w-full max-w-4xl m-4 shadow-2xl overflow-hidden'
				onClick={e => e.stopPropagation()}>
				<div className='p-6 border-b border-gray-700'>
					<h2 className='text-2xl font-bold text-green-400 mb-4'>
						Add Sessions to Calendar
					</h2>

					<div className='flex flex-col    sm:flex-row gap-4'>
						<div className='relative flex-grow'>
							<FaSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
							<input
								type='text'
								placeholder='Search sessions...'
								value={searchTerm}
								onChange={e => setSearchTerm(e.target.value)}
								className='w-full pl-10 pr-4 py-2 bg-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500'
							/>
						</div>
						<select
							value={dateFilter}
							onChange={e => setDateFilter(e.target.value)}
							className='bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'>
							<option value='all'>All Dates</option>
							<option value='today'>Today</option>
							<option value='week'>This Week</option>
							<option value='month'>This Month</option>
						</select>
					</div>
				</div>

				<div className='max-h-[60vh] overflow-y-auto p-6'>
					<div className='mb-4'>
						<button
							onClick={toggleSelectAll}
							className='flex items-center space-x-2 text-green-400 hover:text-green-300'>
							<input
								type='checkbox'
								checked={selectedSessions.size === filteredSessions.length}
								className='form-checkbox h-5 w-5 text-green-500 rounded'
								readOnly
							/>
							<span>Select All ({filteredSessions.length} sessions)</span>
						</button>
					</div>

					<div className='space-y-3'>
						{filteredSessions.map((session: any, index: any) => (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.05 }}
								className={`p-4 rounded-lg transition-colors duration-200 ${
									selectedSessions.has(index)
										? 'bg-green-500 bg-opacity-20 border-2 border-green-500'
										: 'bg-gray-700 hover:bg-gray-600'
								}`}>
								<label className='flex items-center cursor-pointer'>
									<input
										type='checkbox'
										checked={selectedSessions.has(index)}
										onChange={() => toggleSessionSelection(index)}
										className='form-checkbox h-5 w-5 text-green-500 rounded'
									/>
									<div className='ml-3 flex-grow'>
										<div className='flex justify-between items-center'>
											<div>
												<p className='font-semibold text-white flex items-center'>
													<FaUser className='mr-2' />
													{session.activities.name}
												</p>
												<p className='text-sm text-gray-300'>
													{session.coaches.name}
												</p>
											</div>
											<div className='text-right'>
												<p className='text-sm text-gray-300 flex items-center justify-end'>
													<FaCalendarAlt className='mr-2' />
													{session.date}
												</p>
												<p className='text-sm text-gray-300 flex items-center justify-end'>
													<FaClock className='mr-2' />
													{session.start_time} - {session.end_time}
												</p>
											</div>
										</div>
									</div>
								</label>
							</motion.div>
						))}
					</div>
				</div>

				<div className='border-t border-gray-700 p-6'>
					<div className='flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0'>
						<p className='text-gray-300'>
							{selectedSessions.size} sessions selected
						</p>
						<div className='flex space-x-4'>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								onClick={onClose}
								className='px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors duration-200'>
								Cancel
							</motion.button>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								disabled={selectedSessions.size === 0 || addingToCalendar}
								onClick={handleAddAllToCalendar}
								className={`px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
									selectedSessions.size === 0
										? 'bg-gray-500 cursor-not-allowed'
										: 'bg-green-500 hover:bg-green-600'
								}`}>
								{addingToCalendar ? (
									<>
										<FaCalendarAlt className='animate-spin' />
										<span>
											Adding ({processedCount}/{totalToProcess})
										</span>
									</>
								) : (
									<>
										<RiCalendarCheckFill />
										<span>Add Selected to Calendar</span>
									</>
								)}
							</motion.button>
						</div>
					</div>
				</div>

				<AnimatePresence>
					{showSuccessMessage && (
						<motion.div
							initial={{ opacity: 0, y: 50 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 50 }}
							className='fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg'>
							Successfully opened {processedCount} calendar events
						</motion.div>
					)}
				</AnimatePresence>
			</motion.div>
		</motion.div>
	)
}
