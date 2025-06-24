// pages/admin/calendar-view.tsx
'use client'
import React, { useState, useEffect } from 'react'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import CalendarView from '@/app/components/admin/CalendarView'
import {
	fetchUpcomingSessions2 as fetchUpcomingSessions,
	cancelBookingIndividual,
	cancelGroupBooking
} from '../../../../utils/adminRequests'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { RingLoader } from 'react-spinners'

// Loading Overlay Component
const LoadingOverlay = () => (
	<motion.div
		initial={{ opacity: 0 }}
		animate={{ opacity: 1 }}
		exit={{ opacity: 0 }}
		className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50'>
		<div className='p-8 rounded-xl bg-gray-800 bg-opacity-50 text-center'>
			<RingLoader color='#10B981' size={60} className='mx-auto' />
			<p className='mt-4 text-xl text-green-400 font-semibold'>
				Cancelling session...
			</p>
		</div>
	</motion.div>
)

const CalendarViewPage = () => {
	const [adminIndividualSessions, setAdminIndividualSessions] = useState<any>(
		[]
	)
	const [adminGroupSessions, setAdminGroupSessions] = useState<any>([])
	const [isLoading, setIsLoading] = useState<any>(true)
	const [isCancelling, setIsCancelling] = useState<any>(false)
	const [error, setError] = useState<any>(null)
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

	const fetchSessions = async () => {
		try {
			setIsLoading(true)
			setError(null)
			const [individualSessions, groupSessions] = await Promise.all([
				fetchUpcomingSessions('individual'),
				fetchUpcomingSessions('group')
			])
			setAdminIndividualSessions(individualSessions)
			setAdminGroupSessions(groupSessions)
		} catch (err) {
			setError('Failed to fetch sessions')
			toast.error('Failed to load sessions')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		fetchSessions()
	}, [])

	const handleCancelSession = async (sessionId: number, isGroup: boolean) => {
		try {
			setIsCancelling(true)

			if (isGroup) {
				const result = await cancelGroupBooking(sessionId)
				if (result.success) {
					setAdminGroupSessions((prev: any[]) =>
						prev.filter((s: { id: number }) => s.id !== sessionId)
					)
					toast.success(
						result.message || 'Group session cancelled successfully'
					)
					await fetchSessions() // Refresh all sessions
				} else {
					toast.error(result.error || 'Failed to cancel group session')
				}
			} else {
				const session = adminIndividualSessions.find(
					(s: { id: number }) => s.id === sessionId
				)
				if (!session) {
					toast.error('Session not found')
					return
				}

				const reservation = {
					id: session.id,
					user: {
						user_id: session.users?.user_id
					},
					activity: {
						id: session.activities.id,
						name: session.activities.name
					}
				}

				const result = await cancelBookingIndividual(reservation)
				if (result.success) {
					setAdminIndividualSessions((prev: any[]) =>
						prev.filter((s: { id: number }) => s.id !== sessionId)
					)
					toast.success(
						result.message || 'Individual session cancelled successfully'
					)
					await fetchSessions()
				} else {
					toast.error(result.error || 'Failed to cancel individual session')
				}
			}
		} catch (error) {
			console.error('Error cancelling session:', error)
			toast.error('An unexpected error occurred while cancelling the session')
		} finally {
			setIsCancelling(false)
		}
	}

	if (error) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'>
				<AdminNavbarComponent />
				<div className='w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
					<div className='text-center text-red-400'>
						<h2 className='text-2xl font-bold mb-4'>Error Loading Sessions</h2>
						<button
							onClick={fetchSessions}
							className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
							Retry
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 w-full overflow-x-hidden'>
			<AdminNavbarComponent />
			<div className={`w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-12 ${isMobile ? 'overflow-x-hidden' : ''}`}>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='w-full'>
					<div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row justify-between items-center'} mb-4 sm:mb-8`}>
						<h1 className={`${isMobile ? 'text-xl text-center' : 'text-2xl sm:text-3xl'} font-bold text-green-400`}>
							Calendar View
						</h1>
						<button
							onClick={fetchSessions}
							disabled={isLoading || isCancelling}
							className={`${isMobile ? 'w-full' : 'w-auto'} px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95`}>
							Refresh Sessions
						</button>
					</div>

					{isLoading ? (
						<div className='flex justify-center items-center min-h-[200px] sm:h-64'>
							<RingLoader color='#10B981' size={48} />
						</div>
					) : (
						<div className='w-full'>
							<CalendarView
								sessions={[...adminIndividualSessions, ...adminGroupSessions]}
								onCancelSession={handleCancelSession}
							/>
						</div>
					)}
				</motion.div>
			</div>

			<AnimatePresence>{isCancelling && <LoadingOverlay />}</AnimatePresence>
		</div>
	)
}

export default CalendarViewPage