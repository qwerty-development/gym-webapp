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
	FaDumbbell
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
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions }) => {
	const [events, setEvents] = useState<CalendarEvent[]>([])
	const [view, setView] = useState<View>(() => {
		if (typeof window !== 'undefined' && window.innerWidth < 640) {
			return Views.DAY
		}
		return Views.WEEK
	})
	const [date, setDate] = useState(new Date())
	const [selectedCoach, setSelectedCoach] = useState<string | null>(null)
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

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
				: `${session.users.first_name} ${session.users.last_name}`
		}))
		setEvents(calendarEvents)
	}, [sessions])

	const filteredEvents = selectedCoach
		? events.filter(event => event.coach === selectedCoach)
		: events

	const eventStyleGetter = useCallback(
		(event: CalendarEvent, start: Date, end: Date, isSelected: boolean) => {
			const style: React.CSSProperties = {
				backgroundColor: coachColors[event.coach],
				color: 'white',
				borderRadius: '8px',
				border: 'none',
				padding: '4px',
				fontSize: view === Views.MONTH ? '0.8rem' : '1rem',
				fontWeight: 'bold',
				boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'stretch',
				justifyContent: 'flex-start',
				height: '100%',
				minHeight: view === Views.MONTH ? '60px' : '80px',
				transition: 'all 0.3s ease',
				cursor: 'pointer',
				overflow: 'hidden'
			}

			return { style }
		},
		[coachColors, view]
	)

	const CustomEvent: React.FC<{ event: CalendarEvent; view: View }> = ({
		event,
		view
	}) => {
		return (
			<div
				className={`h-full flex flex-col justify-between p-2 ${
					view === Views.MONTH ? 'text-sm' : 'text-base'
				}`}
				onClick={() => setSelectedEvent(event)}
				title={`Activity: ${event.title}\nCoach: ${event.coach}\nClients: ${event.clients}`}>
				<div className='font-bold truncate'>{event.title}</div>
				<div className='truncate'>{event.coach}</div>
				<div className='truncate'>{event.clients}</div>
			</div>
		)
	}

	const CustomToolbar: React.FC<any> = toolbarProps => {
		const goToBack = () => toolbarProps.onNavigate('PREV')
		const goToNext = () => toolbarProps.onNavigate('NEXT')
		const goToCurrent = () => toolbarProps.onNavigate('TODAY')

		const label = () => {
			const date = moment(toolbarProps.date)
			return (
				<span className='text-xl sm:text-2xl font-bold text-green-400'>
					{date.format('MMMM')} {date.format('YYYY')}
				</span>
			)
		}

		return (
			<div className='flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 bg-gray-800 p-6 rounded-xl shadow-lg'>
				<div className='flex space-x-4 mb-4 sm:mb-0'>
					<button
						onClick={goToBack}
						className='bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg'>
						&lt;
					</button>
					<button
						onClick={goToNext}
						className='bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg'>
						&gt;
					</button>
					<button
						onClick={goToCurrent}
						className='bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg'>
						Today
					</button>
				</div>
				<div className='text-white mb-4 sm:mb-0'>{label()}</div>
				<div className='flex space-x-4'>
					<button
						onClick={() => toolbarProps.onView(Views.MONTH)}
						className={`${
							toolbarProps.view === Views.MONTH ? 'bg-green-500' : 'bg-gray-700'
						} hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
						Month
					</button>
					<button
						onClick={() => toolbarProps.onView(Views.WEEK)}
						className={`${
							toolbarProps.view === Views.WEEK ? 'bg-green-500' : 'bg-gray-700'
						} hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
						Week
					</button>
					<button
						onClick={() => toolbarProps.onView(Views.DAY)}
						className={`${
							toolbarProps.view === Views.DAY ? 'bg-green-500' : 'bg-gray-700'
						} hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}>
						Day
					</button>
				</div>
			</div>
		)
	}

	const calendarStyle = useMemo(
		() => ({
			height: view === Views.MONTH ? '1000px' : '1400px'
		}),
		[view]
	)

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
			className='bg-gray-800 rounded-xl p-6 sm:p-8 shadow-lg'>
			<div className='mb-8 flex flex-col sm:flex-row justify-between items-center flex-wrap'>
				<h3 className='text-3xl sm:text-4xl font-bold text-green-400 mb-4 sm:mb-0'>
					Calendar View
				</h3>
				<div className='flex items-center space-x-4'>
					<FaFilter className='text-green-400 text-xl' />
					<select
						value={selectedCoach || ''}
						onChange={e => setSelectedCoach(e.target.value || null)}
						className='bg-gray-700 text-white rounded-full p-3 border-2 border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg'>
						<option value=''>All Coaches</option>
						{Object.keys(coachColors).map(coach => (
							<option key={coach} value={coach}>
								{coach}
							</option>
						))}
					</select>
				</div>
			</div>
			<div
				className='overflow-auto rounded-lg shadow-inner bg-gray-700 p-4 sm:p-6'
				style={calendarStyle}>
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
							localizer.format(date, 'HH:mm', culture)) as any,
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
					defaultView={Views.WEEK}
					views={[Views.MONTH, Views.WEEK, Views.DAY]}
					dayPropGetter={(date: Date) => ({
						className: moment(date).isSame(moment(), 'day')
							? 'bg-green-800 bg-opacity-30 border-l-4 border-green-500'
							: ''
					})}
				/>
			</div>
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
							className='bg-gray-800 rounded-xl p-6 sm:p-8 max-w-lg w-full shadow-lg border-2 border-green-500'
							onClick={e => e.stopPropagation()}>
							<div className='flex justify-between items-center mb-6'>
								<h3 className='text-2xl sm:text-3xl font-bold text-green-400'>
									{selectedEvent.title}
								</h3>
								<button
									onClick={() => setSelectedEvent(null)}
									className='text-gray-400 hover:text-white transition-colors duration-200'>
									<FaTimes size={28} />
								</button>
							</div>
							<div className='space-y-6 text-white'>
								<p className='flex items-center text-base sm:text-lg'>
									<FaUser className='mr-3 text-green-400' size={20} />{' '}
									<strong>Coach:</strong> {selectedEvent.coach}
								</p>
								<p className='flex items-center text-base sm:text-lg'>
									<FaCalendarAlt className='mr-3 text-green-400' size={20} />{' '}
									<strong>Date:</strong>{' '}
									{moment(selectedEvent.start).format('MMMM D, YYYY')}
								</p>
								<p className='flex items-center text-base sm:text-lg'>
									<FaClock className='mr-3 text-green-400' size={20} />{' '}
									<strong>Time:</strong>{' '}
									{moment(selectedEvent.start).format('HH:mm')} -{' '}
									{moment(selectedEvent.end).format('HH:mm')}
								</p>
								<p className='flex items-center text-base sm:text-lg'>
									{selectedEvent.isGroup ? (
										<FaUsers className='mr-3 text-green-400' size={20} />
									) : (
										<FaUser className='mr-3 text-green-400' size={20} />
									)}
									<strong>Type:</strong>{' '}
									{selectedEvent.isGroup ? 'Group' : 'Individual'}
								</p>
								<p className='flex items-center text-base sm:text-lg'>
									<FaDumbbell className='mr-3 text-green-400' size={20} />{' '}
									<strong>Activity:</strong> {selectedEvent.activity}{' '}
								</p>
								<p className='flex items-start text-base sm:text-lg'>
									<FaUsers className='mr-3 text-green-400 mt-1' size={20} />{' '}
									<div>
										<strong>Clients:</strong>
										<div className='ml-2 mt-1'>{selectedEvent.clients}</div>
									</div>
								</p>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	)
}

export default CalendarView
