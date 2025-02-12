'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaFilter, FaDownload } from 'react-icons/fa'
import { supabaseClient } from '../../../../../utils/supabaseClient'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import MagicalSummaryCards from './SummaryCards'
import MagicalTransactionFilters from './TransactionFilters'
import MagicalTransactionCharts from './TransactionChart'
import MagicalTransactionTable from './TransactionTable'
import saveAs from 'file-saver'

const MagicalTransactionPage: React.FC = () => {
	// States for transactions, filters, pagination, sorting, chart display, and more.
	const [transactions, setTransactions] = useState<any[]>([])
	const [users, setUsers] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [totalPages, setTotalPages] = useState<number>(0)
	const [filter, setFilter] = useState<string>('all')
	const [currencyFilter, setCurrencyFilter] = useState<string>('all')
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [startDate, setStartDate] = useState<Date | null>(null)
	const [endDate, setEndDate] = useState<Date | null>(null)
	const [selectedUser, setSelectedUser] = useState<string | null>(null)
	const [minAmount, setMinAmount] = useState<number | null>(null)
	const [maxAmount, setMaxAmount] = useState<number | null>(null)
	const [sortField, setSortField] = useState<string>('created_at')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false)
	const [chartData, setChartData] = useState<any>(null)
	const [barData, setBarData] = useState<any>(null)
	const [pieData, setPieData] = useState<any>(null)
	const [isChartVisible, setIsChartVisible] = useState<boolean>(true)
	const [summary, setSummary] = useState({
		totalCredits: 0,
		totalTokens: 0,
		totalTransactions: 0,
		avgTransaction: 0,
		highestTransaction: 0,
		lowestTransaction: 0
	})

	const itemsPerPage = 20

	useEffect(() => {
		fetchUsers()
		fetchTransactions()
	}, [
		currentPage,
		filter,
		currencyFilter,
		searchTerm,
		startDate,
		endDate,
		minAmount,
		maxAmount,
		sortField,
		sortOrder,
		selectedUser
	])

	const fetchUsers = async () => {
		const supabase = await supabaseClient()
		const { data, error } = await supabase
			.from('users')
			.select('user_id, first_name, last_name')
			.order('first_name', { ascending: true })
		if (error) console.error('Error fetching users:', error)
		else setUsers(data || [])
	}

	// Build query filters for new_transactions.
	const applyFilters = (query: any) => {
		if (filter !== 'all') {
			query = query.eq('type', filter)
		}
		if (currencyFilter !== 'all') {
			query = query.eq('currency', currencyFilter)
		}
		if (searchTerm) {
			query = query.or(
				`description.ilike.%${searchTerm}%,type.ilike.%${searchTerm}%`
			)
		}
		if (startDate && endDate) {
			const endDateTime = new Date(endDate)
			endDateTime.setHours(23, 59, 59, 999)
			query = query
				.gte('created_at', startDate.toISOString())
				.lte('created_at', endDateTime.toISOString())
		}
		if (selectedUser) {
			query = query.eq('user_id', selectedUser)
		}
		if (minAmount !== null) {
			query = query.gte('amount', minAmount)
		}
		if (maxAmount !== null) {
			query = query.lte('amount', maxAmount)
		}
		return query
	}

	const calculateSummary = (data: any[]) => {
		let totalCredits = 0,
			totalTokens = 0,
			highest = -Infinity,
			lowest = Infinity,
			sum = 0
		data.forEach(transaction => {
			if (transaction.currency === 'credits') {
				totalCredits += transaction.amount
			} else if (
				[
					'private_token',
					'public_token',
					'semi_private_token',
					'shake_token'
				].includes(transaction.currency)
			) {
				totalTokens += transaction.amount
			}
			if (transaction.amount > highest) highest = transaction.amount
			if (transaction.amount < lowest) lowest = transaction.amount
			sum += transaction.amount
		})
		const avg = data.length ? sum / data.length : 0
		return {
			totalCredits,
			totalTokens,
			totalTransactions: data.length,
			avgTransaction: avg,
			highestTransaction: highest,
			lowestTransaction: lowest
		}
	}

	const fetchTransactions = async () => {
		setLoading(true)
		try {
			const supabase = await supabaseClient()
			let countQuery = supabase
				.from('new_transactions')
				.select('*', { count: 'exact', head: true })
			countQuery = applyFilters(countQuery)
			const { count: totalCount, error: countError } = await countQuery
			if (countError) {
				console.error('Error fetching total count:', countError)
				return
			}

			let query = supabase
				.from('new_transactions')
				.select('*, users!inner(first_name, last_name)')
			query = applyFilters(query)
			query = query.order(sortField, { ascending: sortOrder === 'asc' })
			query = query.range(
				(currentPage - 1) * itemsPerPage,
				currentPage * itemsPerPage - 1
			)
			const { data, error } = await query
			if (error) {
				console.error('Error fetching transactions:', error)
				return
			}
			setTransactions(data || [])
			setTotalPages(Math.ceil((totalCount || 0) / itemsPerPage))

			// Also fetch all filtered data for summary & charts.
			let allQuery = supabase
				.from('new_transactions')
				.select('created_at, amount, currency, type')
			allQuery = applyFilters(allQuery)
			const { data: allData, error: allError } = await allQuery
			if (allError) {
				console.error('Error fetching summary data:', allError)
			} else {
				const summaryData = calculateSummary(allData || [])
				setSummary(summaryData)
				setChartData(processLineChartData(allData || []))
				setBarData(processBarChartData(allData || []))
				setPieData(processPieChartData(allData || []))
			}
		} catch (error) {
			console.error('Error in fetchTransactions:', error)
		} finally {
			setLoading(false)
		}
	}

	// Build a daily line chart showing credits and tokens.
	const processLineChartData = (data: any[]) => {
		const daily = data.reduce((acc: any, transaction: any) => {
			const date = new Date(transaction.created_at).toISOString().slice(0, 10)
			if (!acc[date]) acc[date] = { credits: 0, tokens: 0 }
			if (transaction.currency === 'credits') {
				acc[date].credits += transaction.amount
			} else if (
				[
					'private_token',
					'public_token',
					'semi_private_token',
					'shake_token'
				].includes(transaction.currency)
			) {
				acc[date].tokens += transaction.amount
			}
			return acc
		}, {})
		const labels = Object.keys(daily).sort()
		return {
			labels,
			datasets: [
				{
					label: 'Daily Credits',
					data: labels.map(date => daily[date].credits),
					borderColor: 'rgb(75, 192, 192)',
					tension: 0.1
				},
				{
					label: 'Daily Tokens',
					data: labels.map(date => daily[date].tokens),
					borderColor: 'rgb(255, 99, 132)',
					tension: 0.1
				}
			]
		}
	}

	// Build a bar chart showing average transaction amount per currency.
	const processBarChartData = (data: any[]) => {
		const totals: any = {}
		const counts: any = {}
		data.forEach(transaction => {
			const curr = transaction.currency
			totals[curr] = (totals[curr] || 0) + transaction.amount
			counts[curr] = (counts[curr] || 0) + 1
		})
		const labels = Object.keys(totals)
		const averages = labels.map(label => totals[label] / counts[label])
		return {
			labels,
			datasets: [
				{
					label: 'Avg Amount',
					data: averages,
					backgroundColor: labels.map(label => {
						if (label === 'credits') return 'rgba(255, 205, 86, 0.8)'
						if (
							[
								'private_token',
								'public_token',
								'semi_private_token',
								'shake_token'
							].includes(label)
						)
							return 'rgba(54, 162, 235, 0.8)'
						return 'rgba(153, 102, 255, 0.8)'
					})
				}
			]
		}
	}

	// Build a pie chart showing the distribution by transaction type.
	const processPieChartData = (data: any[]) => {
		const counts = data.reduce((acc: any, transaction: any) => {
			acc[transaction.type] = (acc[transaction.type] || 0) + 1
			return acc
		}, {})
		const labels = Object.keys(counts)
		const values = labels.map(label => counts[label])
		return {
			labels,
			datasets: [
				{
					label: 'Transaction Distribution',
					data: values,
					backgroundColor: labels.map(label => {
						if (label.includes('credit')) return 'rgba(255, 205, 86, 0.8)'
						if (label.includes('token')) return 'rgba(54, 162, 235, 0.8)'
						if (label.includes('market')) return 'rgba(201, 203, 207, 0.8)'
						if (label.includes('bundle')) return 'rgba(75, 192, 192, 0.8)'
						return 'rgba(153, 102, 255, 0.8)'
					})
				}
			]
		}
	}

	const exportToCSV = async () => {
		const allData = await fetchAllTransactions()
		if (allData.length === 0) {
			alert('No transactions to export.')
			return
		}
		const csvContent = [
			[
				'Date',
				'Description',
				'Type',
				'Amount',
				'Currency',
				'User ID',
				'User Name'
			],
			...allData.map(transaction => [
				new Date(transaction.created_at).toLocaleString(),
				transaction.description,
				transaction.type,
				transaction.amount,
				transaction.currency,
				transaction.user_id,
				`${transaction.users.first_name} ${transaction.users.last_name}`
			])
		]
			.map(row => row.join(','))
			.join('\n')
		const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
		const fileName = `transactions_export_${new Date().toISOString()}.csv`
		saveAs(blob, fileName)
	}

	const fetchAllTransactions = async () => {
		const supabase = await supabaseClient()
		let query = supabase
			.from('new_transactions')
			.select('*, users(first_name, last_name)')
			.order(sortField, { ascending: sortOrder === 'asc' })
		query = applyFilters(query)
		const { data, error } = await query
		if (error) {
			console.error('Error fetching all transactions:', error)
			return []
		}
		return data
	}

	const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilter(e.target.value)
		setCurrentPage(1)
	}

	const handleCurrencyFilterChange = (
		e: React.ChangeEvent<HTMLSelectElement>
	) => {
		setCurrencyFilter(e.target.value)
		setCurrentPage(1)
	}

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchTerm(e.target.value)
		setCurrentPage(1)
	}

	const handleDateChange = (dates: [Date | null, Date | null]) => {
		const [start, end] = dates
		setStartDate(start)
		setEndDate(end)
		setCurrentPage(1)
	}

	const handleQuickDateRange = (start: Date, end: Date) => {
		setStartDate(start)
		setEndDate(end)
		setCurrentPage(1)
	}

	const handleSort = (field: string) => {
		if (field !== 'user') {
			setSortOrder(prevOrder =>
				sortField === field && prevOrder === 'desc' ? 'asc' : 'desc'
			)
			setSortField(field)
		}
	}

	const handleUserChange = (selectedOption: any) => {
		setSelectedUser(selectedOption ? selectedOption.value : null)
		setCurrentPage(1)
	}

	const toggleFilters = () => setIsFilterOpen(prev => !prev)

	// Determine row color based on transaction type.
	// types/transactionColors.ts

	// Define semantic color groups
	const TransactionColorGroups = {
		CREDIT: {
			POSITIVE: 'bg-yellow-600 text-white', // Credits added
			NEGATIVE: 'bg-red-600 text-white' // Credits deducted
		},
		SESSION: {
			BOOKING: 'bg-emerald-700 text-white', // Session bookings
			CANCELLATION: 'bg-cyan-600 text-white', // Session cancellations
			FREE: 'bg-emerald-700 text-white' // Free sessions
		},
		MARKET: {
			PRIMARY: 'bg-neutral-500 text-white' // Market transactions
		},
		BUNDLE: {
			ALL: 'bg-violet-600 text-white' // All bundle types
		},
		TOKEN: {
			STANDARD: 'bg-blue-600 text-white', // Token operations
			SHAKE: 'bg-pink-600 text-white' // Shake token specific
		},
		LOYALTY: {
			REWARD: 'bg-purple-600 text-white', // Positive loyalty actions
			PENALTY: 'bg-red-800 text-white', // Negative loyalty actions
			PUNCH: 'bg-orange-600 text-white' // Punch card operations
		},
		STATUS: {
			FREE: 'bg-teal-600 text-white', // Free user status changes
			ESSENTIAL: 'bg-indigo-600 text-white' // Essential status updates
		}
	}

	const getTransactionColor = (type: any): string => {
		switch (type) {
			// Credits Management
			case 'credit_refill':
			case 'credit_sale':
				return TransactionColorGroups.CREDIT.POSITIVE
			case 'credit_deduction':
				return TransactionColorGroups.CREDIT.NEGATIVE

			// User Status
			case 'free_user':
			case 'free_user_cancel':
				return TransactionColorGroups.STATUS.FREE

			// Individual Sessions
			case 'individual_session_free':
			case 'individual_session_credit':
			case 'individual_session_token':
				return TransactionColorGroups.SESSION.BOOKING

			// Group Sessions
			case 'group_session_free':
			case 'group_session_credit':
			case 'group_session_token':
				return TransactionColorGroups.SESSION.BOOKING

			// Semi-Private Sessions
			case 'semi_session_free':
			case 'semi_session_token':
			case 'semi_session_credit':
				return TransactionColorGroups.SESSION.BOOKING

			// All Cancellations
			case 'individual_cancel_free':
			case 'individual_cancel_credit':
			case 'individual_cancel_token':
			case 'group_cancel_free':
			case 'group_cancel_credit':
			case 'group_cancel_token':
			case 'semi_cancel_free':
			case 'semi_cancel_token':
			case 'semi_cancel_credit':
				return TransactionColorGroups.SESSION.CANCELLATION

			// Market Transactions
			case 'market_purchase':
			case 'market_refund':
				return TransactionColorGroups.MARKET.PRIMARY

			// Shake Token Operations
			case 'shake_token_use':
			case 'shake_token_refund':
				return TransactionColorGroups.TOKEN.SHAKE

			// Bundle Purchases
			case 'bundle_vista':
			case 'bundle_class':
			case 'bundle_private':
			case 'bundle_semi':
			case 'bundle_workout':
			case 'bundle_shake':
			case 'bundle_essential':
				return TransactionColorGroups.BUNDLE.ALL

			// Loyalty Program
			case 'punch_add':
			case 'punch_remove':
				return TransactionColorGroups.LOYALTY.PUNCH
			case 'shake_token_reward':
				return TransactionColorGroups.LOYALTY.REWARD
			case 'loyalty_penalty':
				return TransactionColorGroups.LOYALTY.PENALTY

			default:
				return 'bg-orange-600 text-white'
		}
	}

	// Helper for hover states

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-3'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 py-8'>
				<h1 className='text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-700'>
					Magical Transaction Dashboard
				</h1>

				<MagicalSummaryCards {...summary} loading={loading} />

				<motion.div
					initial={{ height: 0 }}
					animate={{ height: isFilterOpen ? 'auto' : 0 }}
					transition={{ duration: 0.3 }}
					className='overflow-hidden mb-8'>
					<MagicalTransactionFilters
						filter={filter}
						currencyFilter={currencyFilter}
						searchTerm={searchTerm}
						startDate={startDate}
						endDate={endDate}
						selectedUser={selectedUser}
						minAmount={minAmount}
						maxAmount={maxAmount}
						users={users}
						handleFilterChange={handleFilterChange}
						handleCurrencyFilterChange={handleCurrencyFilterChange}
						handleSearch={handleSearch}
						handleDateChange={handleDateChange}
						handleQuickDateRange={handleQuickDateRange}
						handleUserChange={handleUserChange}
						setMinAmount={setMinAmount}
						setMaxAmount={setMaxAmount}
						resetFilters={() => {
							setFilter('all')
							setCurrencyFilter('all')
							setSearchTerm('')
							setStartDate(null)
							setEndDate(null)
							setSelectedUser(null)
							setMinAmount(null)
							setMaxAmount(null)
							setSortField('created_at')
							setSortOrder('desc')
							setCurrentPage(1)
						}}
					/>
				</motion.div>

				<div className='flex justify-between items-center mb-6'>
					<button
						onClick={toggleFilters}
						className='bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 flex items-center transition duration-300'>
						<FaFilter className='mr-2' />
						{isFilterOpen ? 'Hide Filters' : 'Show Filters'}
					</button>
					<button
						onClick={() => setIsChartVisible(prev => !prev)}
						className='bg-cyan-700 hover:bg-cyan-800 text-white rounded-md px-4 py-2 flex items-center transition duration-300'>
						{isChartVisible ? 'Hide Charts' : 'Show Charts'}
					</button>
					<button
						onClick={exportToCSV}
						className='bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 flex items-center transition duration-300'>
						<FaDownload className='mr-2' />
						Export to CSV
					</button>
				</div>

				{isChartVisible && (
					<MagicalTransactionCharts
						chartData={chartData}
						barData={barData}
						pieData={pieData}
						loading={loading}
					/>
				)}

				{loading ? (
					<div className='flex justify-center items-center h-64'>
						<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
					</div>
				) : (
					<MagicalTransactionTable
						transactions={transactions}
						sortField={sortField}
						sortOrder={sortOrder}
						handleSort={handleSort}
						getTransactionColor={getTransactionColor}
					/>
				)}

				<div className='mt-8 flex justify-between items-center'>
					<p className='text-sm text-gray-400'>
						Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
						{Math.min(currentPage * itemsPerPage, totalPages * itemsPerPage)} of{' '}
						{totalPages * itemsPerPage} entries
					</p>
					<div className='space-x-2'>
						<button
							onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
							disabled={currentPage === 1}
							className='px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 hover:bg-green-700 transition duration-300'>
							Previous
						</button>
						<button
							onClick={() =>
								setCurrentPage(prev => Math.min(prev + 1, totalPages))
							}
							disabled={currentPage === totalPages}
							className='px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 hover:bg-green-700 transition duration-300'>
							Next
						</button>
					</div>
				</div>
			</div>
		</motion.div>
	)
}

export default MagicalTransactionPage
