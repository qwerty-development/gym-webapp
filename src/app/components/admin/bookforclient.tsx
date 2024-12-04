'use client'
import { useEffect, useState, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import {
	fetchUsers,
	bookTimeSlotForClient,
	bookTimeSlotForClientGroup,
	fetchCoachesActivitiesGroup,
	fetchCoachesActivities
} from '../../../../utils/adminRequests'
import {
	fetchFilteredUnbookedTimeSlots,
	fetchFilteredUnbookedTimeSlotsGroup,
	fetchAllActivities,
	fetchAllActivitiesGroup,
	fetchMarket,
	payForGroupItems,
	payForItems
} from '../../../../utils/userRequests'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import SearchableSelect from './SearchableSelect'

import Select, { components } from 'react-select'
import toast from 'react-hot-toast'
import Modal from 'react-modal'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateLoader } from 'react-spinners'
import {
	FaRunning,
	FaHeart,
	FaBiking,
	FaDumbbell,
	FaFirstAid
} from 'react-icons/fa'
import { RiGroupLine, RiUserLine, RiUserSettingsLine } from 'react-icons/ri'
import { RiUserSearchLine } from 'react-icons/ri'

const CustomInput = (props: any) => (
	<components.Input {...props} autoComplete='off' />
)
const FadeInSection = ({ children, delay = 0 }: any) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5, delay }}>
		{children}
	</motion.div>
)

