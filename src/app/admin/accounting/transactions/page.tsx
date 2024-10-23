'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FaFilter, FaDownload } from 'react-icons/fa'
import { supabaseClient } from '../../../../../utils/supabaseClient'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import TransactionFilters from './TransactionFilters'
import TransactionChart from './TransactionChart'
import TransactionTable from './TransactionTable'
import { format } from 'date-fns'
import saveAs from 'file-saver'
import SummaryCards from './SummaryCards'

const TransactionPage: React.FC = () => {
	const [chartLoading, setChartLoading] = useState(false)
	const [transactions, setTransactions] = useState<any[]>([])
	const [users, setUsers] = useState<any[]>([])
	const [loading, setLoading] = useState<boolean>(true)
	const [currentPage, setCurrentPage] = useState<number>(1)
	const [totalPages, setTotalPages] = useState<number>(0)
	const [filter, setFilter] = useState<string>('all')
	const [searchTerm, setSearchTerm] = useState<string>('')
	const [startDate, setStartDate] = useState<Date | null>(null)
	const [endDate, setEndDate] = useState<Date | null>(null)
	const [summaryLoading, setSummaryLoading] = useState(true)
	const [summary, setSummary] = useState({
		totalCredits: 0,
		totalTokens: 0,
		totalTransactions: 0
	})

	const [sortField, setSortField] = useState<string>('created_at')
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
	const [selectedUser, setSelectedUser] = useState<string | null>(null)
	const [isFilterOpen, setIsFilterOpen] = useState(false)
	const [chartData, setChartData] = useState<any>(null)
	const [isChartVisible, setIsChartVisible] = useState(false)

	const itemsPerPage = 20

	useEffect(() => {
		fetchUsers()
		fetchTransactions()
	}, [
		currentPage,
		filter,
		searchTerm,
		startDate,
		endDate,
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

		if (error) {
			console.error('Error fetching users:', error)
		} else {
			setUsers(data || [])
		}
	}

	const fetchSummaryData = async () => {
		setSummaryLoading(true)
		try {
			const supabase = await supabaseClient()
			let query = supabase.from('transactions').select('amount, user_id')

			query = applyFilters(query)

			const { data, error } = await query

			if (error) {
				console.error('Error fetching summary data:', error)
				return { totalCredits: 0, totalTokens: 0 }
			}

			return calculateSummary(data || [])
		} catch (error) {
			console.error('Error in fetchSummaryData:', error)
			return { totalCredits: 0, totalTokens: 0 }
		} finally {
			setSummaryLoading(false)
		}
	}

	const fetchTransactions = async () => {
		setLoading(true)
		try {
			const supabase = await supabaseClient()

			// Fetch total count
			let countQuery = supabase
				.from('transactions')
				.select('*', { count: 'exact', head: true })
			countQuery = applyFilters(countQuery)

			const { count: totalCount, error: countError } = await countQuery

			if (countError) {
				console.error('Error fetching total count:', countError)
				return
			}

			// Fetch paginated data
			let query = supabase
				.from('transactions')
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

			const summaryData = await fetchSummaryData()
			setSummary({
				...summaryData,
				totalTransactions: totalCount || 0
			})
		} catch (error) {
			console.error('Error in fetchTransactions:', error)
		} finally {
			setLoading(false)
		}
	}

	const resetFilters = () => {
		setFilter('all')
		setSearchTerm('')
		setStartDate(null)
		setEndDate(null)
		setSelectedUser(null)
		setSortField('created_at')
		setSortOrder('desc')
		setCurrentPage(1)
	}

	const applyFilters = (query: any) => {
		if (filter !== 'all') {
			query = query.eq('type', filter)
		}

		if (searchTerm) {
			query = query.or(
				`name.ilike.%${searchTerm}%,amount.ilike.%${searchTerm}%`
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

		return query
	}

	const calculateSummary = (data: any) => {
		return data.reduce(
			(acc: any, transaction: any) => {
				// Extract the number and unit from the amount string
				const amountStr = transaction.amount.toString()
				const match = amountStr.match(
					/([+-]?\d+(?:\.\d+)?)\s*(credits?|tokens?|private token|public token|semi-private token|workoutDay token)/
				)

				if (match) {
					const [_, numberStr, unit] = match
					const number = parseFloat(numberStr)

					if (!isNaN(number)) {
						if (unit.includes('credit')) {
							acc.totalCredits += number
						} else if (unit.includes('token')) {
							acc.totalTokens += number
						}
					}
				}

				return acc
			},
			{ totalCredits: 0, totalTokens: 0 }
		)
	}

	const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilter(e.target.value)
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

	const getTransactionColor = (type: string) => {
		switch (type) {
			case 'individual session':
				return 'bg-green-500 text-white'
			case 'class session':
				return 'bg-cyan-600 text-white'
			case 'credit refill':
				return 'bg-yellow-600 text-white'
			case 'bundle purchase':
				return 'bg-emerald-600 text-white'
			case 'market transaction':
				return 'bg-gray-500 text-white'
			default:
				return 'bg-gray-600 text-white'
		}
	}

	const exportToCSV = async () => {
		const transactions = await fetchAllTransactions()

		if (transactions.length === 0) {
			alert('No transactions to export.')
			return
		}

		const csvContent = [
			['Date', 'Description', 'Type', 'Amount', 'User ID', 'User Name'],
			...transactions.map(transaction => [
				new Date(transaction.created_at).toLocaleString(),
				transaction.name,
				transaction.type,
				transaction.amount,
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
			.from('transactions')
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

	const fetchChartData = async () => {
		setChartLoading(true)
		const supabase = await supabaseClient()
		let query = supabase
			.from('transactions')
			.select('created_at, amount')
			.order('created_at', { ascending: true })

		query = applyFilters(query)

		const { data, error } = await query

		if (error) {
			console.error('Error fetching chart data:', error)
			return
		}

		const processedData: any = processChartData(data)
		setChartData(processedData)
		setChartLoading(false)
	}

	const processChartData = (data: any) => {
		const dailyTotals = data.reduce((acc: any, transaction: any) => {
			const date = format(new Date(transaction.created_at), 'yyyy-MM-dd')
			const amount = parseFloat(transaction.amount)
			if (!acc[date]) {
				acc[date] = { credits: 0, tokens: 0 }
			}
			if (transaction.amount.includes('credits')) {
				acc[date].credits += amount
			} else if (transaction.amount.includes('token')) {
				acc[date].tokens += amount
			}
			return acc
		}, {})

		const labels = Object.keys(dailyTotals).sort()
		const creditAmounts = labels.map(date => dailyTotals[date].credits)
		const tokenAmounts = labels.map(date => dailyTotals[date].tokens)

		return {
			labels,
			datasets: [
				{
					label: 'Daily Credits',
					data: creditAmounts,
					borderColor: 'rgb(75, 192, 192)',
					tension: 0.1
				},
				{
					label: 'Daily Tokens',
					data: tokenAmounts,
					borderColor: 'rgb(255, 99, 132)',
					tension: 0.1
				}
			]
		}
	}

	useEffect(() => {
		fetchChartData()
	}, [filter, searchTerm, startDate, endDate, selectedUser])

	const toggleFilters = () => setIsFilterOpen(!isFilterOpen)

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-3'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 py-8'>
				<h1 className='text-5xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-700'>
					Transaction Dashboard
				</h1>

				<SummaryCards {...summary} />

				<motion.div
					initial={{ height: 0 }}
					animate={{ height: isFilterOpen ? 'auto' : 0 }}
					transition={{ duration: 0.3 }}
					className='overflow-hidden mb-8'>
					<TransactionFilters
						filter={filter}
						searchTerm={searchTerm}
						startDate={startDate}
						endDate={endDate}
						selectedUser={selectedUser}
						users={users}
						handleFilterChange={handleFilterChange}
						handleSearch={handleSearch}
						handleDateChange={handleDateChange}
						handleQuickDateRange={handleQuickDateRange}
						handleUserChange={handleUserChange}
						resetFilters={resetFilters}
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
						onClick={() => setIsChartVisible(!isChartVisible)}
						className='bg-cyan-700 hover:bg-cyan-800 text-white rounded-md px-4 py-2 flex items-center transition duration-300'>
						{isChartVisible ? 'Hide Chart' : 'Show Chart'}
					</button>
					<button
						onClick={exportToCSV}
						className='bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 flex items-center transition duration-300'>
						<FaDownload className='mr-2' />
						Export to CSV
					</button>
				</div>

				{isChartVisible && (
					<TransactionChart chartData={chartData} chartLoading={chartLoading} />
				)}

				{loading ? (
					<div className='flex justify-center items-center h-64'>
						<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
					</div>
				) : (
					<TransactionTable
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

export default TransactionPage
