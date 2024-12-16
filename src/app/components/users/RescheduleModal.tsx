// components/users/RescheduleModal.tsx

import React, { useEffect, useState } from 'react'
import Modal from 'react-modal'
import DatePicker from 'react-datepicker'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FaCalendarAlt,
	FaClock,
	FaUser,
	FaDumbbell,
	FaChevronLeft,
	FaChevronRight,
	FaRegCalendarAlt,
	FaTimes,
	FaExclamationCircle,
	FaCalendarTimes
} from 'react-icons/fa'
import { RingLoader } from 'react-spinners'
import {
	fetchFilteredUnbookedTimeSlots,
	fetchFilteredUnbookedTimeSlotsGroup
} from '../../../../utils/userRequests'
import 'react-datepicker/dist/react-datepicker.css'

interface RescheduleModalProps {
	isOpen: boolean
	onClose: () => void
	reservation: any
	isGroup: boolean
	onReschedule: (
		newDate: string,
		newStartTime: string,
		newEndTime: string
	) => Promise<void>
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
	isOpen,
	onClose,
	reservation,
	isGroup,
	onReschedule
}) => {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [availableTimes, setAvailableTimes] = useState<string[]>([])
	const [selectedTime, setSelectedTime] = useState<string>('')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [highlightDates, setHighlightDates] = useState<Date[]>([])

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		}
		return () => {
			document.body.style.overflow = 'unset'
		}
	}, [isOpen])

	useEffect(() => {
		if (selectedDate && reservation) {
			fetchAvailableSlots()
		}
	}, [selectedDate, reservation])

	const CustomHeader = ({
		date,
		decreaseMonth,
		increaseMonth,
		prevMonthButtonDisabled,
		nextMonthButtonDisabled
	}: any) => (
		<div className='flex items-center justify-between px-6 py-4 bg-gray-800/50 border-b border-green-500/20'>
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
					{date.toLocaleString('default', { month: 'long', year: 'numeric' })}
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

	const formatDate = (date: Date | null): string => {
		if (!date) return ''
		return [
			date.getFullYear(),
			('0' + (date.getMonth() + 1)).slice(-2),
			('0' + date.getDate()).slice(-2)
		].join('-')
	}

	const fetchAvailableSlots = async () => {
		if (!selectedDate || !reservation) return

		setLoading(true)
		setError(null)

		try {
			const fetchFunction = isGroup
				? fetchFilteredUnbookedTimeSlotsGroup
				: fetchFilteredUnbookedTimeSlots

			const response = await fetchFunction({
				activityId: reservation.activity.id,
				coachId: reservation.coach.id,
				date: formatDate(selectedDate)
			})

			const times = response!.map(slot => {
				const startTime = slot.start_time.substr(0, 5)
				const endTime = slot.end_time.substr(0, 5)
				return `${startTime} - ${endTime}`
			})

			setAvailableTimes(times)

			// Set highlight dates
			const dates = response!.map(slot => new Date(slot.date))
			setHighlightDates(dates)
		} catch (error: any) {
			console.error('Error fetching available slots:', error)
			setError(error.message || 'Failed to fetch available times')
		} finally {
			setLoading(false)
		}
	}

	const handleReschedule = async () => {
		if (!selectedTime || !selectedDate) return

		const [startTime, endTime] = selectedTime.split(' - ')
		setLoading(true)

		try {
			await onReschedule(formatDate(selectedDate), startTime, endTime)
			onClose()
		} catch (error) {
			console.error('Error rescheduling:', error)
			setError('Failed to reschedule session')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			className=' bg-gray-900/95 rounded-3xl p-8  w-11/12 mx-auto border border-green-500/10 shadow-2xl backdrop-blur-xl'
			overlayClassName='fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50'
			style={{
				content: {
					position: 'relative',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)'
				}
			}}>
			<div className='relative bg-gray-900'>
				{/* Close Button */}
				<motion.button
					whileHover={{ scale: 1.1, rotate: 90 }}
					whileTap={{ scale: 0.9 }}
					onClick={onClose}
					className='absolute -top-2 -right-2 p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300'>
					<FaTimes size={20} />
				</motion.button>

				{/* Title */}
				<motion.h2
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className='text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent'>
					Reschedule {isGroup ? 'Group ' : ''}Session
				</motion.h2>

				{/* Current Reservation Info */}
				{reservation && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						className='mb-8 bg-gray-800/40 rounded-2xl p-6 border border-green-500/10 shadow-inner'>
						<div className='grid grid-cols-2 gap-6'>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-gray-700/50 rounded-xl'>
									<FaDumbbell className='text-green-400 text-xl' />
								</div>
								<span className='text-gray-300 font-medium'>
									{reservation.activity.name}
								</span>
							</div>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-gray-700/50 rounded-xl'>
									<FaUser className='text-green-400 text-xl' />
								</div>
								<span className='text-gray-300 font-medium'>
									{reservation.coach.name}
								</span>
							</div>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-gray-700/50 rounded-xl'>
									<FaCalendarAlt className='text-green-400 text-xl' />
								</div>
								<span className='text-gray-300 font-medium'>
									{reservation.date}
								</span>
							</div>
							<div className='flex items-center space-x-3'>
								<div className='p-2 bg-gray-700/50 rounded-xl'>
									<FaClock className='text-green-400 text-xl' />
								</div>
								<span className='text-gray-300 font-medium'>
									{reservation.start_time} - {reservation.end_time}
								</span>
							</div>
						</div>
					</motion.div>
				)}

				<div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
					{/* Date Picker Section */}
					<div className='space-y-4'>
						<h3 className='text-xl font-semibold text-green-400 mb-6 flex items-center'>
							<FaCalendarAlt className='mr-2' /> Select New Date
						</h3>
						<div className='bg-gray-800/50 p-4 rounded-2xl border border-green-500/10 shadow-lg'>
							<DatePicker
								selected={selectedDate}
								onChange={setSelectedDate}
								minDate={new Date()}
								inline
								renderCustomHeader={CustomHeader}
								calendarClassName='bg-transparent'
								dayClassName={() =>
									'text-gray-300 hover:bg-green-500/20 rounded-full'
								}
								highlightDates={highlightDates}
							/>
						</div>
					</div>

					{/* Time Selection Section */}
					{selectedDate && (
						<div className='space-y-4'>
							<h3 className='text-xl font-semibold text-green-400 mb-6 flex items-center'>
								<FaClock className='mr-2' /> Available Times
							</h3>
							<div className='bg-gray-800/50 p-6 rounded-2xl border border-green-500/10 shadow-lg min-h-[300px]'>
								{loading ? (
									<div className='flex justify-center items-center h-full'>
										<RingLoader color='#10B981' size={40} />
									</div>
								) : error ? (
									<p className='text-red-400 text-center flex items-center justify-center h-full'>
										<FaExclamationCircle className='mr-2' /> {error}
									</p>
								) : availableTimes.length === 0 ? (
									<p className='text-gray-400 text-center flex items-center justify-center h-full'>
										<FaCalendarTimes className='mr-2' /> No available times for
										this date
									</p>
								) : (
									<div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
										{availableTimes.map(time => (
											<motion.button
												key={time}
												onClick={() => setSelectedTime(time)}
												className={`p-4 rounded-xl text-white font-medium transition-all duration-300
                      ${
												selectedTime === time
													? 'bg-green-500 shadow-lg shadow-green-500/30'
													: 'bg-gray-700/50 hover:bg-gray-700 border border-green-500/10'
											}`}
												whileHover={{ scale: 1.03 }}
												whileTap={{ scale: 0.98 }}>
												{time}
											</motion.button>
										))}
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Action Buttons */}
				<motion.div
					className='flex justify-end gap-4 mt-8'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.2 }}>
					<motion.button
						onClick={onClose}
						className='px-6 py-3 rounded-xl bg-red-500/10 text-red-400 font-medium border border-red-500/10 hover:bg-red-500 hover:text-white transition-all duration-300'
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.98 }}>
						Cancel
					</motion.button>
					<motion.button
						onClick={handleReschedule}
						disabled={!selectedDate || !selectedTime || loading}
						className={`px-6 py-3 rounded-xl font-medium transition-all duration-300
          ${
						!selectedDate || !selectedTime || loading
							? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
							: 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30'
					}`}
						whileHover={
							selectedDate && selectedTime && !loading ? { scale: 1.03 } : {}
						}
						whileTap={
							selectedDate && selectedTime && !loading ? { scale: 0.98 } : {}
						}>
						Reschedule
					</motion.button>
				</motion.div>
			</div>

			<style jsx global>{`
    .react-datepicker {
      background: transparent !important;
      border: none !important;
      font-family: inherit !important;
    }
    .react-datepicker__header {
      background: transparent !important;
      border: none !important;
      padding-top: 1rem !important;
    }
    .react-datepicker__day {
      color: #D1D5DB !important;
      border-radius: 9999px !important;
      transition: all 0.2s !important;
    }
    .react-datepicker__day--highlighted {
      background-color: rgba(16, 185, 129, 0.2) !important;
      color: #10B981 !important;
    }
    .react-datepicker__day--selected {
      background-color: #10B981 !important;
      color: white !important;
    }
    .react-datepicker__day:hover {
      background-color: rgba(16, 185, 129, 0.4) !important;
    }
    .react-datepicker__day-name {
      color: #10B981 !important;
      font-weight: 500 !important;
    }
    .react-datepicker__current-month {
      color: #10B981 !important;
      font-weight: 600 !important;
      margin-bottom: 0.5rem !important;
    }
  `}</style>
		</Modal>
	)
}

export default RescheduleModal
