'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSortAmountDown, FaSortAmountUp } from 'react-icons/fa'

interface MagicalTransactionTableProps {
	transactions: any[]
	sortField: string
	sortOrder: 'asc' | 'desc'
	handleSort: (field: string) => void
	getTransactionColor: (type: string) => string
}

const MagicalTransactionTable: React.FC<MagicalTransactionTableProps> = ({
	transactions,
	sortField,
	sortOrder,
	handleSort,
	getTransactionColor
}) => {
	return (
		<div className='bg-gray-800 rounded-xl shadow-lg overflow-hidden'>
			<div className='overflow-x-auto'>
				<table className='min-w-full divide-y divide-gray-700'>
					<thead className='bg-gray-700'>
						<tr>
							{[
								{ key: 'created_at', label: 'Date' },
								{ key: 'description', label: 'Description' },
								{ key: 'type', label: 'Type' },
								{ key: 'amount', label: 'Amount' },
								{ key: 'currency', label: 'Currency' },
								{ key: 'user', label: 'User' }
							].map(column => (
								<th
									key={column.key}
									scope='col'
									className={`py-3 px-6 text-xs font-medium tracking-wider text-left text-gray-400 uppercase ${
										column.key !== 'user' ? 'cursor-pointer' : ''
									}`}
									onClick={() =>
										column.key !== 'user' && handleSort(column.key)
									}>
									<div className='flex items-center'>
										{column.label}
										{column.key !== 'user' &&
											sortField === column.key &&
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
						<AnimatePresence>
							{transactions.map(transaction => (
								<motion.tr
									key={transaction.id}
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className='hover:bg-gray-700 transition-colors duration-200'>
									<td className='py-4 px-6 whitespace-nowrap'>
										{new Date(transaction.created_at).toLocaleDateString()}
									</td>
									<td className='py-4 px-6'>{transaction.description}</td>
									<td className='py-4 px-6'>
										<span
											className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getTransactionColor(
												transaction.type
											)}`}>
											{transaction.type}
										</span>
									</td>
									<td className='py-4 px-6 whitespace-nowrap'>
										<span
											className={
												transaction.amount >= 0
													? 'text-green-400'
													: 'text-red-400'
											}>
											{transaction.amount}
										</span>
									</td>
									<td className='py-4 px-6 whitespace-nowrap'>
										{transaction.currency}
									</td>
									<td className='py-4 px-6 whitespace-nowrap'>
										{transaction.users.first_name} {transaction.users.last_name}
									</td>
								</motion.tr>
							))}
						</AnimatePresence>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default MagicalTransactionTable
