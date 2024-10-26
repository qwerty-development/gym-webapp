'use client'
import React from 'react'
import { FaSearch } from 'react-icons/fa'
import DatePicker from 'react-datepicker'
import Select from 'react-select'

interface TransactionFiltersProps {
	filter: string
	searchTerm: string
	startDate: Date | null
	endDate: Date | null
	selectedUser: string | null
	users: any[]
	handleFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
	handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void
	handleDateChange: (dates: [Date | null, Date | null]) => void
	handleQuickDateRange: (start: Date, end: Date) => void
	handleUserChange: (selectedOption: any) => void
	resetFilters: () => void
}

const TransactionFilters: React.FC<TransactionFiltersProps> = ({
	filter,
	searchTerm,
	startDate,
	endDate,
	selectedUser,
	users,
	handleFilterChange,
	handleSearch,
	handleDateChange,
	handleQuickDateRange,
	handleUserChange,
	resetFilters
}) => {
	const predefinedDateRanges = [
		{
			label: 'Today',
			start: new Date(new Date().setHours(0, 0, 0, 0)),
			end: new Date(new Date().setHours(23, 59, 59, 999))
		},
		{
			label: 'Last 7 days',
			start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'Last 30 days',
			start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
			end: new Date()
		},
		{
			label: 'This year',
			start: new Date(new Date().getFullYear(), 0, 1),
			end: new Date()
		}
	]

	return (
		<div className='bg-gray-800 rounded-xl p-6 shadow-lg'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-400 mb-1'>
							Transaction Type
						</label>
						<select
							value={filter}
							onChange={handleFilterChange}
							className='w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'>
							<option value='all'>All Types</option>
							<option value='individual session'>Individual Session</option>
							<option value='class session'>Class Session</option>
							<option value='credit refill'>Credit Refill</option>
							<option value='bundle purchase'>Bundle Purchase</option>
							<option value='market transaction'>Market Transaction</option>
							<option value='essentials update'>Essentials Update</option>
							<option value='token update'>token update</option>
							<option value='punch card reward'>Punch Card Reward</option>
							<option value='shake token redemption'>Shake Token</option>
						</select>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-400 mb-1'>
							Search
						</label>
						<div className='relative'>
							<input
								type='text'
								placeholder='Search transactions...'
								value={searchTerm}
								onChange={handleSearch}
								className='w-full bg-gray-700 text-white rounded-md pl-10 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
							/>
							<FaSearch className='absolute left-3 top-3 text-gray-400' />
						</div>
					</div>
				</div>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-400 mb-1'>
							Date Range
						</label>
						<DatePicker
							selectsRange={true}
							startDate={startDate}
							endDate={endDate}
							onChange={handleDateChange}
							className='w-full bg-gray-700 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
							placeholderText='Select date range'
							dateFormat='yyyy-MM-dd'
							wrapperClassName='w-full'
							calendarClassName='bg-gray-800 border border-gray-700'
							dayClassName={date =>
								'text-white hover:bg-green-500 rounded-full'
							}
						/>
					</div>
					<div>
						<label className='block text-sm font-medium text-gray-400 mb-1'>
							Quick Date Ranges
						</label>
						<div className='grid grid-cols-2 gap-2'>
							{predefinedDateRanges.map((range, index) => (
								<button
									key={index}
									onClick={() => handleQuickDateRange(range.start, range.end)}
									className='bg-green-600 hover:bg-green-700 text-white text-sm rounded-md px-3 py-1 transition duration-300'>
									{range.label}
								</button>
							))}
						</div>
					</div>
				</div>
				<div className='space-y-4'>
					<div>
						<label className='block text-sm font-medium text-gray-400 mb-1'>
							User
						</label>
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
												users.find(u => u.user_id === selectedUser)
													?.first_name +
												' ' +
												users.find(u => u.user_id === selectedUser)?.last_name
									  }
									: null
							}
							isClearable
							placeholder='Select a user'
							className='react-select-container bg-green-500'
							classNamePrefix='react-select bg-green-500'
							styles={{
								control: (provided, state) => ({
									...provided,
									backgroundColor: '#454c45',
									borderColor: state.isFocused ? '#4caf50' : '#4c6f46',
									color: 'white',
									'&:hover': {
										borderColor: '#4caf50'
									}
								}),
								menu: provided => ({
									...provided,
									backgroundColor: '#454c45'
								}),
								option: (provided, state) => ({
									...provided,
									backgroundColor: state.isFocused ? '#a5b89a' : '#454c45',
									color: 'white'
								}),
								singleValue: provided => ({
									...provided,
									color: 'white'
								}),
								input: provided => ({
									...provided,
									color: 'white'
								})
							}}
						/>
					</div>
					<div>
						<button
							onClick={resetFilters}
							className='w-full bg-red-600 hover:bg-red-700 text-white rounded-md px-4 py-2 transition duration-300'>
							Reset Filters
						</button>
					</div>
				</div>
			</div>
		</div>
	)
}

export default TransactionFilters
