import React from 'react'
import { FaTicketAlt } from 'react-icons/fa'
import { useWallet } from './WalletContext'

const TokenBalance = () => {
	const { userTokens } = useWallet()

	return (
		<div className='bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500'>
			<h3 className='text-2xl font-bold text-green-400 mb-4'>
				Your Bundles Balance
			</h3>
			<ul className='space-y-3'>
				<li className='flex items-center justify-between text-gray-300'>
					<span className='flex items-center'>
						<FaTicketAlt className='mr-2 text-green-500' />
						Private Sessions
					</span>
					<span className='font-bold'>{userTokens.private_token}</span>
				</li>
				<li className='flex items-center justify-between text-gray-300'>
					<span className='flex items-center'>
						<FaTicketAlt className='mr-2 text-green-500' />
						Semi-Private Sessions
					</span>
					<span className='font-bold'>{userTokens.semiPrivate_token}</span>
				</li>

				<li className='flex items-center justify-between text-gray-300'>
					<span className='flex items-center'>
						<FaTicketAlt className='mr-2 text-green-500' />
						Class Sessions
					</span>
					<span className='font-bold'>{userTokens.public_token}</span>
				</li>
				<li className='flex items-center justify-between text-gray-300'>
					<span className='flex items-center'>
						<FaTicketAlt className='mr-2 text-green-500' />
						Workout of the Day
					</span>
					<span className='font-bold'>{userTokens.workoutDay_token}</span>
				</li>
			</ul>
		</div>
	)
}
export default TokenBalance
