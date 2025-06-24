import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, momentLocalizer, Views, View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import {
	FaUser,
	FaUsers,
	FaFilter,
	FaTimes,
	FaClock,
	FaCalendarAlt,
	FaDumbbell,
	FaChevronLeft,
	FaChevronRight
} from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

const localizer = momentLocalizer(moment)

interface CalendarEvent {
	id: number
	title: string
	start: Date
	end: Date
	coach: string
	activity: string
	isGroup: boolean
	clients: string
}

interface CalendarViewProps {
	sessions: Array<{
		id: number
		date: string
		start_time: string
		end_time: string
		coaches: { name: string }
		activities: { name: string }
		users:
			| Array<{ first_name: string; last_name: string }>
			| { first_name: string; last_name: string }
		count?: number
	}>
	onCancelSession: (sessionId: number, isGroup: boolean) => void
}

const CalendarView: React.FC<CalendarViewProps> = ({
	sessions,
	onCancelSession
}) => {
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [view, setView] = useState<View>(() => {
		if (typeof window !== 'undefined' && window.innerWidth < 768) {
			return Views.DAY
		}
		return Views.WEEK
	})
	const [date, setDate] = useState(new Date())
	const [selectedCoach, setSelectedCoach] = useState<string | null>(null)
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
	const [sessionTypeFilter, setSessionTypeFilter] = useState<'all' | 'private' | 'group'>('all')
	const [isMobile, setIsMobile] = useState(false)

	// Check if mobile
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768)
		}
		checkMobile()
		window.addEventListener('resize', checkMobile)
		return () => window.removeEventListener('resize', checkMobile)
	}, [])

	const coachColors = useMemo(() => {
		const uniqueCoaches = Array.from(new Set(sessions.map(s => s.coaches.name)))
		const colors = [
			'#10B981',
			'#3B82F6',
			'#F59E0B',
			'#EF4444',
			'#8B5CF6',
			'#EC4899',
			'#14B8A6',
			'#F97316',
			'#6366F1',
			'#84CC16'
		]
		return Object.fromEntries(
			uniqueCoaches.map((coach, index) => [
				coach,
				colors[index % colors.length]
			])
		)
	}, [sessions])

	useEffect(() => {
		const calendarEvents = sessions.map(session => ({
			id: session.id,
			title: session.activities.name,
			start: new Date(`${session.date}T${session.start_time}`),
			end: new Date(`${session.date}T${session.end_time}`),
			coach: session.coaches.name,
			activity: session.activities.name,
			isGroup: 'count' in session,
			clients: Array.isArray(session.users)
				? session.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')
				: `${session.users?.first_name} ${session.users?.last_name}`
		}))
		setEvents(calendarEvents)
	}, [sessions])

	const filteredEvents = events.filter(event => {
		if (selectedCoach && event.coach !== selectedCoach) return false;
		if (sessionTypeFilter === 'private' && event.isGroup) return false;
		if (sessionTypeFilter === 'group' && !event.isGroup) return false;
		return true;
	})

	const eventStyleGetter = useCallback(
		(event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
			const style: React.CSSProperties = {
				backgroundColor: coachColors[event.coach],
				color: 'white',
				borderRadius: isMobile ? '4px' : '8px',
				border: 'none',
				padding: isMobile ? '2px 4px' : '4px 8px',
				fontSize: isMobile ? '10px' : '12px',
				fontWeight: '600',
				boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'stretch',
				justifyContent: 'flex-start',
				height: '100%',
				minHeight: isMobile ? '30px' : '40px',
				transition: 'all 0.2s',
				cursor: 'pointer',
				overflow: 'hidden',
				lineHeight: isMobile ? '1.2' : '1.3',
			}
			return { style }
		},
		[coachColors, isMobile]
	)

	const CustomEvent: React.FC<{ event: CalendarEvent; view: View }> = ({
		event,
		view
	}) => {
		const displayText = isMobile ? 
			`${event.title.substring(0, 12)}${event.title.length > 12 ? '...' : ''}` : 
			event.title
		
		const coachText = isMobile ? 
			event.coach.split(' ')[0] : 
			event.coach

		return (
			<div
				className="h-full flex flex-col justify-start text-left"
				onClick={() => setSelectedEvent(event)}
				title={`${event.title} - ${event.coach} - ${event.clients}`}>
				<div className="font-semibold leading-tight truncate mb-0.5">
					{displayText}
				</div>
				<div className="text-xs opacity-90 truncate">
					{coachText}
				</div>
				{!isMobile && (
					<div className="text-xs opacity-75 truncate mt-0.5">
						{event.clients.length > 20 ? `${event.clients.substring(0, 20)}...` : event.clients}
					</div>
				)}
			</div>
		)
	}

	const CustomToolbar: React.FC<any> = toolbarProps => {
		const goToBack = () => toolbarProps.onNavigate('PREV')
		const goToNext = () => toolbarProps.onNavigate('NEXT')
		const goToCurrent = () => toolbarProps.onNavigate('TODAY')

		const label = () => {
			const date = moment(toolbarProps.date)
			if (isMobile) {
				return (
					<span className='text-lg font-bold text-green-400'>
						{date.format('MMM YYYY')}
					</span>
				)
			}
			return (
				<span className='text-xl sm:text-2xl font-bold text-green-400'>
					{date.format('MMMM')} {date.format('YYYY')}
				</span>
			)
		}

		return (
			<div className={`flex ${isMobile ? 'flex-col space-y-3' : 'flex-row justify-between items-center'} mb-4 bg-gray-800 p-3 sm:p-6 rounded-xl shadow-lg`}>
				{/* Navigation and Date */}
				<div className={`flex ${isMobile ? 'justify-between items-center w-full' : 'space-x-4'}`}>
					<div className="flex space-x-2">
						<button
							onClick={goToBack}
							className='bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-sm'>
							<FaChevronLeft />
						</button>
						<button
							onClick={goToNext}
							className='bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-sm'>
							<FaChevronRight />
						</button>
						<button
							onClick={goToCurrent}
							className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-xs sm:text-sm'>
							Today
						</button>
					</div>
					<div className='text-white'>{label()}</div>
				</div>
				{/* View Selection */}
				{isMobile ? (
					<div className="w-full mt-2">
						<select
							value={toolbarProps.view}
							onChange={e => toolbarProps.onView(e.target.value)}
							className="w-full bg-gray-700 text-white rounded-lg p-2 border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm">
							<option value={Views.MONTH}>Month</option>
							<option value={Views.WEEK}>Week</option>
							<option value={Views.DAY}>Day</option>
						</select>
					</div>
				) : (
					<div className={`flex ${isMobile ? 'justify-center w-full' : 'space-x-2 sm:space-x-4'} space-x-2`}>
						<button
							onClick={() => toolbarProps.onView(Views.MONTH)}
							className={`${toolbarProps.view === Views.MONTH ? 'bg-green-500' : 'bg-gray-700'} hover:bg-green-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-xs sm:text-sm`}>
							Month
						</button>
						<button
							onClick={() => toolbarProps.onView(Views.WEEK)}
							className={`${toolbarProps.view === Views.WEEK ? 'bg-green-500' : 'bg-gray-700'} hover:bg-green-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-xs sm:text-sm`}>
							Week
						</button>
						<button
							onClick={() => toolbarProps.onView(Views.DAY)}
							className={`${toolbarProps.view === Views.DAY ? 'bg-green-500' : 'bg-gray-700'} hover:bg-green-600 text-white font-bold py-2 px-3 sm:py-3 sm:px-4 rounded-full transition-all duration-300 text-xs sm:text-sm`}>
							Day
						</button>
					</div>
				)}
			</div>
		)
	}

	const calendarStyle = useMemo(() => {
		if (isMobile) {
			return {
				height: view === Views.MONTH ? '600px' : view === Views.WEEK ? '500px' : '400px'
			}
		}
		return {
			height: view === Views.MONTH ? '800px' : '1000px'
		}
	}, [view, isMobile])

	const handleSelectSlot = (slotInfo: {
		start: Date
		end: Date
		action: string
	}) => {
		if (slotInfo.action === 'click' && view === Views.MONTH) {
			setDate(slotInfo.start)
			setView(Views.DAY)
		}
	}

	useEffect(() => {
		if (selectedEvent) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = 'unset'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [selectedEvent])

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='bg-gray-800 rounded-xl p-3 sm:p-6 shadow-lg w-full max-w-full overflow-hidden'>
			
			{/* Header and Filters */}
			<div className="mb-4 sm:mb-6">
				<div className={`flex ${isMobile ? 'flex-col space-y-3' : 'flex-row justify-between items-center mb-4'}`}>
					<h3 className={`${isMobile ? 'text-xl text-center' : 'text-3xl sm:text-4xl'} font-bold text-green-400`}>
						Calendar View
					</h3>
					{!isMobile && <FaFilter className='text-green-400 text-xl' />}
				</div>
				
				{/* Mobile Filters */}
				{isMobile && (
					<div className="grid grid-cols-1 gap-3 w-full">
						<select
							value={selectedCoach || ''}
							onChange={e => setSelectedCoach(e.target.value || null)}
							className="bg-gray-700 text-white rounded-lg p-3 border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full">
							<option value=''>All Coaches</option>
							{Object.keys(coachColors).map(coach => (
								<option key={coach} value={coach}>
									{coach}
								</option>
							))}
						</select>
						<select
							value={sessionTypeFilter}
							onChange={e => setSessionTypeFilter(e.target.value as 'all' | 'private' | 'group')}
							className="bg-gray-700 text-white rounded-lg p-3 border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm w-full">
							<option value='all'>All Sessions</option>
							<option value='private'>Private Sessions</option>
							<option value='group'>Group Sessions</option>
						</select>
					</div>
				)}
				
				{/* Desktop Filters */}
				{!isMobile && (
					<div className="flex items-center space-x-4 justify-end">
						<select
							value={selectedCoach || ''}
							onChange={e => setSelectedCoach(e.target.value || null)}
							className="bg-gray-700 text-white rounded-full p-3 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg">
							<option value=''>All Coaches</option>
							{Object.keys(coachColors).map(coach => (
								<option key={coach} value={coach}>
									{coach}
								</option>
							))}
						</select>
						<select
							value={sessionTypeFilter}
							onChange={e => setSessionTypeFilter(e.target.value as 'all' | 'private' | 'group')}
							className="bg-gray-700 text-white rounded-full p-3 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg">
							<option value='all'>All Sessions</option>
							<option value='private'>Private Sessions</option>
							<option value='group'>Group Sessions</option>
						</select>
					</div>
				)}
			</div>

			{/* Calendar Container */}
			<div
				className='w-full overflow-x-hidden rounded-lg shadow-inner bg-gray-700 p-1 sm:p-4'
				style={calendarStyle}>
				<style jsx global>{`
					/* Mobile Calendar Styles */
					@media (max-width: 768px) {
						.rbc-calendar {
							font-size: 11px;
						}
						.rbc-header {
							padding: 2px 1px;
							font-size: 10px;
							font-weight: 600;
						}
						.rbc-time-header-content {
							font-size: 9px;
						}
						.rbc-time-slot {
							font-size: 9px;
							min-height: 18px;
						}
						.rbc-timeslot-group {
							min-height: 30px;
						}
						.rbc-time-content {
							min-height: 250px;
						}
						.rbc-day-slot .rbc-event {
							margin: 1px 1px;
						}
						.rbc-week-view .rbc-event,
						.rbc-day-view .rbc-event {
							padding: 1px 2px;
							font-size: 9px;
							line-height: 1.1;
						}
						.rbc-month-view .rbc-event {
							font-size: 8px;
							padding: 1px 2px;
						}
						.rbc-time-header {
							flex-direction: column;
						}
						.rbc-time-header-content {
							border-left: none;
						}
						.rbc-event-content {
							white-space: normal !important;
						}
					}
					
					/* General Calendar Styling */
					.rbc-calendar {
						background: #374151;
						color: white;
						border: none;
					}
					.rbc-header {
						background: #4B5563;
						color: #10B981;
						border: none;
						padding: 8px;
						font-weight: bold;
					}
					.rbc-today {
						background: rgba(16, 185, 129, 0.1);
					}
					.rbc-off-range-bg {
						background: #1F2937;
					}
					.rbc-time-header-content,
					.rbc-time-content {
						border-left: 1px solid #4B5563;
					}
					.rbc-time-slot {
						border-top: 1px solid #4B5563;
						color: #9CA3AF;
					}
					.rbc-current-time-indicator {
						background-color: #10B981;
						height: 2px;
					}
					.rbc-day-slot .rbc-event {
						border: none;
					}
					.rbc-month-view .rbc-date-cell {
						padding: 4px;
					}
					.rbc-month-view .rbc-date-cell.rbc-off-range {
						color: #6B7280;
					}
				`}</style>
				
				<Calendar
					localizer={localizer}
					events={filteredEvents}
					startAccessor='start'
					endAccessor='end'
					view={view}
					date={date}
					onView={newView => setView(newView)}
					onNavigate={newDate => setDate(newDate)}
					eventPropGetter={eventStyleGetter}
					components={{
						event: props => <CustomEvent {...props} view={view} />,
						toolbar: CustomToolbar
					}}
					formats={{
						timeGutterFormat: ((date: Date, culture: string, localizer: any) =>
							localizer.format(date, isMobile ? 'HH:mm' : 'HH:mm', culture)) as any,
						eventTimeRangeFormat: ((
							{ start, end }: { start: Date; end: Date },
							culture: string,
							localizer: any
						) =>
							`${localizer.format(
								start,
								'HH:mm',
								culture
							)} - ${localizer.format(end, 'HH:mm', culture)}`) as any
					}}
					className='bg-gray-700 text-white rounded-lg overflow-hidden'
					selectable
					onSelectSlot={handleSelectSlot}
					step={30}
					timeslots={2}
					defaultView={isMobile ? Views.DAY : Views.WEEK}
					views={[Views.MONTH, Views.WEEK, Views.DAY]}
					dayPropGetter={(date: Date) => ({
						className: moment(date).isSame(moment(), 'day')
							? 'bg-green-800 bg-opacity-30 border-l-4 border-green-500'
							: ''
					})}
					min={new Date(1970, 1, 1, 6, 0, 0)}
					max={new Date(1970, 1, 1, 22, 0, 0)}
				/>
			</div>

			{/* Event Details Modal */}
			<AnimatePresence>
				{selectedEvent && (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'
						onClick={() => setSelectedEvent(null)}>
						<motion.div
							initial={{ scale: 0.9 }}
							animate={{ scale: 1 }}
							exit={{ scale: 0.9 }}
							transition={{ duration: 0.2 }}
							className={`bg-gray-800 rounded-xl p-4 sm:p-6 ${isMobile ? 'w-full max-w-sm' : 'max-w-lg w-full'} shadow-lg border-2 border-green-500 max-h-[90vh] overflow-y-auto`}
							onClick={e => e.stopPropagation()}>
							<div className='flex justify-between items-center mb-4 sm:mb-6'>
								<h3 className={`${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl'} font-bold text-green-400`}>
									{selectedEvent.title}
								</h3>
								<button
									onClick={() => setSelectedEvent(null)}
									className='text-gray-400 hover:text-white transition-colors duration-200'>
									<FaTimes size={isMobile ? 20 : 28} />
								</button>
							</div>
							<div className={`space-y-4 sm:space-y-6 text-white text-sm sm:text-base`}>
								<p className='flex items-center'>
									<FaUser className='mr-3 text-green-400' size={16} />{' '}
									<strong>Coach:</strong> <span className="ml-2">{selectedEvent.coach}</span>
								</p>
								<p className='flex items-center'>
									<FaCalendarAlt className='mr-3 text-green-400' size={16} />{' '}
									<strong>Date:</strong>{' '}
									<span className="ml-2">{moment(selectedEvent.start).format('MMMM D, YYYY')}</span>
								</p>
								<p className='flex items-center'>
									<FaClock className='mr-3 text-green-400' size={16} />{' '}
									<strong>Time:</strong>{' '}
									<span className="ml-2">
										{moment(selectedEvent.start).format('HH:mm')} -{' '}
										{moment(selectedEvent.end).format('HH:mm')}
									</span>
								</p>
								<p className='flex items-center'>
									{selectedEvent.isGroup ? (
										<FaUsers className='mr-3 text-green-400' size={16} />
									) : (
										<FaUser className='mr-3 text-green-400' size={16} />
									)}
									<strong>Type:</strong>{' '}
									<span className="ml-2">{selectedEvent.isGroup ? 'Group' : 'Individual'}</span>
								</p>
								<p className='flex items-center'>
									<FaDumbbell className='mr-3 text-green-400' size={16} />{' '}
									<strong>Activity:</strong> <span className="ml-2">{selectedEvent.activity}</span>
								</p>
								<p className='flex items-start'>
									<FaUsers className='mr-3 text-green-400 mt-1' size={16} />{' '}
									<div>
										<strong>Clients:</strong>
										<div className='ml-2 mt-1 break-words'>{selectedEvent.clients}</div>
									</div>
								</p>
							</div>
							<div className={`flex ${isMobile ? 'flex-col space-y-3' : 'justify-end space-x-4'} mt-4 sm:mt-6`}>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										onCancelSession(selectedEvent.id, selectedEvent.isGroup)
										setSelectedEvent(null)
									}}
									className={`${isMobile ? 'w-full' : ''} px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors duration-200 text-sm sm:text-base`}>
									Cancel Session
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => setSelectedEvent(null)}
									className={`${isMobile ? 'w-full' : ''} px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base`}>
									Close
								</motion.button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

export default CalendarView