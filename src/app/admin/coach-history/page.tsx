'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Chart as ChartJS,
	ArcElement,
	Title,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'
import { supabaseClient } from '../../../../utils/supabaseClient'
import AdminNavbarComponent from '../../components/admin/adminnavbar'
import 'react-datepicker/dist/react-datepicker.css'
import { RingLoader } from 'react-spinners'
import { FaDownload, FaArrowLeft } from 'react-icons/fa'
import { CSVLink } from 'react-csv'
import DatePicker from 'react-datepicker'

ChartJS.register(
	ArcElement,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend
)

interface CoachStats {
	coachName: string
	totalSessions: number
	individualSessions: number
	groupSessions: number
	activityBreakdown: { [key: string]: number }
	popularTimeSlots: { [key: string]: number }
	tokenUsage: {
		withToken: number
		withoutToken: number
	}
}

interface SummaryStats {
	totalSessions: number
	topCoach: string
	topActivity: string
	averageSessionsPerDay: number
}

const QUICK_DATE_RANGES = [
	{ label: 'Last Week', days: 7 },
	{ label: 'Last Month', days: 30 },
	{ label: '3 Months', days: 90 },
	{ label: 'This Year', type: 'year' }
]

export default function CoachHistory() {
	const [dateRange, setDateRange] = useState({
		startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
		endDate: new Date()
	})
	const [showDatePicker, setShowDatePicker] = useState(false)
	const [coachStats, setCoachStats] = useState<CoachStats[]>([])
	const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null)
	const [loading, setLoading] = useState(true)
	const [selectedCoach, setSelectedCoach] = useState<string | 'all'>('all')
	const [selectedActivity, setSelectedActivity] = useState<string | 'all'>(
		'all'
	)
	const [coaches, setCoaches] = useState<string[]>([])
	const [activities, setActivities] = useState<string[]>([])
	const [detailedView, setDetailedView] = useState(false)
	const [csvData, setCSVData] = useState<any[]>([])
	const [expandedCoaches, setExpandedCoaches] = useState<Set<string>>(new Set())

	useEffect(() => {
		fetchData()
	}, [dateRange, selectedCoach, selectedActivity])

	const handleQuickDateRange = (option: {
		label: string
		days?: number
		type?: string
	}) => {
		const endDate = new Date()
		let startDate = new Date()

		if (option.days) {
			startDate.setDate(endDate.getDate() - option.days)
		} else if (option.type === 'year') {
			startDate = new Date(endDate.getFullYear(), 0, 1)
		}

		setDateRange({ startDate, endDate })
		setShowDatePicker(false)
	}

	const toggleCoachExpansion = (coachName: string) => {
		const newExpanded = new Set(expandedCoaches)
		if (newExpanded.has(coachName)) {
			newExpanded.delete(coachName)
		} else {
			newExpanded.add(coachName)
		}
		setExpandedCoaches(newExpanded)
	}

	const fetchData = async () => {
		setLoading(true)
		const supabase = await supabaseClient()

		// Fetch individual sessions
		const { data: individualSessions, error: individualError } = await supabase
			.from('time_slots')
			.select(
				`
        id,
        coach:coaches (name),
        activity:activities (name),
        date,
        start_time,
        booked,
        user_id,
        additions,
        booked_with_token
      `
			)
			.gte('date', dateRange.startDate.toISOString().split('T')[0])
			.lte('date', dateRange.endDate.toISOString().split('T')[0])
			.eq('booked', true)

		// Fetch group sessions
		const { data: groupSessions, error: groupError } = await supabase
			.from('group_time_slots')
			.select(
				`
        id,
        coach:coaches (name),
        activity:activities (name),
        date,
        start_time,
        user_id,
        count,
        booked,
        additions,
        booked_with_token
      `
			)
			.gte('date', dateRange.startDate.toISOString().split('T')[0])
			.lte('date', dateRange.endDate.toISOString().split('T')[0])
			.gt('count', 0)

		if (individualError || groupError) {
			console.error('Error fetching data:', individualError || groupError)
			return
		}

		// Process data and create coach statistics
		const statsMap = new Map<string, CoachStats>()
		let totalSessions = 0

		// Process individual sessions
		individualSessions?.forEach((session: any) => {
			const coachName = session.coach?.name || 'Unknown'
			if (!statsMap.has(coachName)) {
				statsMap.set(coachName, createInitialCoachStats(coachName))
			}

			const stats = statsMap.get(coachName)!
			stats.totalSessions++
			stats.individualSessions++
			totalSessions++

			stats.activityBreakdown[session.activity?.name || 'Unknown'] =
				(stats.activityBreakdown[session.activity?.name || 'Unknown'] || 0) + 1
			stats.popularTimeSlots[session.start_time.slice(0, 5)] =
				(stats.popularTimeSlots[session.start_time.slice(0, 5)] || 0) + 1

			if (session.booked_with_token) {
				stats.tokenUsage.withToken++
			} else {
				stats.tokenUsage.withoutToken++
			}
		})

		// Process group sessions
		groupSessions?.forEach((session: any) => {
			const coachName = session.coach?.name || 'Unknown'
			if (!statsMap.has(coachName)) {
				statsMap.set(coachName, createInitialCoachStats(coachName))
			}

			const stats = statsMap.get(coachName)!
			stats.totalSessions++
			stats.groupSessions++
			totalSessions++

			stats.activityBreakdown[session.activity?.name || 'Unknown'] =
				(stats.activityBreakdown[session.activity?.name || 'Unknown'] || 0) + 1
			stats.popularTimeSlots[session.start_time.slice(0, 5)] =
				(stats.popularTimeSlots[session.start_time.slice(0, 5)] || 0) + 1

			const tokenUsers = session.booked_with_token?.length || 0
			stats.tokenUsage.withToken += tokenUsers
			stats.tokenUsage.withoutToken +=
				(session.user_id?.length || 0) - tokenUsers
		})

		// Calculate summary statistics
		const summaryStats: any = {
			totalSessions,
			topCoach: [...statsMap.entries()].sort(
				(a, b) => b[1].totalSessions - a[1].totalSessions
			)[0][0],
			topActivity: [...statsMap.values()]
				.flatMap(stats => Object.entries(stats.activityBreakdown))
				.reduce((acc, [activity, count]) => {
					acc[activity] = (acc[activity] || 0) + count
					return acc
				}, {} as { [key: string]: number }),
			averageSessionsPerDay:
				totalSessions /
				((dateRange.endDate.getTime() - dateRange.startDate.getTime()) /
					(1000 * 60 * 60 * 24))
		}
		setSummaryStats(summaryStats)

		// Filter data based on selected coach and activity
		let filteredStats = Array.from(statsMap.values())
		if (selectedCoach !== 'all') {
			filteredStats = filteredStats.filter(
				stat => stat.coachName === selectedCoach
			)
		}
		if (selectedActivity !== 'all') {
			filteredStats = filteredStats.filter(
				stat => stat.activityBreakdown[selectedActivity] > 0
			)
		}

		// Prepare CSV data
		const csvData = filteredStats.map(coach => ({
			Coach: coach.coachName,
			'Total Sessions': coach.totalSessions,
			'Individual Sessions': coach.individualSessions,
			'Group Sessions': coach.groupSessions,
			'Sessions with Tokens': coach.tokenUsage.withToken,
			'Sessions without Tokens': coach.tokenUsage.withoutToken,
			'Time Period': `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
		}))

		// Update state
		setCoachStats(filteredStats)
		setCSVData(csvData)
		setCoaches(['all', ...new Set(Array.from(statsMap.keys()))])
		setActivities([
			'all',
			...new Set(
				filteredStats.flatMap(stat => Object.keys(stat.activityBreakdown))
			)
		])
		setLoading(false)
	}

	const createInitialCoachStats = (coachName: string): CoachStats => ({
		coachName,
		totalSessions: 0,
		individualSessions: 0,
		groupSessions: 0,
		activityBreakdown: {},
		popularTimeSlots: {},
		tokenUsage: {
			withToken: 0,
			withoutToken: 0
		}
	})

	const getChartData = (coach: CoachStats) => ({
		sessionTypeData: {
			labels: Object.keys(coach.activityBreakdown),
			datasets: [
				{
					data: Object.values(coach.activityBreakdown),
					backgroundColor: [
						'#10B981',
						'#3B82F6',
						'#F59E0B',
						'#EF4444',
						'#8B5CF6',
						'#EC4899'
					]
				}
			]
		},
		timeSlotData: {
			labels: Object.keys(coach.popularTimeSlots).sort(),
			datasets: [
				{
					label: 'Sessions per Time Slot',
					data: Object.entries(coach.popularTimeSlots)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([_, value]) => value),
					backgroundColor: '#3B82F6',
					borderColor: '#2563EB',
					borderWidth: 1
				}
			]
		}
	})

	return (
		<div className='min-h-screen bg-gray-900'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 py-8'>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
					className='mb-8'>
					<div className='flex justify-between items-center mb-6'>
						<div className='flex items-center'>
							{detailedView && (
								<button
									onClick={() => setDetailedView(false)}
									className='mr-4 text-green-400 hover:text-green-500'>
									<FaArrowLeft size={24} />
								</button>
							)}
							<h1 className='text-4xl font-bold text-green-400'>
								{detailedView ? 'Coach Details' : 'Coach History'}
							</h1>
						</div>
						<CSVLink
							data={csvData}
							filename={`coach-history-${dateRange.startDate.toLocaleDateString()}-${dateRange.endDate.toLocaleDateString()}.csv`}
							className='flex items-center px-4 py-2 bg-green-500 rounded-lg hover:bg-green-600 transition-colors'>
							<FaDownload className='mr-2' />
							Export Data
						</CSVLink>
					</div>

					{/* Filters Section */}
					<div className='bg-gray-800 p-6 rounded-xl shadow-lg mb-8'>
						<div className='flex flex-col space-y-4'>
							{/* Date Selection */}
							<div>
								{/* Quick Range Selectors */}
								<div className='flex gap-2 mb-4'>
									{QUICK_DATE_RANGES.map(range => (
										<button
											key={range.label}
											onClick={() => handleQuickDateRange(range)}
											className='px-3 py-1 bg-gray-700 text-white rounded-full hover:bg-gray-600 transition-colors'>
											{range.label}
										</button>
									))}
								</div>

								<div className='flex gap-4'>
									<DatePicker
										selected={dateRange.startDate}
										onChange={date =>
											date && setDateRange({ ...dateRange, startDate: date })
										}
										selectsStart
										startDate={dateRange.startDate}
										endDate={dateRange.endDate}
										className='bg-gray-700 text-white px-4 py-2 rounded-lg border border-green-500 w-full'
									/>
									<DatePicker
										selected={dateRange.endDate}
										onChange={date =>
											date && setDateRange({ ...dateRange, endDate: date })
										}
										selectsEnd
										startDate={dateRange.startDate}
										endDate={dateRange.endDate}
										minDate={dateRange.startDate}
										className='bg-gray-700 text-white px-4 py-2 rounded-lg border border-green-500 w-full'
									/>
								</div>
							</div>

							{/* Filters Row */}
							<div className='flex gap-4'>
								<select
									value={selectedCoach}
									onChange={e => setSelectedCoach(e.target.value)}
									className='bg-gray-700 text-white px-4 py-2 rounded-lg border border-green-500 flex-1'>
									{coaches.map(coach => (
										<option key={coach} value={coach}>
											{coach === 'all' ? 'All Coaches' : coach}
										</option>
									))}
								</select>

								<select
									value={selectedActivity}
									onChange={e => setSelectedActivity(e.target.value)}
									className='bg-gray-700 text-white px-4 py-2 rounded-lg border border-green-500 flex-1'>
									{activities.map(activity => (
										<option key={activity} value={activity}>
											{activity === 'all' ? 'All Activities' : activity}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>

					{/* Loading State */}
					{loading ? (
						<div className='flex justify-center items-center h-64'>
							<RingLoader color='#10B981' size={60} />
						</div>
					) : (
						<>
							{/* Summary View */}
							{!detailedView && summaryStats && (
								<div className='mb-8'>
									<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'>
										<motion.div
											initial={{ opacity: 0, y: 20 }}
											animate={{ opacity: 1, y: 0 }}
											className='bg-gray-800 p-6 rounded-xl shadow-lg'>
											<h3 className='text-xl font-semibold text-green-400 mb-4'>
												Overview
											</h3>
											<div className='space-y-2'>
												<p className='flex justify-between'>
													<span>Total Sessions:</span>
													<span className='font-bold'>
														{summaryStats.totalSessions}
													</span>
												</p>
												<p className='flex justify-between'>
													<span>Top Coach:</span>
													<span className='font-bold'>
														{summaryStats.topCoach}
													</span>
												</p>
												<p className='flex justify-between'>
													<span>Top Activity:</span>
													<span className='font-bold'>
														{
															Object.entries(summaryStats.topActivity).sort(
																([, a]: any, [, b]: any) => b - a
															)[0][0]
														}
													</span>
												</p>
											</div>
										</motion.div>
									</div>

									{/* Coach List */}
									<div className='space-y-4'>
										{coachStats.map((coach, index) => (
											<motion.div
												key={coach.coachName}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ delay: index * 0.1 }}
												className='bg-gray-800 rounded-xl p-6 shadow-lg'>
												<div className='flex justify-between items-center mb-4'>
													<h2 className='text-2xl font-bold text-green-400'>
														{coach.coachName}
													</h2>
												</div>

												<div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
													<div className='bg-gray-700 p-4 rounded-lg'>
														<h3 className='text-lg font-semibold text-white'>
															Total Sessions
														</h3>
														<p className='text-2xl text-green-400'>
															{coach.totalSessions}
														</p>
													</div>

													<div className='bg-gray-700 p-4 rounded-lg'>
														<h3 className='text-lg font-semibold text-white'>
															Peak Time
														</h3>
														<p className='text-2xl text-green-400'>
															{Object.entries(coach.popularTimeSlots).sort(
																([, a], [, b]) => b - a
															)[0]?.[0] || 'N/A'}
														</p>
													</div>
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: 'auto' }}
														exit={{ opacity: 0, height: 0 }}>
														<div className='bg-gray-700 p-4 rounded-lg'>
															<h4 className='text-lg font-semibold mb-2'>
																Activity Performance
															</h4>
															<div className='grid grid-cols-2 gap-4'>
																{Object.entries(coach.activityBreakdown)
																	.sort(([, a], [, b]) => b - a)
																	.map(([activity, count]) => (
																		<p
																			key={activity}
																			className='flex justify-between'>
																			<span>{activity}:</span>
																			<span className='text-green-400 font-bold'>
																				{count}
																			</span>
																		</p>
																	))}
															</div>
														</div>
													</motion.div>
												</div>

												<AnimatePresence>
													<motion.div
														initial={{ opacity: 0, height: 0 }}
														animate={{ opacity: 1, height: 'auto' }}
														exit={{ opacity: 0, height: 0 }}>
														<div className='flex justify-center mt-4'>
															<button
																onClick={() => {
																	setSelectedCoach(coach.coachName)
																	setDetailedView(true)
																}}
																className='px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
																View Detailed Analysis
															</button>
														</div>
													</motion.div>
												</AnimatePresence>
											</motion.div>
										))}
									</div>
								</div>
							)}

							{/* Detailed View */}
							{detailedView && selectedCoach !== 'all' && (
								<div className='grid grid-cols-1 gap-8'>
									{coachStats
										.filter(coach => coach.coachName === selectedCoach)
										.map(coach => (
											<motion.div
												key={coach.coachName}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												className='bg-gray-800 rounded-xl p-6 shadow-lg'>
												{/* Charts Section */}
												<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
													<div className='bg-gray-700 p-4 rounded-lg'>
														<h3 className='text-lg font-semibold mb-4 text-white'>
															Activity Breakdown
														</h3>
														<div className='h-[300px] flex items-center justify-center'>
															<Pie
																data={getChartData(coach).sessionTypeData}
																options={{
																	responsive: true,
																	maintainAspectRatio: false,
																	plugins: {
																		legend: {
																			position: 'right',
																			labels: { color: 'white' }
																		}
																	}
																}}
															/>
														</div>
													</div>
													<div className='bg-gray-700 p-4 rounded-lg'>
														<h3 className='text-lg font-semibold mb-4 text-white'>
															Popular Time Slots
														</h3>
														<div className='h-[300px]'>
															<Bar
																data={getChartData(coach).timeSlotData}
																options={{
																	responsive: true,
																	maintainAspectRatio: false,
																	scales: {
																		y: {
																			beginAtZero: true,
																			ticks: { color: 'white' },
																			grid: {
																				color: 'rgba(255, 255, 255, 0.1)'
																			}
																		},
																		x: {
																			ticks: { color: 'white' },
																			grid: {
																				color: 'rgba(255, 255, 255, 0.1)'
																			}
																		}
																	},
																	plugins: {
																		legend: {
																			labels: { color: 'white' }
																		}
																	}
																}}
															/>
														</div>
													</div>
												</div>

												{/* Time Analysis */}
												<div className='mt-6'>
													<h4 className='text-lg font-semibold mb-4'>
														Time Analysis
													</h4>
													<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
														<div className='bg-gray-700 p-4 rounded-lg'>
															<div className='space-y-2'>
																<p className='flex justify-between'>
																	<span>Sessions per Day:</span>
																	<span>
																		{(
																			coach.totalSessions /
																			((dateRange.endDate.getTime() -
																				dateRange.startDate.getTime()) /
																				(1000 * 60 * 60 * 24))
																		).toFixed(1)}
																	</span>
																</p>
																<p className='flex justify-between'>
																	<span>Peak Hours:</span>
																	<span>
																		{
																			Object.entries(
																				coach.popularTimeSlots
																			).sort(([, a], [, b]) => b - a)[0][0]
																		}
																	</span>
																</p>
															</div>
														</div>
														<div className='bg-gray-700 p-4 rounded-lg'>
															<div className='space-y-2'>
																<p className='flex justify-between'>
																	<span>With Token:</span>
																	<span>{coach.tokenUsage.withToken}</span>
																</p>
																<p className='flex justify-between'>
																	<span>Without Token:</span>
																	<span>{coach.tokenUsage.withoutToken}</span>
																</p>
															</div>
														</div>
													</div>
												</div>
											</motion.div>
										))}
								</div>
							)}
						</>
					)}
				</motion.div>
			</div>
		</div>
	)
}