export default function BookForClient() {
	useEffect(() => {
		Modal.setAppElement('#__next')
	}, [])

	// Refs for scrolling
	const userRef = useRef<HTMLDivElement>(null)
	const activityRef = useRef<HTMLDivElement>(null)
	const coachRef = useRef<HTMLDivElement>(null)
	const dateRef = useRef<HTMLDivElement>(null)
	const confirmRef = useRef<HTMLDivElement>(null)

	const [activitiesLoading, setActivitiesLoading] = useState<boolean>(true)
	const [groupActivitiesLoading, setGroupActivitiesLoading] =
		useState<boolean>(true)
	const [coachesLoading, setCoachesLoading] = useState<boolean>(false)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [selectedTime, setSelectedTime] = useState<string>('')
	const [selectedActivity, setSelectedActivity] = useState<number | null>(null)
	const [selectedCoach, setSelectedCoach] = useState<number | null>(null)
	const [selectedUser, setSelectedUser] = useState<string | null>(null)
	const [market, setMarket] = useState<any[]>([])
	const [selectedItems, setSelectedItems] = useState<any[]>([])
	const [totalPrice, setTotalPrice] = useState<number>(0)
	const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)

	const [activities, setActivities] = useState<
		{ id: number; name: string; credits?: number }[]
	>([])
	const [activitiesGroup, setActivitiesGroup] = useState<
		{ id: number; name: string; credits?: number; capacity: number }[]
	>([])
	const [coaches, setCoaches] = useState<
		{
			profile_picture: string | undefined
			id: number
			name: string
			email: string
		}[]
	>([])
	const [availableTimes, setAvailableTimes] = useState<string[]>([])
	const [groupAvailableTimes, setGroupAvailableTimes] = useState<string[]>([])
	const [highlightDates, setHighlightDates] = useState<Date[]>([])
	const [loading, setLoading] = useState<boolean>(false)
	const [searchQuery, setSearchQuery] = useState<string>('')
	const [searchResults, setSearchResults] = useState<any[]>([])
	const [deductFromWallet, setDeductFromWallet] = useState(false)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true)

	const userOptions = searchResults.map(user => ({
		label: `${user.first_name} ${user.last_name}`,
		value: user.user_id
	}))

	const activityIcons: Record<number, JSX.Element> = {
		1: <FaHeart />,
		2: <FaBiking />,
		3: <FaRunning />,
		10: <FaDumbbell />,
		11: <FaFirstAid />
	}

	// Improved scrolling function
	const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
		if (ref && ref.current) {
			ref.current.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			})
		}
	}

	useEffect(() => {
		const fetchMarketItems = async () => {
			const marketData = await fetchMarket()
			setMarket(marketData)
		}
		fetchMarketItems()
	}, [])

	const handleItemSelect = (item: any) => {
		const alreadySelected = selectedItems.find(
			selectedItem => selectedItem.id === item.id
		)
		let newSelectedItems
		if (alreadySelected) {
			newSelectedItems = selectedItems.filter(
				selectedItem => selectedItem.id !== item.id
			)
		} else {
			newSelectedItems = [...selectedItems, item]
		}
		setSelectedItems(newSelectedItems)

		// Update total price (final cost might be lower due to shake tokens)
		const totalPrice = newSelectedItems.reduce(
			(total, currentItem) => total + currentItem.price,
			0
		)
		setTotalPrice(totalPrice)
	}

	const getTokenUsageInfo = () => {
		const proteinItems = selectedItems.filter(
			item =>
				item.name.toLowerCase().includes('protein shake') ||
				item.name.toLowerCase().includes('protein pudding')
		)

		if (proteinItems.length === 0) return null

		return (
			<p className='text-sm text-gray-400 mt-2'>
				* Protein items will use available shake tokens if any
			</p>
		)
	}

	const handlePay = async () => {
		setLoading(true)
		const response: any = isPrivateTraining
			? await payForItems({
					userId: selectedUser,
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime: selectedTime.split(' - ')[0],
					selectedItems
			  })
			: await payForGroupItems({
					userId: selectedUser,
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime: selectedTime.split(' - ')[0],
					selectedItems
			  })

		setLoading(false)
		if (response.error) {
			toast.error(response.error)
		} else {
			const tokenMessage =
				response!.shakeTokensUsed > 0
					? ` (Used ${response.shakeTokensUsed} shake tokens)`
					: ''
			toast.success(`Items added successfully!${tokenMessage}`)
			setSelectedItems([])
			setTotalPrice(0)
			setModalIsOpen(false)
		}
	}

	const openMarketModal = () => {
		setModalIsOpen(true)
	}

	useEffect(() => {
		const fetchInitialData = async () => {
			const activitiesData = await fetchAllActivities()
			setActivities(activitiesData)

			const groupActivitiesData = await fetchAllActivitiesGroup()
			setActivitiesGroup(groupActivitiesData)
		}
		fetchInitialData()
	}, [])

	useEffect(() => {
		const fetchCoachesData = async () => {
			if (selectedActivity) {
				setCoachesLoading(true)
				const coachesData = isPrivateTraining
					? await fetchCoachesActivities(selectedActivity)
					: await fetchCoachesActivitiesGroup(selectedActivity)
				setCoaches(coachesData)
				setSelectedCoach(null)
				setSelectedDate(null)
				setSelectedTime('')
				setAvailableTimes([])
				setGroupAvailableTimes([])
				setHighlightDates([])
				setCoachesLoading(false)
				setTimeout(() => scrollToRef(coachRef), 100)
			}
		}
		fetchCoachesData()
	}, [selectedActivity, isPrivateTraining])

	useEffect(() => {
		const resetDateAndTime = () => {
			setSelectedDate(null)
			setSelectedTime('')
		}

		if (selectedActivity && selectedCoach) {
			resetDateAndTime()
			setTimeout(() => scrollToRef(dateRef), 100)
		}
	}, [selectedCoach])

	const [selectedOptiontest, setSelectedOptiontest] = useState<any>(null)

	useEffect(() => {
		const fetchDatesAndTimes = async () => {
			if (selectedActivity && selectedCoach) {
				const data = isPrivateTraining
					? await fetchFilteredUnbookedTimeSlots({
							activityId: selectedActivity,
							coachId: selectedCoach,
							date: selectedDate ? formatDate(selectedDate) : undefined
					  })
					: await fetchFilteredUnbookedTimeSlotsGroup({
							activityId: selectedActivity,
							coachId: selectedCoach,
							date: selectedDate ? formatDate(selectedDate) : undefined
					  })
				if (data) {
					if (!selectedDate) {
						const datesForSelectedCoach = data
							.filter(
								(slot: { coach_id: number }) => slot.coach_id === selectedCoach
							)
							.map(
								(slot: { date: string | number | Date }) => new Date(slot.date)
							)
							.filter((date: Date) => date >= new Date())

						setHighlightDates(datesForSelectedCoach)
					}
					if (selectedDate) {
						const timesForSelectedDate = data
							.filter(
								(slot: { date: string | number | Date }) =>
									new Date(slot.date).toDateString() ===
									selectedDate.toDateString()
							)
							.map((slot: { start_time: string; end_time: string }) => {
								const startTime = slot.start_time.substr(0, 5)
								const endTime = slot.end_time.substr(0, 5)
								return `${startTime} - ${endTime}`
							})
						isPrivateTraining
							? setAvailableTimes(timesForSelectedDate)
							: setGroupAvailableTimes(timesForSelectedDate)
					}
				}
			}
		}

		fetchDatesAndTimes()
	}, [selectedActivity, selectedCoach, selectedDate, isPrivateTraining])

	const dayClassName = (date: Date) => {
		const isPastDate =
			date < new Date() &&
			date >= new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
		return `text-gray-200 hover:bg-green-500 hover:text-white ${
			isPastDate ? 'bg-yellow-500/20' : ''
		}`
	}

	const handleBookSession = async () => {
		if (
			!selectedUser ||
			!selectedActivity ||
			!selectedCoach ||
			!selectedDate ||
			!selectedTime
		) {
			alert('Please select all booking details')
			return
		}

		const selectedDateTime = new Date(
			`${selectedDate?.toISOString().split('T')[0]}T${
				selectedTime.split(' - ')[0]
			}`
		)
		if (selectedDateTime < new Date()) {
			const confirmPast = window.confirm(
				'You are booking a session in the past. Are you sure you want to continue?'
			)
			if (!confirmPast) return
		}

		setLoading(true)
		const [startTime, endTime] = selectedTime.split(' - ')
		const result = isPrivateTraining
			? await bookTimeSlotForClient({
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime,
					endTime,
					userId: selectedUser
			  })
			: await bookTimeSlotForClientGroup({
					activityId: selectedActivity,
					coachId: selectedCoach,
					date: formatDate(selectedDate),
					startTime,
					endTime,
					userId: selectedUser
			  })
		setLoading(false)

		if (result.error) {
			toast.error('Error booking session')
		} else {
			toast.success('Session booked successfully')
			window.location.reload()
		}
	}

	const handleCloseModal = () => {
		setModalIsOpen(false)
		setSelectedItems([])
		setTotalPrice(0)
		setSelectedActivity(null)
		setSelectedCoach(null)
		setSelectedDate(null)
		setSelectedTime('')
		setAvailableTimes([])
		setGroupAvailableTimes([])
		setHighlightDates([])
	}

	const getCapacity = () => {
		if (selectedActivity === null) {
			return 'No activity selected'
		}
		const activity = activitiesGroup.find(
			activity => activity.id === selectedActivity
		)
		return activity ? `${activity.capacity}` : ''
	}

	useEffect(() => {
		const fetchUsersData = async () => {
			const usersData = await fetchUsers(searchQuery)
			setSearchResults(usersData)
		}
		fetchUsersData()
	}, [searchQuery])

	const getSelectedReservationCount = async () => {
		if (selectedActivity && selectedCoach && selectedDate) {
			const data = await fetchFilteredUnbookedTimeSlotsGroup({
				activityId: selectedActivity,
				coachId: selectedCoach,
				date: formatDate(selectedDate)
			})
			return data ? data.reduce((total, slot) => total + slot.count, 0) : 0
		}
		return 0
	}
	const [reservationCount, setReservationCount] = useState<number>(0)

	useEffect(() => {
		const fetchReservationCount = async () => {
			const count = await getSelectedReservationCount()
			setReservationCount(count)
		}

		fetchReservationCount()
	}, [selectedActivity, selectedCoach, selectedDate, highlightDates])

	const formatDate = (date: Date | null): string =>
		date
			? [
					date.getFullYear(),
					('0' + (date.getMonth() + 1)).slice(-2),
					('0' + date.getDate()).slice(-2)
			  ].join('-')
			: ''

	return (
		<div
			className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'
			id='__next'>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h1 className='text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-700 mb-8 sm:mb-12 text-center'>
					Book a Session for a User
				</h1>

				<FadeInSection>
					<div
						ref={userRef}
						className='mb-16 bg-gray-700 text-white bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8'>
						<h2 className='text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-700 mb-6 text-center'>
							Select Your User
						</h2>
						<div className='relative'>
							<SearchableSelect
								options={userOptions}
								value={selectedOptiontest}
								onChange={(selectedOption: any) => {
									setSelectedOptiontest(selectedOption)
									setSelectedUser(selectedOption ? selectedOption.value : null)
									if (selectedOption) {
										setTimeout(() => scrollToRef(activityRef), 100)
									}
								}}
								placeholder='Search for a user...'
							/>
						</div>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className='mt-8 flex justify-center'>
							{selectedUser ? (
								<div className='text-center'>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={{ type: 'spring', stiffness: 260, damping: 20 }}
										className='w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 p-1 mx-auto mb-4 flex items-center justify-center'>
										<span className='text-4xl font-bold text-white'>
											{selectedOptiontest.label.charAt(0).toUpperCase()}
										</span>
									</motion.div>
									<p className='text-xl font-semibold text-green-400'>
										{selectedOptiontest.label}
									</p>
								</div>
							) : (
								<p className='text-gray-400 italic'>No User selected</p>
							)}
						</motion.div>
					</div>
				</FadeInSection>

				<FadeInSection>
					<div
						ref={activityRef}
						className='flex justify-center items-center space-x-4 mb-12'>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
								isPrivateTraining
									? 'bg-green-500 text-white shadow-lg'
									: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
							}`}
							onClick={() => {
								setIsPrivateTraining(true)
								setSelectedActivity(null)
								setSelectedCoach(null)
								setSelectedDate(null)
								setSelectedTime('')
							}}>
							<RiUserLine className='inline-block mr-2' />
							Private Training
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={`px-6 sm:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg font-semibold transition-all duration-300 ${
								!isPrivateTraining
									? 'bg-green-500 text-white shadow-lg'
									: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
							}`}
							onClick={() => {
								setIsPrivateTraining(false)
								setSelectedActivity(null)
								setSelectedCoach(null)
								setSelectedDate(null)
								setSelectedTime('')
							}}>
							<RiGroupLine className='inline-block mr-2' />
							Classes
						</motion.button>
					</div>
				</FadeInSection>

				<FadeInSection>
					<div className='section bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-16'>
						<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center'>
							Select Your {isPrivateTraining ? 'Activity' : 'Class'}
						</h2>
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
							{(isPrivateTraining ? activities : activitiesGroup).map(
								activity => (
									<motion.button
										key={activity.id}
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -20 }}
										whileHover={{
											scale: 1.05,
											boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
										}}
										whileTap={{ scale: 0.95 }}
										className={`flex flex-col items-center justify-center p-4 sm:p-8 rounded-2xl transition-all duration-300 ${
											selectedActivity === activity.id
												? 'bg-green-500 text-white'
												: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
										}`}
										onClick={() => {
											setSelectedActivity(activity.id)
											setSelectedCoach(null)
											setSelectedDate(null)
											setSelectedTime('')
										}}>
										<span className='text-4xl'>
											{activityIcons[activity.id]}
										</span>
										<span className='text-lg font-semibold'>
											{activity.name}
										</span>
									</motion.button>
								)
							)}
						</div>
					</div>
				</FadeInSection>

				{selectedActivity && (
					<FadeInSection delay={0.1}>
						<motion.div
							ref={coachRef}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className='section bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-16'>
							<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center'>
								Choose Your {isPrivateTraining ? 'Coach' : 'Instructor'}
							</h2>
							<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
								<AnimatePresence>
									{coaches.map(coach => (
										<motion.button
											key={coach.id}
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -20 }}
											whileHover={{
												scale: 1.05,
												boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
											}}
											whileTap={{ scale: 0.95 }}
											className={`p-3 sm:p-6 rounded-2xl transition-all duration-300 ${
												selectedCoach === coach.id
													? 'bg-green-500 text-white'
													: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
											}`}
											onClick={() => {
												setSelectedCoach(coach.id)
												setSelectedDate(null)
												setSelectedTime('')
											}}>
											<img
												src={coach.profile_picture}
												alt={`${coach.name}`}
												className='w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 object-cover border-4 border-green-400'
											/>
											<p className='text-lg sm:text-xl font-semibold'>
												{coach.name}
											</p>
										</motion.button>
									))}
								</AnimatePresence>
							</div>
						</motion.div>
					</FadeInSection>
				)}

				{selectedCoach && (
					<FadeInSection delay={0.2}>
						<motion.div
							ref={dateRef}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className='section bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-16'>
							<div className='flex flex-col lg:flex-row lg:space-x-12'>
								<div className='lg:w-1/2 mb-8 lg:mb-0'>
									<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center lg:text-left'>
										Select a Date
									</h2>
									<DatePicker
										selected={selectedDate}
										onChange={(date: Date) => {
											setSelectedDate(date)
											setSelectedTime('')
										}}
										inline
										calendarClassName='custom-datepicker rounded-xl shadow-lg bg-gray-800 border-none text-white'
										dayClassName={dayClassName}
										monthClassName={() => 'text-green-400'}
										weekDayClassName={() => 'text-green-300'}
										minDate={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
										highlightDates={highlightDates}
									/>
								</div>
								{selectedDate && (
									<div className='lg:w-1/2'>
										<h2 className='text-2xl sm:text-3xl font-bold text-green-400 mb-4 sm:mb-6 text-center lg:text-left'>
											Available Times
										</h2>
										<div className='grid grid-cols-2 gap-4'>
											<AnimatePresence>
												{(isPrivateTraining
													? availableTimes
													: groupAvailableTimes
												).map(time => (
													<motion.button
														key={time}
														initial={{ opacity: 0, y: 20 }}
														animate={{ opacity: 1, y: 0 }}
														exit={{ opacity: 0, y: -20 }}
														whileHover={{
															scale: 1.05,
															boxShadow: '0 0 20px rgba(74, 222, 128, 0.5)'
														}}
														whileTap={{ scale: 0.95 }}
														className={`p-3 sm:p-4 rounded-xl text-base sm:text-lg font-semibold transition-all duration-300 ${
															selectedTime === time
																? 'bg-green-500 text-white'
																: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
														}`}
														onClick={() => {
															setSelectedTime(time)
															setTimeout(() => scrollToRef(confirmRef), 100)
														}}>
														{time}
														{!isPrivateTraining && (
															<p className='text-sm mt-2'>
																Capacity: {reservationCount}/{getCapacity()}
															</p>
														)}
													</motion.button>
												))}
											</AnimatePresence>
										</div>
									</div>
								)}
							</div>
						</motion.div>
					</FadeInSection>
				)}

				{selectedTime && (
					<FadeInSection delay={0.3}>
						<motion.div
							ref={confirmRef}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className='section bg-gray-700 bg-opacity-50 backdrop-filter backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-16'>
							<div className='mt-12 text-center'>
								<p className='text-xl sm:text-2xl font-semibold text-green-400 mb-4 sm:mb-6'>
									Booking {isPrivateTraining ? 'private session' : 'class'} for{' '}
									{
										(isPrivateTraining ? activities : activitiesGroup).find(
											a => a.id === selectedActivity
										)?.name
									}{' '}
									with {coaches.find(c => c.id === selectedCoach)?.name} on{' '}
									{selectedDate?.toLocaleDateString()} at {selectedTime}.
								</p>
								<motion.button
									whileHover={{
										scale: 1.05,
										boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
									}}
									whileTap={{ scale: 0.95 }}
									type='button'
									onClick={handleBookSession}
									disabled={loading}
									className='rounded-full bg-green-500 px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-bold text-white transition-all duration-300 hover:bg-green-600 disabled:opacity-50'>
									{loading ? 'Processing...' : 'Confirm Booking'}
								</motion.button>
								<motion.button
									whileHover={{
										scale: 1.05,
										boxShadow: '0 0 30px rgba(59, 130, 246, 0.7)'
									}}
									whileTap={{ scale: 0.95 }}
									type='button'
									onClick={openMarketModal}
									disabled={loading}
									className='rounded-full bg-blue-500 px-8 sm:px-10 py-3 sm:py-4 text-lg sm:text-xl font-bold text-white transition-all duration-300 hover:bg-blue-600 disabled:opacity-50 ml-4'>
									Add Items
								</motion.button>
							</div>
						</motion.div>
					</FadeInSection>
				)}
			</motion.div>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Market Items'
				className='modal rounded-3xl p-4 sm:p-6 md:p-8 mx-auto mt-10 sm:mt-20 w-11/12 md:max-w-4xl'
				style={{
					content: {
						backgroundColor: 'rgba(53, 59, 53, 0.9)',
						backdropFilter: 'blur(16px)'
					}
				}}
				overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
				<h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-800'>
					Enhance Your Session
				</h2>
				<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8'>
					{market.map(item => (
						<motion.div
							key={item.id}
							className='bg-gray-700 rounded-xl p-4 sm:p-6 shadow-lg  hover:shadow-green-400 hover:shadow-lg transition-all duration-300  '>
							<div className='flex flex-col h-full'>
								<div className='flex justify-between items-center text-gray-300 mb-3 sm:mb-4'>
									{item.image && (
										<img
											src={item.image}
											alt={item.name}
											className='w-full h-32 object-cover mb-3 rounded-lg'
										/>
									)}
									<span className='font-semibold text-sm sm:text-lg'>
										{item.name}
									</span>
									<span className='text-lg sm:text-xl font-bold text-green-400'>
										{item.price} Credits
									</span>
								</div>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className={`mt-auto w-full py-2 sm:py-3 rounded-full text-white font-semibold text-sm sm:text-base transition-all duration-300 ${
										selectedItems.find(
											selectedItem => selectedItem.id === item.id
										)
											? 'bg-red-700 hover:bg-red-600'
											: 'bg-green-500 hover:bg-green-600'
									}`}
									onClick={() => handleItemSelect(item)}>
									{selectedItems.find(
										selectedItem => selectedItem.id === item.id
									)
										? 'Remove'
										: 'Add'}
								</motion.button>
							</div>
						</motion.div>
					))}
				</div>
				<div className='text-right'>
					<p className='text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-3 sm:mb-4 md:mb-6'>
						Total Price: {totalPrice} Credits
						{getTokenUsageInfo()}
					</p>
					<div className='flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-6'>
						<motion.button
							whileHover={{
								scale: 1.05,
								boxShadow: '0 0 30px rgba(54, 120, 58, 0.7)'
							}}
							whileTap={{ scale: 0.95 }}
							className='bg-green-500 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-green-600 disabled:opacity-50'
							onClick={handlePay}
							disabled={loading}>
							{loading ? 'Processing...' : 'Complete Purchase'}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='bg-red-500 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-red-600'
							onClick={handleCloseModal}>
							Close
						</motion.button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
