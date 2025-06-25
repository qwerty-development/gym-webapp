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

// Utility function to create dates without timezone issues
const createLocalDate = (year: number, month: number, day: number): Date => {
	// month is 0-indexed (0-11)
	return new Date(year, month, day, 0, 0, 0, 0);
}

// Utility function to create date from string without timezone issues
const createDateFromString = (dateString: string, timeString: string): Date => {
	const [year, month, day] = dateString.split('-').map(Number);
	const [hour, minute] = timeString.split(':').map(Number);
	// Use setFullYear to avoid timezone conversion issues
	const date = new Date();
	date.setFullYear(year, month - 1, day);
	date.setHours(hour, minute, 0, 0);
	return date;
}

// Utility function to create consistent date keys without timezone issues
const createDateKey = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

interface CalendarEvent {
	id: number
	title: string
	start: Date
	end: Date
	coach: string
	activity: string
	isGroup: boolean
	clients: string
	bgColor: string
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

// Placeholder components for mobile views
const MobileAgendaView = ({ events, onEventClick }: any) => {
	if (!events || events.length === 0) {
		return (
			<div className="p-6 text-center text-gray-400">No sessions for this day.</div>
		)
	}
	// Group events by hour
	const grouped = events.reduce((acc: any, event: any) => {
		const hour = new Date(event.start).getHours()
		if (!acc[hour]) acc[hour] = []
		acc[hour].push(event)
		return acc
	}, {})
	const sortedHours = Object.keys(grouped).sort((a, b) => Number(a) - Number(b))
	return (
		<div className="bg-gray-900 min-h-screen pb-24 w-full overflow-x-hidden">
			{/* Sticky Date Header */}
			<div className="sticky top-0 z-20 bg-gray-900 py-3 px-4 border-b border-green-500 flex items-center justify-between">
				<span className="text-lg font-bold text-green-400">
					{events[0] ? new Date(events[0].start).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
				</span>
			</div>
			<div className="divide-y divide-gray-800 w-full">
				{sortedHours.map(hour => (
					<div key={hour} className="py-2 w-full">
						<div className="text-xs text-gray-400 mb-2 pl-1">{hour.padStart(2, '0')}:00</div>
						<div className="flex flex-col gap-3 w-full">
							{grouped[hour].map((event: any) => (
								<div
									key={event.id}
									className="rounded-xl shadow-md p-4 flex flex-col gap-1 cursor-pointer w-full box-border"
									style={{ background: event.bgColor || '#10B981', color: '#fff' }}
									onClick={() => onEventClick(event)}
								>
									<div className="flex items-center justify-between w-full">
										<span className="font-semibold text-base">
											{event.title}
										</span>
										<span className="text-xs bg-black bg-opacity-20 rounded px-2 py-0.5">
											{new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									</div>
									<div className="flex items-center gap-2 mt-1">
										<span className="text-xs font-medium">
											Coach: {event.coach}
										</span>
										<span className="text-xs font-medium">
											{event.isGroup ? 'Group' : 'Individual'}
										</span>
									</div>
									<div className="text-xs opacity-80 mt-1 truncate">
										{event.clients}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
const MobileWeekView = ({ events, onEventClick, selectedDay, onDaySelect }: any) => {
	const [clickedDay, setClickedDay] = useState(selectedDay);

	// Update clickedDay when selectedDay prop changes
	useEffect(() => {
		setClickedDay(selectedDay);
	}, [selectedDay]);

	// Use clickedDay for week strip calculation
	const startOfWeek = (date: Date) => {
		const d = new Date(date)
		d.setDate(d.getDate() - d.getDay())
		d.setHours(0,0,0,0)
		return d
	}
	const endOfWeek = (date: Date) => {
		const d = new Date(date)
		d.setDate(d.getDate() + (6 - d.getDay()))
		d.setHours(23,59,59,999)
		return d
	}
	const weekStart = startOfWeek(clickedDay)
	const weekEnd = endOfWeek(clickedDay)
	const days = []
	for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate()+1 )) {
		days.push(new Date(d))
	}

	// Group events by day
	const eventsByDay: Record<string, any[]> = {}
	events.forEach((event: any) => {
		const d = new Date(event.start)
		const key = createDateKey(d)
		if (!eventsByDay[key]) eventsByDay[key] = []
		eventsByDay[key].push(event)
	})

	// Use the same selectedDay for consistency with single day view
	const selectedDayKey = createDateKey(selectedDay)
	const agendaEvents = eventsByDay[selectedDayKey] || []

	const handleDaySelect = (day: Date) => {
		setClickedDay(day); // for UI highlight
		onDaySelect(day); // update the main component's selectedDay
	}

	return (
		<div className="bg-gray-900 min-h-screen pb-24">
			{/* Horizontal scrollable week strip */}
			<div className="sticky top-0 z-20 bg-gray-900 py-2 px-2 border-b border-green-500 flex overflow-x-auto gap-2">
				{days.map((day, idx) => {
					const key = createDateKey(day)
					const isSelected = day.toDateString() === clickedDay.toDateString();
					const hasEvents = (eventsByDay[key] || []).length > 0
					return (
						<button
							key={key}
							onClick={() => handleDaySelect(day)}
							className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-all duration-150 ${isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-gray-800 text-green-400 border-gray-700'} ${hasEvents ? 'font-bold' : 'font-normal'}`}
							style={{ minWidth: 56 }}
						>
							<span className="text-xs">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
							<span className="text-lg">{day.getDate()}</span>
							{hasEvents && <span className="w-2 h-2 rounded-full mt-1" style={{ background: (eventsByDay[key] && eventsByDay[key][0].bgColor) || '#10B981' }}></span>}
						</button>
					)
				})}
			</div>
			{/* Agenda for selected day - same as single day view */}
			<MobileAgendaView events={agendaEvents} onEventClick={onEventClick} />
		</div>
	)
}
const MobileMonthView = ({ events, onEventClick, onDaySelect, selectedDay }: any) => {
	const [clickedDay, setClickedDay] = useState(selectedDay);

	// Update clickedDay when selectedDay prop changes
	useEffect(() => {
		setClickedDay(selectedDay);
	}, [selectedDay]);

	// Get the first day of the month
	const monthStart = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1)
	const monthEnd = new Date(selectedDay.getFullYear(), selectedDay.getMonth() + 1, 0)
	const startDayOfWeek = monthStart.getDay()
	const daysInMonth = monthEnd.getDate()

	// Build the grid: pad with previous month's days if needed
	const days: Date[] = []
	for (let i = 0; i < startDayOfWeek; i++) {
		days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), 1 - (startDayOfWeek - i)))
	}
	for (let i = 1; i <= daysInMonth; i++) {
		days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), i))
	}
	while (days.length % 7 !== 0) {
		days.push(new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + (days.length % 7) + 1 - (days.length % 7)))
	}

	// Group events by day
	const eventsByDay: Record<string, any[]> = {}
	events.forEach((event: any) => {
		const d = new Date(event.start)
		const key = createDateKey(d)
		if (!eventsByDay[key]) eventsByDay[key] = []
		eventsByDay[key].push(event)
	})

	// Use the same selectedDay for consistency with single day view
	const selectedDayKey = createDateKey(selectedDay)
	const agendaEvents = eventsByDay[selectedDayKey] || []

	const handleDaySelect = (day: Date) => {
		setClickedDay(day); // for UI highlight
		onDaySelect(day); // update the main component's selectedDay
	}

	const handleMonthChange = (direction: 'prev' | 'next') => {
		let newYear = selectedDay.getFullYear();
		let newMonth = direction === 'prev' ? selectedDay.getMonth() - 1 : selectedDay.getMonth() + 1;
		
		// Handle year transitions
		if (newMonth < 0) {
			newMonth = 11; // December
			newYear--;
		} else if (newMonth > 11) {
			newMonth = 0; // January
			newYear++;
		}
		
		const newDate = createLocalDate(newYear, newMonth, 1);
		onDaySelect(newDate)
	}

	return (
		<div className="bg-gray-900 min-h-screen pb-24">
			{/* Month grid */}
			<div className="sticky top-0 z-20 bg-gray-900 py-2 px-2 border-b border-green-500">
				<div className="flex items-center justify-between mb-2">
					<button
						onClick={() => handleMonthChange('prev')}
						className="text-green-400 px-2 py-1 rounded hover:bg-gray-800"
					>
						&lt;
					</button>
					<span className="text-lg font-bold text-green-400">
						{selectedDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
					</span>
					<button
						onClick={() => handleMonthChange('next')}
						className="text-green-400 px-2 py-1 rounded hover:bg-gray-800"
					>
						&gt;
					</button>
				</div>
				<div className="grid grid-cols-7 gap-1 text-xs text-center text-green-300 mb-1">
					{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
						<div key={d}>{d}</div>
					))}
				</div>
				<div className="grid grid-cols-7 gap-1">
					{days.map((day, idx) => {
						const key = createDateKey(day)
						const isCurrentMonth = day.getMonth() === selectedDay.getMonth()
						const isSelected = day.toDateString() === clickedDay.toDateString();
						const hasEvents = (eventsByDay[key] || []).length > 0
						return (
							<button
								key={key + idx}
								onClick={() => handleDaySelect(day)}
								className={`flex flex-col items-center justify-center aspect-square rounded-lg border transition-all duration-150 ${isSelected ? 'bg-green-500 text-white border-green-500' : isCurrentMonth ? 'bg-gray-800 text-green-400 border-gray-700' : 'bg-gray-800 text-gray-500 border-gray-800'} ${hasEvents ? 'font-bold' : 'font-normal'}`}
								style={{ minHeight: 44 }}
							>
								<span className="text-sm">{day.getDate()}</span>
								<div className="flex flex-wrap gap-0.5 mt-0.5 justify-center">
									{(eventsByDay[key] || []).slice(0, 3).map((event: any, i: number) => (
										<span
											key={event.id + '-' + i}
											className="w-2 h-2 rounded-full"
											style={{ background: event.bgColor || '#10B981' }}
										></span>
									))}
									{(eventsByDay[key] || []).length > 3 && (
										<span className="text-[10px] text-green-300 ml-0.5">+{(eventsByDay[key] || []).length - 3}</span>
									)}
								</div>
							</button>
						)
					})}
				</div>
			</div>
			{/* Agenda for selected day - same as single day view */}
			<MobileAgendaView events={agendaEvents} onEventClick={onEventClick} />
		</div>
	)
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
	const [mobileSelectedDay, setMobileSelectedDay] = useState(new Date())

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
		const calendarEvents = sessions.map(session => {
			// Create dates with proper timezone handling to avoid date shifting
			const startDate = createDateFromString(session.date, session.start_time);
			const endDate = createDateFromString(session.date, session.end_time);
			
			return {
				id: session.id,
				title: session.activities.name,
				start: startDate,
				end: endDate,
				coach: session.coaches.name,
				activity: session.activities.name,
				isGroup: 'count' in session,
				clients: Array.isArray(session.users)
					? session.users.map(u => `${u.first_name} ${u.last_name}`).join(', ')
					: `${session.users?.first_name} ${session.users?.last_name}`,
				bgColor: coachColors[session.coaches.name] // Add background color for mobile views
			}
		})
		setEvents(calendarEvents)
	}, [sessions, coachColors])

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

	// Mobile event click handler
	const handleMobileEventClick = (event: any) => {
		setSelectedEvent(event)
	}

	// Mobile view selector
	const mobileViewSelector = isMobile ? (
		<div className="sticky top-0 z-30 bg-gray-900 px-2 py-2 flex justify-start gap-2 border-b border-green-500">
			{[Views.DAY, Views.WEEK, Views.MONTH].map(v => (
				<button
					key={v}
					onClick={() => setView(v)}
					className={`px-4 py-2 rounded-full font-semibold transition-all duration-150 text-sm ${view === v ? 'bg-green-500 text-white' : 'bg-gray-800 text-green-400'}`}
				>
					{v.charAt(0) + v.slice(1).toLowerCase()}
				</button>
			))}
		</div>
	) : null

	// Decide which view to render on mobile
	if (isMobile) {
		return (
			<div className="bg-gray-900 min-h-screen">
				{mobileViewSelector}
				{view === Views.DAY && (
					<MobileAgendaView
						events={filteredEvents.filter(e =>
							moment(e.start).isSame(mobileSelectedDay, 'day')
						)}
						onEventClick={handleMobileEventClick}
					/>
				)}
				{view === Views.WEEK && (
					<MobileWeekView
						events={filteredEvents}
						onEventClick={handleMobileEventClick}
						selectedDay={mobileSelectedDay}
						onDaySelect={setMobileSelectedDay}
					/>
				)}
				{view === Views.MONTH && (
					<MobileMonthView
						events={filteredEvents}
						onEventClick={handleMobileEventClick}
						onDaySelect={setMobileSelectedDay}
						selectedDay={mobileSelectedDay}
					/>
				)}
			</div>
		)
	}

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
				className={`w-full overflow-x-hidden rounded-lg shadow-inner bg-gray-700 p-1 sm:p-4 ${isMobile ? 'mobile-calendar-container' : ''}`}
				style={calendarStyle}>
				<style jsx global>{`
					/* Mobile Calendar Styles */
					@media (max-width: 768px) {
						.rbc-calendar {
							font-size: 11px;
							width: 100vw !important;
							max-width: 100vw !important;
							margin: 0 !important;
							padding: 0 !important;
							overflow-x: hidden !important;
						}
						.rbc-time-view, .rbc-month-view, .rbc-day-view, .rbc-week-view {
							width: 100vw !important;
							max-width: 100vw !important;
							margin: 0 !important;
							padding: 0 !important;
						}
						.rbc-header, .rbc-time-header, .rbc-time-header-content {
							width: 100% !important;
							max-width: 100vw !important;
							box-sizing: border-box;
							position: sticky;
							top: 0;
							z-index: 10;
							background: #374151;
							border-bottom: 1px solid #10B981;
						}
						.rbc-time-content {
							min-height: 250px;
							max-width: 100vw !important;
							overflow-x: hidden !important;
						}
						.rbc-day-slot .rbc-event,
						.rbc-week-view .rbc-event,
						.rbc-day-view .rbc-event,
						.rbc-month-view .rbc-event {
							border-radius: 12px !important;
							box-shadow: 0 2px 8px rgba(16,185,129,0.10) !important;
							padding: 8px 6px !important;
							margin: 4px 0 !important;
							font-size: 12px !important;
							display: flex;
							align-items: center;
							min-height: 36px !important;
							cursor: pointer;
							transition: box-shadow 0.2s;
						}
						.rbc-event-content {
							white-space: normal !important;
							font-size: 12px !important;
							font-weight: 600;
							display: flex;
							align-items: center;
							gap: 6px;
						}
						.rbc-event:active, .rbc-event:focus {
							box-shadow: 0 4px 16px rgba(16,185,129,0.25) !important;
						}
						.rbc-day-bg {
							margin-bottom: 6px;
						}
						.mobile-calendar-container {
							height: 70vh !important;
							max-height: 70vh !important;
							overflow-y: auto !important;
							box-shadow: 0 8px 16px -8px rgba(0,0,0,0.2) inset;
							position: relative;
							width: 100vw !important;
							max-width: 100vw !important;
							left: 50%;
							transform: translateX(-50%);
						}
						.mobile-calendar-container::after {
							content: '';
							display: block;
							position: absolute;
							bottom: 0;
							left: 0;
							width: 100%;
							height: 18px;
							background: linear-gradient(to bottom, rgba(55,65,81,0), rgba(55,65,81,0.95));
							pointer-events: none;
						}
						/* Larger tap targets for navigation */
						.bg-gray-700, .bg-green-500 {
							min-width: 44px;
							min-height: 44px;
							font-size: 16px;
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

			{/* Floating Today Button for Mobile */}
			{isMobile && (
				<button
					onClick={() => {
						const today = new Date();
						setDate(today);
						setMobileSelectedDay(today);
					}}
					className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg p-4 flex items-center justify-center transition-all duration-300"
					style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.3)' }}
					aria-label="Go to Today"
				>
					<FaCalendarAlt size={22} />
				</button>
			)}
			{/* Scroll Down Indicator for Mobile */}
			{isMobile && (
				<div className="absolute left-1/2 transform -translate-x-1/2 bottom-2 z-40 pointer-events-none animate-bounce">
					<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
				</div>
			)}

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