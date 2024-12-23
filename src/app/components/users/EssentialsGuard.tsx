import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FaLock, FaShoppingCart, FaUserShield } from 'react-icons/fa'

const EssentialsGuard = ({ children, essentialsTill, user }: any) => {
	const isAdmin = user?.publicMetadata?.role === 'admin'

	if (isAdmin) {
		const hasValidSubscription =
			essentialsTill && new Date(essentialsTill) > new Date()

		return (
			<>
				{!hasValidSubscription && (
					<motion.div
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-blue-500/10 border border-blue-500 text-blue-400 p-4 rounded-lg mb-4 mx-auto flex items-center gap-3'
						id='__next'>
						<div className='mx-auto flex flex-row items-center gap-2 justify-center'>
							<FaUserShield className='text-xl flex-shrink-0' />
							<p className='font-semibold'>Admin Access</p>
						</div>
					</motion.div>
				)}
				{children}
			</>
		)
	}

	// Regular user checks
	if (!essentialsTill) {
		return <BlockingOverlay type='missing' />
	}

	const tillDate = new Date(essentialsTill)
	const now = new Date()

	if (tillDate < now) {
		return <BlockingOverlay type='expired' expiredDate={tillDate} />
	}

	return children
}

const BlockingOverlay = ({ type, expiredDate }: any) => {
	return (
		<div
			className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'
			id='__next'>
			<div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4'>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					className='bg-gray-800 rounded-xl p-8 max-w-md w-full shadow-2xl border-2 border-red-500'>
					<div className='flex flex-col items-center text-center space-y-6'>
						<div className='w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center'>
							<FaLock className='text-4xl text-red-500' />
						</div>

						<h2 className='text-2xl font-bold text-white'>
							{type === 'missing'
								? 'Essentials Subscription Required'
								: 'Subscription Expired'}
						</h2>

						<p className='text-gray-300'>
							{type === 'missing'
								? 'An active Essentials subscription is required to access this feature.'
								: `Your Essentials subscription expired on ${expiredDate?.toLocaleDateString()}.`}
						</p>

						<div className='space-y-4 w-full'>
							<Link
								href='/users/shop'
								className='flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300'>
								<FaShoppingCart />
								Purchase Essentials Subscription
							</Link>
						</div>

						<p className='text-sm text-gray-400'>
							Contact support if you need assistance with your subscription.
						</p>
					</div>
				</motion.div>
			</div>
		</div>
	)
}

export default EssentialsGuard
