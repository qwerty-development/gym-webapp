import React from 'react'
import { FaTicketAlt } from 'react-icons/fa'

const TokenInfo = ({ tokens }: any) => (
	<div className='absolute top-full right-0 mt-2 bg-gray-800 rounded-xl p-4 shadow-lg z-50'>
		<h3 className='text-lg font-bold text-green-400 mb-2'>
			Your Bundles Balance
		</h3>
		<ul className='space-y-2'>
			<li className='flex items-center justify-between text-gray-300'>
				<span className='flex items-center'>
					<FaTicketAlt className='mr-2 text-green-500' />
					Shakes
				</span>
				<span className='font-bold'>{tokens.shake_token}</span>
			</li>
			<li className='flex items-center justify-between text-gray-300'>
				<span className='flex items-center'>
					<FaTicketAlt className='mr-2 text-green-500' />
					Private Sessions
				</span>
				<span className='font-bold'>{tokens.private_token}</span>
			</li>
			<li className='flex items-center justify-between text-gray-300'>
				<span className='flex items-center'>
					<FaTicketAlt className='mr-2 text-green-500' />
					Semi-Private Sessions
				</span>
				<span className='font-bold'>{tokens.semiPrivate_token}</span>
			</li>
			<li className='flex items-center justify-between text-gray-300'>
				<span className='flex items-center'>
					<FaTicketAlt className='mr-2 text-green-500' />
					Class Sessions
				</span>
				<span className='font-bold'>{tokens.public_token}</span>
			</li>
			<li className='flex items-center justify-between text-gray-300'>
				<span className='flex items-center'>
					<FaTicketAlt className='mr-2 text-green-500' />
					Workout of the Day
				</span>
				<span className='font-bold'>{tokens.workoutDay_token}</span>
			</li>
		</ul>
	</div>
)

export default TokenInfo
