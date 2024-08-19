'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { motion } from 'framer-motion'
import Select from 'react-select'
import DatePicker from 'react-datepicker'
import {
	FaFilter,
	FaSortAmountDown,
	FaSortAmountUp,
	FaSearch,
	FaFileExport
} from 'react-icons/fa'
import { fetchActivities, fetchUsers } from '../../../../utils/adminRequests'
import SessionDetailModal from '@/app/components/admin/SessionDetailModal'
import SessionsChart from '@/app/components/admin/SessionsChart'
import { saveAs } from 'file-saver'
import 'react-datepicker/dist/react-datepicker.css'

const CompletedSessions = () => {
	const router = useRouter()
	const [users, setUsers] = useState<any>([])
	const [selectedUser, setSelectedUser] = useState<any>(null)
	const [sessions, setSessions] = useState<any>([])
	const [loading, setLoading] = useState<any>(false)
	const [currentPage, setCurrentPage] = useState<any>(1)
	const [totalPages, setTotalPages] = useState<any>(0)
	const [sortBy, setSortBy] = useState<any>('date')
	const [sortOrder, setSortOrder] = useState<any>('desc')
	const [filter, setFilter] = useState<any>('all')
	const [searchQuery, setSearchQuery] = useState<any>('')
	const [dateRange, setDateRange] = useState<any>([null, null])
	const [startDate, endDate] = dateRange
	const [summary, setSummary] = useState<any>(null)
	const [selectedSession, setSelectedSession] = useState<any>(null)
	const [searchTerm, setSearchTerm] = useState<any>('')
	const [activityType, setActivityType] = useState<any>('')

	useEffect(() => {
		fetchUsersList()
	}, [])

	useEffect(() => {
		if (selectedUser) {
			fetchCompletedSessions()
		}
	}, [selectedUser, currentPage, sortBy, sortOrder, filter, startDate, endDate])

	const fetchUsersList = async () => {
		const fetchedUsers = await fetchUsers(searchQuery)
		setUsers(
			fetchedUsers.map(user => ({
				value: user.user_id,
				label: `${user.first_name} ${user.last_name}`
			}))
		)
	}

	const fetchCompletedSessions = async () => {
		setLoading(true)
		const response = await fetch(
			`/api/completed-sessions?userId=${
				selectedUser.value
			}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}&filter=${filter}&startDate=${
				startDate?.toISOString().split('T')[0] || ''
			}&endDate=${
				endDate?.toISOString().split('T')[0] || ''
			}&activityType=${activityType}`
		)
		const data = await response.json()
		setSessions(data.sessions)
		setTotalPages(data.totalPages)
		setSummary(data.summary)
		setLoading(false)
	}

	const handleUserChange = (selectedOption: any) => {
		setSelectedUser(selectedOption)
		setCurrentPage(1)
	}

	const handleSort = (field: string) => {
		if (sortBy === field) {
			setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
		} else {
			setSortBy(field)
			setSortOrder('asc')
		}
	}

	const handleFilterChange = (e: { target: { value: any } }) => {
		setFilter(e.target.value)
		setCurrentPage(1)
	}

	const exportToCSV = () => {
		const headers = [
			'Date',
			'Activity',
			'Coach',
			'Type',
			'Start Time',
			'End Time'
		]
		const csvContent = [
			headers.join(','),
			...sessions.map(
				(session: {
					date: string | number | Date
					activity: { name: any }
					coach: { name: any }
					user_id: any
					start_time: any
					end_time: any
				}) =>
					[
						new Date(session.date).toLocaleDateString(),
						session.activity.name,
						session.coach.name,
						session.user_id ? 'Private' : 'Group',
						session.start_time,
						session.end_time
					].join(',')
			)
		].join('\n')

		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		saveAs(blob, `completed_sessions_${selectedUser.label}.csv`)
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 py-8'>
				<h1 className='text-4xl font-bold mb-8 text-center'>
					Completed Sessions
				</h1>

				<div className='mb-8'>
					<Select
						options={users}
						value={selectedUser}
						onChange={handleUserChange}
						placeholder='Select a user'
						className='react-select-container'
						classNamePrefix='react-select'
					/>
				</div>

				{selectedUser && (
					<>
						<div className='mb-4 flex flex-wrap justify-between items-center'>
							<select
								value={filter}
								onChange={handleFilterChange}
								className='bg-gray-700 text-white rounded-md px-3 py-2 mb-2 sm:mb-0'>
								<option value='all'>All Sessions</option>
								<option value='private'>Private Sessions</option>
								<option value='group'>Group Sessions</option>
							</select>

							<DatePicker
								selectsRange={true}
								startDate={startDate}
								endDate={endDate}
								onChange={update => {
									setDateRange(update)
									setCurrentPage(1)
								}}
								className='bg-gray-700 text-white rounded-md px-3 py-2 mb-2 sm:mb-0'
								placeholderText='Select date range'
							/>

							<button
								onClick={exportToCSV}
								className='px-4 py-2 bg-blue-600 text-white rounded-md flex items-center'>
								<FaFileExport className='mr-2' />
								Export to CSV
							</button>
						</div>

						{summary && (
							<div className='mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
								<div className='bg-gray-800 rounded-lg p-4'>
									<h3 className='text-xl font-bold mb-2'>Total Sessions</h3>
									<p className='text-3xl text-green-500'>
										{summary.totalSessions}
									</p>
								</div>
								<div className='bg-gray-800 rounded-lg p-4'>
									<h3 className='text-xl font-bold mb-2'>Private Sessions</h3>
									<p className='text-3xl text-blue-500'>
										{summary.totalPrivateSessions}
									</p>
								</div>
								<div className='bg-gray-800 rounded-lg p-4'>
									<h3 className='text-xl font-bold mb-2'>Group Sessions</h3>
									<p className='text-3xl text-purple-500'>
										{summary.totalGroupSessions}
									</p>
								</div>
								<div className='bg-gray-800 rounded-lg p-4'>
									<h3 className='text-xl font-bold mb-2'>
										Session Distribution
									</h3>
									<SessionsChart
										privateCount={summary.totalPrivateSessions}
										groupCount={summary.totalGroupSessions}
									/>
								</div>
							</div>
						)}

						{loading ? (
							<div className='flex justify-center items-center h-64'>
								<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
							</div>
						) : (
							<div className='overflow-x-auto'>
								<table className='min-w-full bg-gray-800 rounded-lg overflow-hidden'>
									<thead className='bg-gray-700'>
										<tr>
											{[
												'Date',
												'Activity',
												'Coach',
												'Type',
												'Start Time',
												'End Time'
											].map(header => (
												<th
													key={header}
													className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer'
													onClick={() => handleSort(header.toLowerCase())}>
													<div className='flex items-center'>
														{header}
														{sortBy === header.toLowerCase() &&
															(sortOrder === 'asc' ? (
																<FaSortAmountUp className='ml-1' />
															) : (
																<FaSortAmountDown className='ml-1' />
															))}
													</div>
												</th>
											))}
										</tr>
									</thead>
									<tbody className='divide-y divide-gray-700'>
										{sessions.map(
											(session: {
												sessionType: string
												id: React.Key | null | undefined
												date: string | number | Date
												activity: {
													name:
														| string
														| number
														| boolean
														| React.ReactElement<
																any,
																string | React.JSXElementConstructor<any>
														  >
														| Iterable<React.ReactNode>
														| React.ReactPortal
														| Promise<React.AwaitedReactNode>
														| null
														| undefined
												}
												coach: {
													name:
														| string
														| number
														| boolean
														| React.ReactElement<
																any,
																string | React.JSXElementConstructor<any>
														  >
														| Iterable<React.ReactNode>
														| React.ReactPortal
														| Promise<React.AwaitedReactNode>
														| null
														| undefined
												}
												user_id: any
												start_time:
													| string
													| number
													| boolean
													| React.ReactElement<
															any,
															string | React.JSXElementConstructor<any>
													  >
													| Iterable<React.ReactNode>
													| React.ReactPortal
													| Promise<React.AwaitedReactNode>
													| null
													| undefined
												end_time:
													| string
													| number
													| boolean
													| React.ReactElement<
															any,
															string | React.JSXElementConstructor<any>
													  >
													| Iterable<React.ReactNode>
													| React.ReactPortal
													| Promise<React.AwaitedReactNode>
													| null
													| undefined
											}) => (
												<tr
													key={session.id}
													className='hover:bg-gray-700 cursor-pointer'
													onClick={() => setSelectedSession(session)}>
													<td className='px-6 py-4 whitespace-nowrap'>
														{new Date(session.date).toLocaleDateString()}
													</td>
													<td className='px-6 py-4'>{session.activity.name}</td>
													<td className='px-6 py-4'>{session.coach.name}</td>
													<td className='px-6 py-4'>
														{session.sessionType === 'private'
															? 'Private'
															: 'Group'}
													</td>
													<td className='px-6 py-4'>{session.start_time}</td>
													<td className='px-6 py-4'>{session.end_time}</td>
												</tr>
											)
										)}
									</tbody>
								</table>
							</div>
						)}

						<div className='mt-4 flex justify-between items-center'>
							<button
								onClick={() =>
									setCurrentPage((prev: number) => Math.max(prev - 1, 1))
								}
								disabled={currentPage === 1}
								className='px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50'>
								Previous
							</button>
							<span>
								Page {currentPage} of {totalPages}
							</span>
							<button
								onClick={() =>
									setCurrentPage((prev: number) =>
										Math.min(prev + 1, totalPages)
									)
								}
								disabled={currentPage === totalPages}
								className='px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50'>
								Next
							</button>
						</div>
					</>
				)}

				{selectedSession && (
					<SessionDetailModal
						session={selectedSession}
						onClose={() => setSelectedSession(null)}
					/>
				)}
			</div>
		</div>
	)
}

export default CompletedSessions
