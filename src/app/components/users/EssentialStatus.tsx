import React from 'react'
import {
	FaExclamationTriangle,
	FaCheckCircle,
	FaTimes,
	FaClock
} from 'react-icons/fa'

const EssentialsStatus = ({ essentialsTill }: any) => {
	if (!essentialsTill) {
		return (
			<div className='flex items-center space-x-2 bg-red-500/10 text-red-500 p-3 rounded-lg'>
				<FaTimes className='text-xl' />
				<div>
					<p className='font-semibold'>No Active Essentials Subscription</p>
					<p className='text-sm'>
						Essentials subscription is required to continue using our services
					</p>
				</div>
			</div>
		)
	}

	const tillDate: any = new Date(essentialsTill)
	const now: any = new Date()
	const daysUntilExpiration = Math.ceil(
		(tillDate - now) / (1000 * 60 * 60 * 24)
	)

	// Expired
	if (daysUntilExpiration < 0) {
		return (
			<div className='flex items-center space-x-2 bg-red-500/10 text-red-500 p-3 rounded-lg'>
				<FaTimes className='text-xl' />
				<div>
					<p className='font-semibold'>Essentials Subscription Expired</p>
					<p className='text-sm'>
						Your essentials subscription expired {Math.abs(daysUntilExpiration)}{' '}
						days ago
					</p>
				</div>
			</div>
		)
	}

	// Expiring soon (7 days or less)
	if (daysUntilExpiration <= 7) {
		return (
			<div className='flex items-center space-x-2 bg-yellow-500/10 text-yellow-500 p-3 rounded-lg'>
				<FaExclamationTriangle className='text-xl' />
				<div>
					<p className='font-semibold'>
						{' '}
						Essentials Subscription Expiring Soon
					</p>
					<p className='text-sm'>
						Your subscription expires in {daysUntilExpiration}{' '}
						{daysUntilExpiration === 1 ? 'day' : 'days'}
					</p>
				</div>
			</div>
		)
	}

	// Active with more than 7 days remaining
	return (
		<div className='flex items-center space-x-2 bg-green-800 text-green-500 p-3 rounded-lg'>
			<FaCheckCircle className='text-xl' />
			<div>
				<p className='font-semibold'>Active Essentials Subscription</p>
				<p className='text-sm'>Valid until {tillDate.toLocaleDateString()}</p>
			</div>
		</div>
	)
}

export default EssentialsStatus
