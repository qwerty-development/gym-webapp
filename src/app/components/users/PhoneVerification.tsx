import React, { useState } from 'react'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { motion } from 'framer-motion'
import { RingLoader } from 'react-spinners'
import toast from 'react-hot-toast'
import { FaPhone } from 'react-icons/fa'

const PhoneVerification = ({ userId, onVerificationComplete }:any) => {
	const [phoneNumber, setPhoneNumber] = useState('')
	const [isLoading, setIsLoading] = useState(false)

	const handleSubmit = async (e: { preventDefault: () => void }) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const supabase = await supabaseClient()
			const { error } = await supabase
				.from('users')
				.update({ phone: phoneNumber })
				.eq('user_id', userId)

			if (error) {
				throw error
			}

			toast.success('Phone number saved successfully!')
			onVerificationComplete()
		} catch (error) {
			console.error('Error updating phone number:', error)
			toast.error('Failed to save phone number. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-gray-800 p-8 rounded-xl shadow-lg max-w-md w-full mx-4'>
				<div className='flex justify-center mb-6'>
					<div className='bg-green-500 p-4 rounded-full'>
						<FaPhone className='text-white text-3xl' />
					</div>
				</div>

				<h2 className='text-2xl font-bold text-center text-green-400 mb-4'>
					Phone Verification Required
				</h2>

				<p className='text-gray-300 text-center mb-8'>
					Please enter your phone number to continue to the dashboard.
				</p>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<div>
						<input
							type='tel'
							value={phoneNumber}
							onChange={e => setPhoneNumber(e.target.value)}
							placeholder='Enter phone number'
							className='w-full p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
							required
						/>
					</div>

					<button
						type='submit'
						disabled={isLoading || !phoneNumber}
						className={`w-full py-3 rounded-full font-bold text-white transition-all duration-300 ${
							isLoading || !phoneNumber
								? 'bg-gray-600 cursor-not-allowed'
								: 'bg-green-500 hover:bg-green-600'
						}`}>
						{isLoading ? (
							<div className='flex items-center justify-center'>
								<RingLoader color='#ffffff' size={24} />
							</div>
						) : (
							'Continue to Dashboard'
						)}
					</button>
				</form>
			</motion.div>
		</div>
	)
}

export default PhoneVerification
