'use client'
import React from 'react'
import DatePicker from 'react-datepicker'
import Select from 'react-select'

interface MagicalTransactionFiltersProps {
	filter: string
	currencyFilter: string
	searchTerm: string
	startDate: Date | null
	endDate: Date | null
	selectedUser: string | null
	minAmount: number | null
	maxAmount: number | null
	users: any[]
	handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	handleCurrencyFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
	handleDateChange: (dates: [Date | null, Date | null]) => void
	handleQuickDateRange: (start: Date, end: Date) => void
	handleUserChange: (selectedOption: any) => void
	setMinAmount: (min: number | null) => void
	setMaxAmount: (max: number | null) => void
	resetFilters: () => void
}

const MagicalTransactionFilters: React.FC<MagicalTransactionFiltersProps> = ({
	filter,
	currencyFilter,
	searchTerm,
	startDate,
	endDate,
	selectedUser,
	minAmount,
	maxAmount,
	users,
	handleFilterChange,
	handleCurrencyFilterChange,
	handleSearch,
	handleDateChange,
	handleQuickDateRange,
	handleUserChange,
	setMinAmount,
	setMaxAmount,
	resetFilters
}) => {
	const predefinedDateRanges = [
		{
			label: 'Today',
			start: new Date(new Date().setHours(0, 0, 0, 0)),
			end: new Date(new Date().setHours(23, 59, 59, 999))
		},
		{
			label: 'Last 7 Days',
			start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'Last 30 Days',
			start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'This Year',
			start: new Date(new Date().getFullYear(), 0, 1),
			end: new Date()
		}
	]

	const transactionTypeOptions = [
		{ value: 'all', label: 'All Types' },
		{ value: 'credit_refill', label: 'Credit Refill' },
		{ value: 'credit_deduction', label: 'Credit Deduction' },
		{ value: 'credit_sale', label: 'Credit Sale' },
		{
			value: 'individual_session_credit',
			label: 'Individual Session (Credits)'
		},
		{ value: 'individual_session_token', label: 'Individual Session (Token)' },
		{ value: 'individual_session_free', label: 'Individual Session (Free)' },
		{ value: 'group_cancel_credit', label: 'Group Cancellation (Credits)' },
		{ value: 'group_cancel_token', label: 'Group Cancellation (Token)' },
		{ value: 'group_cancel_free', label: 'Group Cancellation (Free)' },
		{
			value: 'semi_cancel_credit',
			label: 'Semi-Private Cancellation (Credits)'
		},
		{ value: 'semi_cancel_token', label: 'Semi-Private Cancellation (Token)' },
		{ value: 'semi_cancel_free', label: 'Semi-Private Cancellation (Free)' },
		{ value: 'market_purchase', label: 'Market Purchase' },
		{ value: 'market_refund', label: 'Market Refund' },
		{ value: 'bundle_purchase', label: 'Bundle Purchase' },
		{ value: 'essentials_update', label: 'Essentials Update' },
		{ value: 'token_update', label: 'Token Update' },
		{ value: 'punch_card_reward', label: 'Punch Card Reward' },
		{ value: 'shake_token_redemption', label: 'Shake Token Redemption' },
		{ value: 'punch_remove', label: 'Punch Card Adjustment' },
		{ value: 'loyalty_penalty', label: 'Loyalty Penalty' }
	]

	const currencyOptions = [
		{ value: 'all', label: 'All Currencies' },
		{ value: 'credits', label: 'Credits' },
		{ value: 'private_token', label: 'Private Token' },
		{ value: 'public_token', label: 'Public Token' },
		{ value: 'semi_private_token', label: 'Semi-Private Token' },
		{ value: 'shake_token', label: 'Shake Token' },
		{ value: 'punches', label: 'Punches' },
		{ value: 'none', label: 'None (Free)' }
	]

	return (
		<div className='bg-gray-800 rounded-xl p-6 shadow-lg'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				{/* Transaction Type */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Transaction Type</label>
					<select
						value={filter}
						onChange={handleFilterChange}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'>
						{transactionTypeOptions.map(opt => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
				{/* Currency Filter */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Currency</label>
					<select
						value={currencyFilter}
						onChange={handleCurrencyFilterChange}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'>
						{currencyOptions.map(opt => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
				{/* Search */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Search</label>
					<input
						type='text'
						placeholder='Search description or type...'
						value={searchTerm}
						onChange={handleSearch}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'
					/>
				</div>
				{/* Date Range */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Date Range</label>
					<DatePicker
						selectsRange
						startDate={startDate}
						endDate={endDate}
						onChange={handleDateChange}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'
						placeholderText='Select date range'
						dateFormat='yyyy-MM-dd'
					/>
				</div>
				{/* Quick Date Ranges */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Quick Date Ranges</label>
					<div className='grid grid-cols-2 gap-2'>
						{predefinedDateRanges.map((range, idx) => (
							<button
								key={idx}
								onClick={() => handleQuickDateRange(range.start, range.end)}
								className='bg-green-600 hover:bg-green-700 text-white rounded-md px-3 py-1 text-sm'>
								{range.label}
							</button>
						))}
					</div>
				</div>
				{/* Amount Range */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Min Amount</label>
					<input
						type='number'
						placeholder='Min'
						value={minAmount !== null ? minAmount : ''}
						onChange={e =>
							setMinAmount(e.target.value ? parseFloat(e.target.value) : null)
						}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'
					/>
				</div>
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>Max Amount</label>
					<input
						type='number'
						placeholder='Max'
						value={maxAmount !== null ? maxAmount : ''}
						onChange={e =>
							setMaxAmount(e.target.value ? parseFloat(e.target.value) : null)
						}
						className='w-full bg-gray-700 text-white rounded-md px-3 py-2'
					/>
				</div>
				{/* User Filter */}
				<div className='space-y-2'>
					<label className='text-sm text-gray-400'>User</label>
					<Select
						options={users.map(user => ({
							value: user.user_id,
							label: `${user.first_name} ${user.last_name}`
						}))}
						onChange={handleUserChange}
						value={
							selectedUser
								? {
										value: selectedUser,
										label:
											users.find(u => u.user_id === selectedUser)?.first_name +
											' ' +
											users.find(u => u.user_id === selectedUser)?.last_name
								  }
								: null
						}
						isClearable
						placeholder='Select a user'
						className='react-select-container'
						classNamePrefix='react-select'
					/>
				</div>
				{/* Reset Button */}
				<div className='space-y-2'>
					<button
						onClick={resetFilters}
						className='w-full bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2'>
						Reset Filters
					</button>
				</div>
			</div>
		</div>
	)
}

export default MagicalTransactionFilters
