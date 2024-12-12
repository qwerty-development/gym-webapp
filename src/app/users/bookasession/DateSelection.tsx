'use client'
import React from 'react'
import DatePicker from 'react-datepicker'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronLeft, FaChevronRight, FaRegCalendarAlt } from 'react-icons/fa'
import 'react-datepicker/dist/react-datepicker.css'

const DateSelection = ({
	selectedDate,
	handleDateSelect,
	highlightDates
}: any) => {
	// Animation variants for the calendar
	const calendarVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 }
	}

	// Custom header component with animations
	const CustomHeader = ({
		date,
		decreaseMonth,
		increaseMonth,
		prevMonthButtonDisabled,
		nextMonthButtonDisabled
	}: any) => (
		<div className='flex items-center justify-between px-6 py-4 bg-gray-800/50  border-b border-green-500/20'>
			<motion.button
				whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
				whileTap={{ scale: 0.9 }}
				onClick={decreaseMonth}
				disabled={prevMonthButtonDisabled}
				className='p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'>
				<FaChevronLeft className='text-green-400 w-5 h-5' />
			</motion.button>

			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className='flex items-center space-x-2'>
				<FaRegCalendarAlt className='text-green-400 w-5 h-5' />
				<h2 className='text-xl font-bold text-green-400'>
					{date.toLocaleString('default', {
						month: 'long',
						year: 'numeric'
					})}
				</h2>
			</motion.div>

			<motion.button
				whileHover={{ scale: 1.1, backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
				whileTap={{ scale: 0.9 }}
				onClick={increaseMonth}
				disabled={nextMonthButtonDisabled}
				className='p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'>
				<FaChevronRight className='text-green-400 w-5 h-5' />
			</motion.button>
		</div>
	)

	// Custom day rendering with enhanced highlighting
	const renderDayContents = (day: number, date: Date) => {
		const isHighlighted = highlightDates?.some((highlightDate: Date) =>
			isSameDay(date, highlightDate)
		)
		const isToday = isSameDay(date, new Date())
		const isSelected = selectedDate && isSameDay(date, selectedDate)

		return (
			<motion.div
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				className={`relative w-10 h-10 flex items-center justify-center
          ${isHighlighted ? 'highlighted-date' : ''}
          ${isToday ? 'today-date' : ''}
          ${isSelected ? 'selected-date' : ''}
        `}>
				{isHighlighted && (
					<span className='absolute inset-0 bg-green-500/20 rounded-full' />
				)}
				{isToday && (
					<span className='absolute inset-0 border-2 border-blue-400 rounded-full' />
				)}
				<span className='relative z-10'>{day}</span>
			</motion.div>
		)
	}

	const isSameDay = (date1: Date, date2: Date) => {
		return (
			date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0]
		)
	}

	return (
		<motion.div
			variants={calendarVariants}
			initial='hidden'
			animate='visible'
			transition={{ duration: 0.4, ease: 'easeOut' }}
			className='calendar-wrapper'>
			<DatePicker
				selected={selectedDate}
				onChange={date => handleDateSelect(date)}
				inline
				renderCustomHeader={CustomHeader}
				renderDayContents={renderDayContents}
				calendarClassName='bg-gray-800 rounded-3xl shadow-2xl border-2 border-green-500/10 calendar-custom'
				dayClassName={date =>
					`day-base transition-all duration-300
          ${
						selectedDate && isSameDay(date, selectedDate) ? 'day-selected' : ''
					}`
				}
				weekDayClassName={() => 'text-green-400 font-semibold py-3'}
				minDate={new Date()}
				highlightDates={highlightDates}
				showPopperArrow={false}
			/>

			<style jsx global>{`
        .calendar-wrapper {
          --highlight-primary: #10B981;
          --highlight-secondary: #3B82F6;
          --highlight-text: #ffffff;
          --background-dark: #1F2937;
          --text-primary: #E5E7EB;
        }

        .calendar-custom {
          width: 360px !important;
          padding: 0 !important;
          background: linear-gradient(145deg, rgba(31, 41, 55, 0.9), rgba(31, 41, 55, 1)) !important;
          backdrop-filter: blur(10px) !important;
        }

        .react-datepicker {
          background: transparent !important;
          font-family: 'Inter', sans-serif !important;
        }

        .react-datepicker__month-container {
          background: transparent !important;
        }

        .react-datepicker__day {
          color: var(--text-primary) !important;
          width: 3rem !important;
          height: 3rem !important;
          line-height: 3rem !important;
          margin: 0.2rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
        }

        .react-datepicker__day:hover {
          background-color: rgba(16, 185, 129, 0.2) !important;
          color: var(--highlight-primary) !important;
          transform: scale(1.1) !important;
        }

        .highlighted-date {
          background-color: rgba(16, 185, 129, 0.2) !important;
          color: var(--highlight-primary) !important;
          font-weight: 600 !important;
        }

        .today-date {
          border-color: var(--highlight-secondary) !important;
          color: var(--highlight-secondary) !important;
          font-weight: 600 !important;
        }

        .selected-date {
          background-color: var(--highlight-primary) !important;
          color: var(--highlight-text) !important;
          font-weight: 600 !important;
        }

        .react-datepicker__day--disabled {
          color: #4B5563 !important;
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }

        .react-datepicker__day--disabled:hover {
          transform: none !important;
          background-color: transparent !important;
        }

        .react-datepicker__day-name {
          color: #9CA3AF !important;
          width: 3rem !important;
          line-height: 3rem !important;
          margin: 0.2rem !important;
          font-size: 0.9rem !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
        }

        .react-datepicker__current-month {
          padding: 1rem 0 !important;
          letter-spacing: 0.05em !important;
        }

        .react-datepicker__header {
          background: transparent !important;
          border-bottom: none !important;
          padding: 0 !important;
        }

        .react-datepicker__week {
          display: flex !important;
          justify-content: space-around !important;
          margin: 0.2rem 0 !important;
        }

        .react-datepicker__day--outside-month {
          opacity: 0.4 !important;
        }
      `}</style>
		</motion.div>
	)
}

export default DateSelection
