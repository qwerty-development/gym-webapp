'use client'
import React, { useState, useEffect } from 'react'
import NavbarComponent from '@/app/components/users/navbar'
import { UserButton, useUser } from '@clerk/nextjs'
import CalendarView from '@/app/components/admin/CalendarView'
import ChatBox from '@/app/components/users/ChatBox'
import {
	fetchReservations,
	fetchReservationsGroup,
	updateUserRecord,
	cancelReservation,
	cancelReservationGroup,
	fetchMarket,
	payForItems,
	payForGroupItems,
	claimTransaction,
	fetchShopTransactions,
	fetchUserEssentialTill
} from '../../../../../utils/userRequests'
import BulkCalendarAdd from '@/app/components/admin/BulkCalendarAdd'
import {
	fetchTotalUsers,
	fetchTotalActivities,
	fetchTodaysSessions,
	fetchAllBookedSlotsToday,
	fetchUpcomingSessions2 as fetchUpcomingSessions,
	cancelBookingIndividual,
	cancelGroupBooking
} from '../../../../../utils/adminRequests'
import { Menu, Transition } from '@headlessui/react'
import { AddToCalendarButton } from 'add-to-calendar-button-react'
import { RingLoader } from 'react-spinners'
import { useWallet } from '@/app/components/users/WalletContext'
import toast from 'react-hot-toast'
import Modal from 'react-modal'
import { motion, AnimatePresence } from 'framer-motion'
import {
	FaUser,
	FaCalendarAlt,
	FaUsers,
	FaClock,
	FaShoppingCart,
	FaCalendarPlus
} from 'react-icons/fa'
import Link from 'next/link'
import useConfirmationModal from '../../../../../utils/useConfirmationModel'
import ConfirmationModal from '@/app/components/users/ConfirmationModal'
import { FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa'
import TokenBalance from '@/app/components/users/TokenBalance'
import { supabaseClient } from '../../../../../utils/supabaseClient'
import LoyaltyCard from '@/app/components/users/LoyaltyCard'

type Reservation = {
	id: number
	date: string
	start_time: string
	end_time: string
	count?: number
	coach: {
		id?: number
		name: string
	}
	activity: {
		id?: number
		name: string
		credits: number
	}
	additions: string[]
}

type GroupReservation = {
	id: number
	date: string
	start_time: string
	end_time: string
	coach: {
		id?: number
		name: string
	}
	activity: {
		id?: string
		name: string
		credits: number
	}
	count: number
	additions: {
		user_id: string
		items: { id: string; name: string; price: number }[]
	}[]
}

type Activity = {
	id: number
	name: string
}

interface Session {
	activityName: string
	coachName: string
	startTime: string
	endTime: string
	date: string
	users: string[]
}

const LoadingOverlay = () => (
	<div className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50'>
		<div className='p-5 mx-auto text-center flex flex-col justify-center items-center rounded-lg'>
			<RingLoader color={'#10B981'} size={70} />
			<p className='mt-4 text-green-400 text-xl'>Cancelling reservation...</p>
		</div>
	</div>
)

export default function Dashboard() {
	const [adminIndividualSessions, setAdminIndividualSessions] = useState<any[]>(
		[]
	)

	const [adminGroupSessions, setAdminGroupSessions] = useState<any[]>([])
	const [showBulkCalendarAdd, setShowBulkCalendarAdd] = useState<any>(false)

	const [isChatOpen, setIsChatOpen] = useState(false)
	const [showCalendarView, setShowCalendarView] = useState(false)

	const [isCancelling, setIsCancelling] = useState(false)
	const [totalUsers, setTotalUsers] = useState(0)
	const [totalActivities, setTotalActivities] = useState(0)

	const [todaysSessions, setTodaysSessions] = useState(0)
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 6
	const {
		isOpen,
		message,
		showConfirmationModal,
		handleConfirm,
		handleCancels
	} = useConfirmationModal()
	const [modalIsOpen, setModalIsOpen] = useState<boolean>(false)
	const [selectedReservation, setSelectedReservation] = useState<
		Reservation | GroupReservation | null
	>(null)
	const [selectedItems, setSelectedItems] = useState<any[]>([])
	const [totalPrice, setTotalPrice] = useState<number>(0)
	const [activeTab, setActiveTab] = useState('individual')
	const [userData, setUserData] = useState<any>(null)

	const { isLoaded, isSignedIn, user } = useUser()

	const [reservations, setReservations] = useState<Reservation[]>([])
	const [groupReservations, setGroupReservations] = useState<
		GroupReservation[]
	>([])
	const [allSessions, setAllSessions] = useState<Session[]>([])

	const [isLoading, setIsLoading] = useState<boolean>(true) // State to track loading status
	const { refreshWalletBalance, refreshTokens } = useWallet()
	const [market, setMarket] = useState<any[]>([])
	const totalReservations = (
		activeTab === 'individual' ? reservations : groupReservations
	).length
	const [shopTransactions, setShopTransactions] = useState<any[]>([])

	const loadShopTransactions = async () => {
		const transactions = await fetchShopTransactions()
		setShopTransactions(transactions)
	}
	const [essentialTill, setEssentialTill] = useState<string | null>(null)

	useEffect(() => {
		if (user) {
			fetchUserData()
		}
	}, [user])

	const fetchUserData = async () => {
		setIsLoading(true)
		const supabase = await supabaseClient()
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('user_id', user?.id)
			.single()

		if (error) {
			console.error('Error fetching user data:', error)
		} else {
			setUserData(data)
		}
		setIsLoading(false)
	}

	useEffect(() => {
		const fetchEssentialTill = async () => {
			if (user) {
				const till = await fetchUserEssentialTill(user.id)
				setEssentialTill(till)
			}
		}

		fetchEssentialTill()
	}, [user])

	const renderEssentialTill = () => {
		if (!essentialTill) return null

		const tillDate = new Date(essentialTill)
		const now = new Date()

		if (tillDate > now) {
			return (
				<p className='text-sm md:text-base text-gray-200'>
					Essentials active until: {tillDate.toLocaleDateString()}
				</p>
			)
		}

		return null
	}

	useEffect(() => {
		if (user && user.publicMetadata.role === 'admin') {
			loadShopTransactions()
		}
	}, [user])
	const handleClaimTransaction = async (transactionId: string) => {
		const success = await claimTransaction(transactionId)

		if (success) {
			toast.success('Transaction claimed successfully')
			loadShopTransactions() // Refresh the transactions list
		} else {
			toast.error('Failed to claim transaction')
		}
	}

	useEffect(() => {
		if (user && user.publicMetadata.role === 'admin') {
			fetchShopTransactions()
		}
	}, [user])

	useEffect(() => {
		const fetchSessions = async () => {
			const individualSessions = await fetchUpcomingSessions('individual')
			const groupSessions = await fetchUpcomingSessions('group')
			setAdminIndividualSessions(individualSessions)
			setAdminGroupSessions(groupSessions)
		}
		fetchSessions()
	}, [])

	useEffect(() => {
		const fetchAllSessions = async () => {
			const fetchedSessions = await fetchAllBookedSlotsToday()
			setAllSessions(fetchedSessions)
		}
		fetchAllSessions()
	}, [isCancelling])

	useEffect(() => {
		const fetchMarketItems = async () => {
			const marketData = await fetchMarket()
			setMarket(marketData)
		}
		fetchMarketItems()
	}, [])

	useEffect(() => {
		const fetchAdminData = async () => {
			const users = await fetchTotalUsers()
			const activities = await fetchTotalActivities()

			const sessions = await fetchTodaysSessions()

			setTotalUsers(users)
			setTotalActivities(activities)

			setTodaysSessions(sessions)
		}

		fetchAdminData()
	}, [isCancelling])

	useEffect(() => {
		const fetchData = async () => {
			if (isLoaded && isSignedIn) {
				setIsLoading(true)
				await updateUserRecord({
					userId: user.id,
					email: user.emailAddresses[0]?.emailAddress,
					firstName: user.firstName,
					lastName: user.lastName,
					userName: user.username
				})

				const fetchedReservations = await fetchReservations(user.id)
				if (fetchedReservations) {
					const transformedReservations = fetchedReservations.map(
						(reservation: any) => ({
							id: reservation.id,
							date: reservation.date,
							start_time: reservation.start_time
								.split(':')
								.slice(0, 2)
								.join(':'),
							end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
							coach: {
								name: reservation.coach.name,
								id: reservation.coach.id,
								email: reservation.coach.email
							},
							activity: {
								name: reservation.activity.name,
								credits: reservation.activity.credits,
								id: reservation.activity.id
							},
							additions: reservation.additions
						})
					)

					setReservations(transformedReservations)
				}

				const fetchedGroupReservations = await fetchReservationsGroup(user.id)
				if (fetchedGroupReservations) {
					const transformedGroupReservations = fetchedGroupReservations.map(
						(reservation: any) => ({
							id: reservation.id,
							date: reservation.date,
							start_time: reservation.start_time
								.split(':')
								.slice(0, 2)
								.join(':'),
							end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
							coach: {
								name: reservation.coach.name,
								id: reservation.coach.id,
								email: reservation.coach.email
							},
							activity: {
								name: reservation.activity.name,
								credits: reservation.activity.credits,
								id: reservation.activity.id
							},
							count: reservation.count,
							additions: reservation.additions
								? reservation.additions.filter(
										(addition: any) => addition.user_id === user.id
								  )
								: []
						})
					)

					setGroupReservations(transformedGroupReservations)
				}

				setIsLoading(false)
			}
		}
		fetchData()
	}, [isLoaded, isSignedIn, user])

	const [buttonLoading, setButtonLoading] = useState(false)
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

		const totalPrice = newSelectedItems.reduce(
			(total, currentItem) => total + currentItem.price,
			0
		)
		setTotalPrice(totalPrice)
	}

	const handlePay = async () => {
		if (!user?.id || !selectedReservation) {
			toast.error('Missing required information')
			return
		}

		setButtonLoading(true)

		try {
			const response: any = selectedReservation?.count
				? await payForGroupItems({
						userId: user.id,
						activityId: selectedReservation.activity.id,
						coachId: selectedReservation.coach.id,
						date: selectedReservation.date,
						startTime: selectedReservation.start_time,
						selectedItems
				  })
				: await payForItems({
						userId: user.id,
						activityId: selectedReservation.activity.id,
						coachId: selectedReservation.coach.id,
						date: selectedReservation.date,
						startTime: selectedReservation.start_time,
						selectedItems
				  })

			if (response.error) {
				toast.error(response.error)
			} else {
				// Create success message including shake token usage if any
				const tokenMessage = response.shakeTokensUsed
					? ` (Used ${response.shakeTokensUsed} shake token${
							response.shakeTokensUsed > 1 ? 's' : ''
					  })`
					: ''
				toast.success(`Items added successfully!${tokenMessage}`)

				if (response!.tokensEarned > 0) {
					toast.success(response!.message, {
						duration: 5000, // Show for longer
						icon: '🎉',
						style: {
							background: '#10B981', // Green background
							color: 'white',
							fontWeight: 'bold'
						}
					})
				}

				// Reset states
				setSelectedItems([])
				setTotalPrice(0)
				setModalIsOpen(false)

				// Refresh balances
				refreshWalletBalance()
				refreshTokens()

				// Refresh reservations
				await refreshReservations()
			}
		} catch (error) {
			toast.error('An error occurred while processing your request')
			console.error('Payment error:', error)
		} finally {
			setButtonLoading(false)
		}
	}

	const refreshReservations = async () => {
		if (!user?.id) return

		try {
			// Fetch and transform individual reservations
			const fetchedReservations = await fetchReservations(user.id)
			if (fetchedReservations) {
				const transformedReservations = fetchedReservations.map(
					(reservation: any) => ({
						id: reservation.id,
						date: reservation.date,
						start_time: reservation.start_time.split(':').slice(0, 2).join(':'),
						end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
						coach: {
							name: reservation.coach.name,
							id: reservation.coach.id
						},
						activity: {
							name: reservation.activity.name,
							credits: reservation.activity.credits,
							id: reservation.activity.id
						},
						additions: reservation.additions
					})
				)
				setReservations(transformedReservations)
			}

			// Fetch and transform group reservations
			const fetchedGroupReservations = await fetchReservationsGroup(user.id)
			if (fetchedGroupReservations) {
				const transformedGroupReservations = fetchedGroupReservations.map(
					(reservation: any) => ({
						id: reservation.id,
						date: reservation.date,
						start_time: reservation.start_time.split(':').slice(0, 2).join(':'),
						end_time: reservation.end_time.split(':').slice(0, 2).join(':'),
						coach: {
							name: reservation.coach.name,
							id: reservation.coach.id,
							email: reservation.coach.email
						},
						activity: {
							name: reservation.activity.name,
							credits: reservation.activity.credits,
							id: reservation.activity.id
						},
						count: reservation.count,
						additions: reservation.additions
							? reservation.additions.filter(
									(addition: any) => addition.user_id === user.id
							  )
							: []
					})
				)
				setGroupReservations(transformedGroupReservations)
			}
		} catch (error) {
			console.error('Error refreshing reservations:', error)
			toast.error('Failed to refresh reservations')
		}
	}

	const openMarketModal = (reservation: Reservation | GroupReservation) => {
		setSelectedReservation(reservation)
		setModalIsOpen(true)
	}

	const handleCancel = async (reservationId: number) => {
		setButtonLoading(true)
		setIsCancelling(true)
		if (user) {
			const confirmed = await showConfirmationModal(
				'Are you sure you want to cancel this reservation?'
			)
			if (!confirmed) {
				setButtonLoading(false)
				setIsCancelling(false)
				return
			}

			const cancelled = await cancelReservation(
				reservationId,
				user.id,
				setReservations
			)

			if (cancelled) {
				refreshWalletBalance()
				refreshTokens()
				toast.success('Reservation cancelled successfully!')
			} else {
				toast.error('Failed to cancel reservation!')
			}
		}
		setButtonLoading(false)
		setIsCancelling(false)
	}

	const handleCancelAdminIndividual = async (session: any) => {
		setIsCancelling(true)
		const confirmed = await showConfirmationModal(
			'Are you sure you want to cancel this session?'
		)

		if (!confirmed) {
			setIsCancelling(false)
			return
		}

		const cancelled = await cancelBookingIndividual(session)

		if (cancelled) {
			toast.success('Session Cancelled Succesfully')
			setAdminIndividualSessions(prevSessions =>
				prevSessions.filter(s => s.id !== session.id)
			)
		} else {
			toast.error('Failed to Cancel Session')
		}

		setIsCancelling(false)
	}

	const handleCancelAdminGroup = async (id: any) => {
		setIsCancelling(true)
		const confirmed = await showConfirmationModal(
			'Are you sure you want to cancel this session?'
		)

		if (!confirmed) {
			setIsCancelling(false)
			return
		}

		const cancelled = await cancelGroupBooking(id)

		if (cancelled) {
			toast.success('Session Cancelled Succesfully')
			setAdminGroupSessions(prevSessions =>
				prevSessions.filter(s => s.id !== id)
			)
		} else {
			toast.error('Failed to Cancel Session')
		}

		setIsCancelling(false)
	}

	const handleCancelGroup = async (reservationId: number) => {
		setButtonLoading(true)
		setIsCancelling(true)
		if (user) {
			const confirmed = await showConfirmationModal(
				'Are you sure you want to cancel this group reservation?'
			)
			if (!confirmed) {
				setButtonLoading(false)
				setIsCancelling(false)
				return
			}

			const cancelled = await cancelReservationGroup(
				reservationId,
				user.id,
				setGroupReservations
			)

			if (cancelled) {
				refreshWalletBalance()
				refreshTokens()
				toast.success('Group reservation cancelled successfully!')
			} else {
				toast.error('Failed to cancel group reservation!')
			}
		}
		setButtonLoading(false)
		setIsCancelling(false)
	}

	if (!isLoaded || !isSignedIn) {
		return null
	}

	type UnifiedReservation = Reservation | GroupReservation

	const allReservations: UnifiedReservation[] = [
		...reservations,
		...groupReservations
	]

	const upcomingThisWeek = allReservations.filter(r => {
		const reservationDate = new Date(r.date)
		const today = new Date()
		const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
		return reservationDate >= today && reservationDate <= weekFromNow
	}).length

	const paginatedReservations = (
		activeTab === 'individual' ? reservations : groupReservations
	).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

	const totalPages = Math.max(1, Math.ceil(totalReservations / itemsPerPage))

	const renderAdminSessions = (sessions: any) => {
		return sessions.length === 0 ? (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-gray-800 rounded-xl p-8 text-center col-span-2'>
				<FaCalendarAlt className='text-green-500 text-5xl mb-4 mx-auto' />
				<p className='text-xl text-gray-300'>No upcoming sessions scheduled.</p>
			</motion.div>
		) : (
			sessions.map((session: any, index: any) => (
				<motion.div
					key={session.id}
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: index * 0.1 }}
					className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-green-500/30 transition duration-300'>
					<div className='p-6 space-y-4'>
						<div className='flex justify-between items-center mb-4'>
							<h3 className='text-2xl font-bold text-green-400'>
								{session.activities.name}
							</h3>
							<span className='text-sm bg-green-600 text-white px-2 text-nowrap py-1 rounded-full'>
								{session.activities.credits} Credits
							</span>
						</div>
						<div className='space-y-2 text-gray-300'>
							<p className='flex items-center'>
								<FaCalendarAlt className='mr-2 text-green-500' />
								{session.date}
							</p>
							<p className='flex items-center'>
								<FaClock className='mr-2 text-green-500' />
								{session.start_time} - {session.end_time}
							</p>
							<p className='flex items-center'>
								<FaUser className='mr-2 text-green-500' />
								{session.coaches.name}
							</p>
							{activeTab === 'individual' ? (
								<p className='flex items-center'>
									<FaUser className='mr-2 text-green-500' />
									Client:{' '}
									{`${session.users.first_name} ${session.users.last_name}`}
								</p>
							) : (
								<Menu as='div' className='relative inline-block text-center'>
									<div>
										<Menu.Button className='inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500'>
											Clients ({session.users.length})
											<FaChevronDown
												className='-mr-1 ml-2 h-5 w-5'
												aria-hidden='true'
											/>
										</Menu.Button>
									</div>
									<Transition
										as={React.Fragment}
										enter='transition ease-out duration-100'
										enterFrom='transform opacity-0 scale-95'
										enterTo='transform opacity-100 scale-100'
										leave='transition ease-in duration-75'
										leaveFrom='transform opacity-100 scale-100'
										leaveTo='transform opacity-0 scale-95'>
										<Menu.Items className='origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none'>
											<div className='py-1'>
												{session.users.map((user: any, userIndex: any) => (
													<Menu.Item key={userIndex}>
														{({ active }) => (
															<a
																href='#'
																className={`${
																	active
																		? 'bg-gray-600 text-gray-100'
																		: 'text-gray-300'
																} block px-4 py-2 text-sm`}>
																{`${user.first_name} ${user.last_name}`}
															</a>
														)}
													</Menu.Item>
												))}
											</div>
										</Menu.Items>
									</Transition>
								</Menu>
							)}
							{activeTab === 'group' && (
								<>
									<p className='flex items-center'>
										<FaUsers className='mr-2 text-green-500' />
										Capacity: {session.activities.capacity}
									</p>
								</>
							)}
						</div>
						<div className='bg-gray-700 rounded-lg p-3 mt-4'>
							<p className='text-sm text-gray-300'>
								<span className='font-semibold text-green-400'>Additions:</span>{' '}
								{session.additions && session.additions.length > 0 ? (
									activeTab === 'group' ? (
										<ul className='space-y-1'>
											{session.additions.map(
												(addition: any, addIndex: number) => (
													<li key={addIndex}>
														<span className='font-bold text-yellow-300'>
															{session.users.find(
																(user: any) => user.user_id === addition.user_id
															)?.first_name || 'Unknown'}
														</span>
														<span className='text-gray-300'>: </span>
														<span className='text-green-300'>
															{addition.items
																.map((item: any) => item.name)
																.join(', ')}
														</span>
													</li>
												)
											)}
										</ul>
									) : (
										session.additions
											.map((addition: any) =>
												typeof addition === 'string'
													? addition
													: addition.items
															.map((item: any) => item.name)
															.join(', ')
											)
											.join(', ')
									)
								) : (
									'No additions'
								)}
							</p>
						</div>
						{activeTab === 'group' && (
							<button
								onClick={() => handleCancelAdminGroup(session.id)}
								className='bg-red-500 p-1 rounded-lg hover:bg-red-600 hover:scale-105 '>
								Cancel Session
							</button>
						)}
						{activeTab !== 'group' && (
							<button
								onClick={() => handleCancelAdminIndividual(session)}
								className='bg-red-500 p-1 rounded-lg hover:bg-red-600 hover:scale-105 '>
								Cancel Session
							</button>
						)}
					</div>
				</motion.div>
			))
		)
	}

	return (
		<div className='min-h-screen bg-gray-700 text-white font-sans'>
			<ConfirmationModal
				isOpen={isOpen}
				message={message}
				onConfirm={handleConfirm}
				onCancel={handleCancels}
			/>
			<NavbarComponent />

			{/* Navigation Tabs */}
			<div className='lg:hidden sticky top-0 z-20 bg-gray-800 py-2 mb-4'>
				<div className='flex justify-center space-x-2'>
					<button
						onClick={() => setActiveTab('individual')}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'individual'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}>
						Individual
					</button>
					<button
						onClick={() => setActiveTab('group')}
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'group'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}>
						Class
					</button>
				</div>
			</div>

			{/* Sidebar for larger screens */}
			<div className='hidden lg:block fixed left-0 top-0 h-full w-max bg-gray-800 z-30 transform transition-transform duration-300 ease-in-out '>
				<h2 className='text-2xl font-bold mb-4 mt-16 md:mt-4 ml-1 text-green-500'>
					Menu
				</h2>
				<ul>
					<li
						className={`mb-5 p-2 px-6 ${
							activeTab === 'individual' ? 'bg-green-500' : ''
						}`}>
						<button
							onClick={() => setActiveTab('individual')}
							className={`flex items-center ${
								activeTab === 'group' ? 'hover:text-green-400' : ''
							} w-full text-left`}>
							<FaCalendarAlt size={35} className='mr-2' /> PT Reservations
						</button>
					</li>
					<li
						className={`mb-10 p-2 px-6 ${
							activeTab === 'group' ? 'bg-green-500' : ''
						}`}>
						<button
							onClick={() => setActiveTab('group')}
							className={`flex items-center ${
								activeTab === 'individual' ? 'hover:text-green-400' : ''
							} w-full text-left`}>
							<FaUsers size={35} className='mr-2' /> Class Reservations
						</button>
					</li>
				</ul>
			</div>

			<div className='lg:ml-64 p-4 md:p-8'>
				{/* User Profile Card */}
				<motion.div
					initial={{ opacity: 0, y: -50 }}
					animate={{ opacity: 1, y: 0 }}
					className='bg-green-600 rounded-lg p-4 md:p-6 mb-6 md:mb-8'>
					<div className='flex items-center'>
						<div className='mr-5'>
							<UserButton
								userProfileMode='navigation'
								userProfileUrl=''
								afterSignOutUrl='/'
								appearance={{
									elements: {
										userButtonBox: 'scale-150 pointer-events-none',
										userButtonOuterIdentifier: 'bg-green-500'
									}
								}}
							/>
						</div>
						<div>
							<h2 className='text-xl md:text-2xl font-bold'>
								{user.firstName} {user.lastName}
							</h2>
							<p className='text-sm md:text-base text-gray-200'>
								@{user.username}
							</p>
							{renderEssentialTill()}
						</div>
					</div>
				</motion.div>
				<div className='fixed bottom-4 right-4 z-50'>
					{isChatOpen ? (
						<div className='bg-gray-900 rounded-lg shadow-lg p-4 mb-16 w-80'>
							<button
								onClick={() => setIsChatOpen(false)}
								className='absolute top-2 right-2 text-gray-400 hover:text-white'>
								&times;
							</button>
							<ChatBox userData={userData} />
						</div>
					) : (
						<button
							onClick={() => setIsChatOpen(true)}
							className='bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-300'>
							<img
								src='/dancerobot.gif'
								alt='Dancing Robot'
								className='w-10 h-10'
							/>
						</button>
					)}
				</div>

				<AnimatePresence mode='wait'>
					{isLoading ? (
						<motion.div
							key='loader'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='flex justify-center items-center h-64'>
							<RingLoader color={'#10B981'} size={100} />
						</motion.div>
					) : (
						<motion.div
							key='content'
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='flex flex-col  md:-mt-0 lg:flex-row gap-8 '>
							<div className='lg:w-1/4 space-y-6 mt-0 md:mt-[4.57rem] '>
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									className='bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500'>
									<h3 className='text-2xl font-bold text-green-400 mb-4'>
										{user.publicMetadata.role === 'admin'
											? 'Admin Overview'
											: 'Quick Stats'}
									</h3>
									<div className='space-y-4'>
										{user.publicMetadata.role === 'admin' ? (
											<>
												<div>
													<p className='text-gray-300'>Total Users</p>
													<p className='text-3xl font-bold text-white'>
														{totalUsers}
													</p>
												</div>
												<div>
													<p className='text-gray-300'>Total Activities</p>
													<p className='text-3xl font-bold text-white'>
														{totalActivities}
													</p>
												</div>

												<div>
													<p className='text-gray-300'>Sessions Today</p>
													<p className='text-3xl font-bold text-white'>
														{todaysSessions}
													</p>
												</div>
											</>
										) : (
											<>
												<div>
													<p className='text-gray-300'>Total Reservations</p>
													<p className='text-3xl font-bold text-white'>
														{reservations.length + groupReservations.length}
													</p>
												</div>
												<div>
													<p className='text-gray-300'>Upcoming This Week</p>
													<p className='text-3xl font-bold text-white'>
														{upcomingThisWeek}
													</p>
												</div>
											</>
										)}
									</div>
								</motion.div>

								{user.publicMetadata.role !== 'admin' && (
									<motion.div
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.2 }}
										className='hidden md:block space-y-6'>
										{' '}
										<TokenBalance />
										<LoyaltyCard
											punches={userData?.punches || 0}
											shake_token={userData?.shake_token || 0}
											name={`${userData?.first_name} ${userData?.last_name}`}
											createdAt={userData?.created_at}
										/>
									</motion.div>
								)}
								{user.publicMetadata.role === 'admin' && (
									<motion.div
										initial={{ opacity: 0, x: 20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: 0.2 }}
										className=' bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500 overflow-y-auto max-h-[400px]'>
										<h3 className='text-2xl font-bold text-green-400 mb-4'>
											Sessions Left Today
										</h3>
										<ul className='space-y-4'>
											{allSessions
												.sort((a, b) => {
													const now = new Date()
													const aTime = new Date(`${a.date}T${a.startTime}`)
													const bTime = new Date(`${b.date}T${b.startTime}`)
													return (
														aTime.getTime() -
														now.getTime() -
														(bTime.getTime() - now.getTime())
													)
												})
												.map((session, index) => {
													const now = new Date()
													const startTime = new Date(
														`${session.date}T${session.startTime}`
													)
													const endTime = new Date(
														`${session.date}T${session.endTime}`
													)
													const isActive = now >= startTime && now <= endTime
													const isStartingSoon =
														startTime.getTime() - now.getTime() <=
															15 * 60 * 1000 && startTime > now

													return (
														<li
															key={index}
															className={`text-gray-300 p-2 rounded ${
																isActive
																	? 'shadow-lg shadow-green-400'
																	: isStartingSoon
																	? 'shadow-lg shadow-yellow-700'
																	: ''
															}`}>
															<div className='font-bold'>
																{session.activityName}
															</div>
															<div>Coach: {session.coachName}</div>
															<div>
																Time: {session.startTime.slice(0, 5)} -{' '}
																{session.endTime.slice(0, 5)}
															</div>
															<div>Users: {session.users.join(', ')}</div>
															{isActive && (
																<div className='text-green-400 font-bold'>
																	Active Now
																</div>
															)}
															{isStartingSoon && (
																<div className='text-yellow-400 font-bold'>
																	Starting Soon
																</div>
															)}
														</li>
													)
												})}
										</ul>
										{allSessions.length === 0 && (
											<p className='text-green-300 text-center'>
												No sessions left today
											</p>
										)}
									</motion.div>
								)}
								<motion.div
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.4 }}
									className=' bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500'>
									<h3 className='text-2xl font-bold text-green-400 mb-4  '>
										Quick Actions
									</h3>
									<div className='space-y-2'>
										{user.publicMetadata.role !== 'admin' && (
											<Link href='/users/bookasession'>
												<button className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200'>
													Book New Session
												</button>
											</Link>
										)}
										{user.publicMetadata.role === 'admin' && (
											<Link href='/admin/manage-users'>
												<button className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200'>
													Go To Admin Panel
												</button>
											</Link>
										)}
									</div>
								</motion.div>
							</div>
							{/* Reservations */}

							<div className='lg:w-3/4 space-y-8'>
								<div className='flex justify-between items-center flex-wrap mb-6'>
									<h2 className='text-3xl md:text-4xl font-bold tracking-tight text-green-400'>
										{activeTab === 'individual'
											? 'Personal Training Reservations'
											: 'Group Classes Reservations'}
									</h2>
									{user.publicMetadata.role === 'admin' && (
										<div className='flex gap-4'>
											<Link href='/admin/calendar-view'>
												<button className='flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition duration-200 mt-2 lg:mt-0'>
													<FaCalendarAlt className='mr-2' /> View Calendar
												</button>
											</Link>
											<motion.button
												onClick={() => setShowBulkCalendarAdd(true)}
												whileHover={{ scale: 1.05 }}
												whileTap={{ scale: 0.95 }}
												className='flex items-center bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200 mt-2 lg:mt-0'>
												<FaCalendarPlus className='mr-2' />
												Add to Calendar
											</motion.button>
										</div>
									)}
								</div>

								{user.publicMetadata.role === 'admin' ? (
									// Admin view
									showCalendarView ? (
										<CalendarView
											sessions={[
												...adminIndividualSessions,
												...adminGroupSessions
											]}
										/>
									) : (
										<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
											{renderAdminSessions(
												activeTab === 'individual'
													? adminIndividualSessions
													: adminGroupSessions
											)}
										</div>
									)
								) : (
									// Non-admin view
									<>
										{(activeTab === 'individual'
											? reservations
											: groupReservations
										).length === 0 ? (
											<motion.div
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												className='bg-gray-800 rounded-xl p-8 text-center shadow-lg'>
												<FaCalendarAlt className='text-green-500 text-5xl mb-4 mx-auto' />
												<p className='text-xl text-gray-300'>
													No upcoming reservations. Time to book your next
													session!
												</p>
											</motion.div>
										) : (
											<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
												{paginatedReservations.map((reservation, index) => (
													<motion.div
														key={reservation.id}
														initial={{ opacity: 0, y: 20 }}
														animate={{ opacity: 1, y: 0 }}
														transition={{ delay: index * 0.1 }}
														className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-green-500/30 transition duration-300'>
														<div className='p-6 space-y-4'>
															<div className='flex justify-between items-center mb-4'>
																<h3 className='text-xl font-bold text-green-400 truncate'>
																	{reservation.activity.name}
																</h3>
																<span className='text-sm bg-green-600 text-white px-2 py-1 rounded-full whitespace-nowrap'>
																	{reservation.activity.credits} Credits
																</span>
															</div>
															<div className='space-y-2 text-gray-300 text-sm'>
																<p className='flex items-center'>
																	<FaCalendarAlt className='mr-2 text-green-500' />
																	{reservation.date}
																</p>
																<p className='flex items-center'>
																	<FaClock className='mr-2 text-green-500' />
																	{reservation.start_time} -{' '}
																	{reservation.end_time}
																</p>
																<p className='flex items-center'>
																	<FaUser className='mr-2 text-green-500' />
																	{reservation.coach.name}
																</p>
																{activeTab === 'group' && (
																	<p className='flex items-center'>
																		<FaUsers className='mr-2 text-green-500' />
																		Attendance: {reservation.count}
																	</p>
																)}
															</div>
															<div className='bg-gray-700 rounded-lg p-3 mt-4 text-xs'>
																<p className='text-gray-300'>
																	<span className='font-semibold text-green-400'>
																		Additions:
																	</span>{' '}
																	{reservation.additions &&
																	reservation.additions.length > 0
																		? reservation.additions
																				.map(addition =>
																					typeof addition === 'string'
																						? addition
																						: addition.items
																								.map(item => item.name)
																								.join(', ')
																				)
																				.join(', ')
																		: 'No additions'}
																</p>
															</div>
															<div className='flex flex-col space-y-2 mt-4'>
																<div className='flex justify-center items-center'>
																	<AddToCalendarButton
																		name={`${reservation.activity.name} with ${reservation.coach.name}`}
																		startDate={reservation.date}
																		startTime={reservation.start_time}
																		endTime={reservation.end_time}
																		options={['Apple', 'Google']}
																		timeZone='Asia/Beirut'
																		buttonStyle='default'
																		styleLight='--btn-background: #ffffff; --btn-text: #000; --btn-shadow: none;'
																		styleDark='--btn-background: #10B981; --btn-text: #000; --btn-shadow: none;'
																		size='3'
																		inline
																	/>
																</div>
																<div className='flex flex-col sm:flex-row justify-between mt-4 space-y-2 sm:space-y-0 sm:space-x-2'>
																	<button
																		onClick={() => openMarketModal(reservation)}
																		className='bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex-grow'
																		disabled={buttonLoading}>
																		Add Items
																	</button>
																	<button
																		onClick={() =>
																			activeTab === 'individual'
																				? handleCancel(reservation.id)
																				: handleCancelGroup(reservation.id)
																		}
																		className='bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 flex-grow'
																		disabled={buttonLoading}>
																		Cancel
																	</button>
																</div>
															</div>
														</div>
													</motion.div>
												))}
											</div>
										)}
									</>
								)}
							</div>

							{/* New Sidebar */}
						</motion.div>
					)}
				</AnimatePresence>
				{totalPages > 1 && (
					<div className='flex justify-center items-center mt-8 space-x-4'>
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className='p-2 bg-green-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors duration-200'
							aria-label='Previous page'>
							<FaChevronLeft size={20} />
						</button>

						<span className='px-4 py-2 bg-gray-700 text-white rounded-md text-sm font-medium'>
							Page {currentPage} of {totalPages}
						</span>

						<button
							onClick={() =>
								setCurrentPage(prev => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className='p-2 bg-green-500 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors duration-200'
							aria-label='Next page'>
							<FaChevronRight size={20} />
						</button>
					</div>
				)}
			</div>

			{user.publicMetadata.role === 'admin' && (
				<div className=' space-y-8 mx-4 lg:ml-64 p-4 md:p-8'>
					<h2 className='text-3xl md:text-4xl font-bold tracking-tight mb-6 text-green-400'>
						Shop Transactions
					</h2>
					{shopTransactions.length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className='bg-gray-800 rounded-xl p-8 text-center'>
							<FaShoppingCart className='text-green-500 text-5xl mb-4 mx-auto' />
							<p className='text-xl text-gray-300'>
								No unclaimed transactions.
							</p>
						</motion.div>
					) : (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
							{shopTransactions.map((transaction, index) => (
								<motion.div
									key={transaction.transaction_id}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
									className='bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden shadow-xl hover:shadow-green-500/30 transition duration-300'>
									<div className='p-6 space-y-4'>
										<div className='flex justify-between items-center mb-4'>
											<h3 className='text-2xl font-bold text-green-400'>
												Transaction ID: {transaction.transaction_id}
											</h3>
											<span className='text-sm bg-green-600 text-white px-2 py-1 rounded-full'>
												{new Date(transaction.date).toLocaleString()}
											</span>
										</div>
										<div className='space-y-2 text-gray-300'>
											<p>User: {transaction.user_name}</p>
											<p>
												Items:{' '}
												{transaction.item_details.length > 0
													? transaction.item_details
															.map(
																(
																	item: {
																		name:
																			| string
																			| number
																			| boolean
																			| React.ReactElement<
																					any,
																					| string
																					| React.JSXElementConstructor<any>
																			  >
																			| Iterable<React.ReactNode>
																			| React.ReactPortal
																			| Promise<React.AwaitedReactNode>
																			| null
																			| undefined
																		quantity:
																			| string
																			| number
																			| boolean
																			| React.ReactElement<
																					any,
																					| string
																					| React.JSXElementConstructor<any>
																			  >
																			| Iterable<React.ReactNode>
																			| React.ReactPortal
																			| Promise<React.AwaitedReactNode>
																			| null
																			| undefined
																	},
																	itemIndex: React.Key | null | undefined
																) => (
																	<span key={itemIndex}>
																		{item.name} (x{item.quantity})
																	</span>
																)
															)
															.reduce(
																(prev: any, curr: any, index: number) =>
																	index === 0 ? [curr] : [prev, ', ', curr],
																[]
															)
													: 'No items'}
											</p>
										</div>
										<div className='flex justify-end'>
											<button
												onClick={() =>
													handleClaimTransaction(transaction.transaction_id)
												}
												className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200'>
												Claim
											</button>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Market Modal */}
			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Market Items'
				className='modal rounded-3xl p-4 sm:p-6 md:p-8 mx-auto mt-10 sm:mt-20 w-11/12 md:max-w-4xl'
				style={{
					content: {
						backgroundColor: 'rgba(31, 41, 55, 0.9)',
						backdropFilter: 'blur(16px)'
					}
				}}
				overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
				<h2 className='text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500'>
					Enhance Your Session
				</h2>
				<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8'>
					{market.map(item => (
						<motion.div
							key={item.id}
							className='bg-gray-700 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-green-400 hover:shadow-lg transition-all duration-300'>
							<div className='flex flex-col h-full'>
								{item.image && (
									<img
										src={item.image}
										alt={item.name}
										className='w-full h-32 object-cover mb-3 rounded-lg'
									/>
								)}
								<div className='flex justify-between items-center text-gray-300 mb-3 sm:mb-4'>
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
											? 'bg-red-500 hover:bg-red-600'
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
					<p className='text-xl sm:text-2xl font-bold text-green-400 mb-4 sm:mb-6'>
						Total Price: {totalPrice} Credits
					</p>
					<div className='flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-6'>
						<motion.button
							whileHover={{
								scale: 1.05,
								boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
							}}
							whileTap={{ scale: 0.95 }}
							className='bg-green-500 text-white py-2 sm:py-3 px-6 sm:px-8 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-green-600 disabled:opacity-50'
							onClick={handlePay}
							disabled={buttonLoading}>
							{buttonLoading ? 'Processing...' : 'Complete Purchase'}
						</motion.button>
						<motion.button
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='bg-red-500 text-white py-2 sm:py-3 px-6 sm:px-8 rounded-full text-lg sm:text-xl font-bold transition-all duration-300 hover:bg-red-600'
							onClick={() => setModalIsOpen(false)}>
							Close
						</motion.button>
					</div>
				</div>
			</Modal>
			{isCancelling && <LoadingOverlay />}
			{user.publicMetadata.role === 'admin' && (
				<BulkCalendarAdd
					sessions={
						activeTab === 'individual'
							? adminIndividualSessions
							: adminGroupSessions
					}
					isVisible={showBulkCalendarAdd}
					onClose={() => setShowBulkCalendarAdd(false)}
				/>
			)}
		</div>
	)
}
