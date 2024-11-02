import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	purchaseBundle,
	purchaseEssentialsBundle
} from '../../../../utils/userRequests'
import { useUser } from '@clerk/clerk-react'
import { useWallet } from './WalletContext'
import { toast } from 'react-hot-toast'
import { supabaseClient } from '../../../../utils/supabaseClient'
import {
	FaCrown,
	FaDumbbell,
	FaUsers,
	FaShieldAlt,
	FaBlender,
	FaCoffee
} from 'react-icons/fa'

const classestiers = [
	{
		name: 'BELIEVE',
		id: 'tier-freelancer',
		href: '#',
		priceMonthly: '25 Credits',
		description: '1 Token',
		features: ['Test it out', 'Variety of classes', 'Unlimited Purchases'],
		mostPopular: false
	},
	{
		name: 'EXCEED',
		id: 'tier-enterprise',
		href: '#',
		priceMonthly: '150 Credits',
		description: '10  Tokens',
		features: [
			'Feel the Difference',
			'Unlimited Classes',
			'Priortize your Health',
			'Perfect for the Fitness Enthusiast'
		],
		mostPopular: true
	},
	{
		name: 'ACHIEVE',
		id: 'tier-startup',
		href: '#',
		priceMonthly: '100 Credits',
		description: '5 Tokens',
		features: [
			'Get Started',
			'Variety of Classes',
			'Unlimited Cancellations',
			'Perfect for the Busy Bee'
		],
		mostPopular: false
	}
]

const individualtiers = [
	{
		name: 'Workout of the day',
		id: 'tier-basic',
		href: '#',
		price: { monthly: '200', annually: '$12' },
		description: '10 Sessions',
		features: [
			'Daily Structured Workouts',
			'Build Exercise Consistency',
			'Community Support',
			'Flexible Scheduling'
		]
	},
	{
		name: 'Private training',
		id: 'tier-essential',
		href: '#',
		price: { monthly: '350', annually: '$24' },
		description: '10 PT Sessions',
		features: [
			'1-on-1 Personal Training',
			'Customized Workout Plans',
			'Dedicated Guidance',
			'Maximum Attention & Support',
			'Flexible Scheduling'
		]
	},
	{
		name: 'Semi-Private',
		id: 'tier-growth',
		href: '#',
		price: { monthly: '300', annually: '$48' },
		description: '10 SPT Sessions',
		features: [
			'Small Group Training (2-4 people)',
			'Personalized Attention',
			'Cost-Effective Training',
			'Supportive Group Dynamic',
			'Customized Workout Plans',
			'Flexible Scheduling'
		]
	}
]

const essentialsTier = {
	name: 'ESSENTIALS',
	id: 'tier-essentials',
	href: '#',
	priceMonthly: '30 Credits',
	description: 'Insurance, Parking, Coffee, Water',
	features: [
		'Monthly access to essential services',
		'Insurance coverage',
		'Parking access',
		'Complimentary coffee and water'
	],
	mostPopular: false
}

const proteinShakeTier = {
	name: 'PROTEIN SHAKE PACK',
	id: 'tier-protein',
	href: '#',
	priceMonthly: '40 Credits',
	description: '12 Premium Shakes and Puddings',
	features: [
		'High-quality protein shakes',
		'Choice of flavors',
		'Rich in nutrients and vitamins'
	],
	mostPopular: false
}

const allTiers = [...classestiers, essentialsTier]
function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ')
}

export default function Bundles() {
	const [essentialsTillDate, setEssentialsTillDate] = useState<string | null>(
		null
	)
	const [selectedTier, setSelectedTier] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const { refreshWalletBalance, refreshTokens } = useWallet()
	const { isLoaded, isSignedIn, user } = useUser()

	useEffect(() => {
		const fetchEssentialsTillDate = async () => {
			if (user?.id) {
				const supabase = await supabaseClient()
				const { data, error } = await supabase
					.from('users')
					.select('essential_till')
					.eq('user_id', user.id)
					.single()

				if (!error && data) {
					setEssentialsTillDate(data.essential_till)
				}
			}
		}

		fetchEssentialsTillDate()
	}, [user])

	const handlePurchase = async (bundleType: string, bundleName: string) => {
		if (!user?.id) {
			toast.error('Please sign in to purchase bundles')
			return
		}

		setIsProcessing(true)
		setSelectedTier(`${bundleType}-${bundleName}`)

		try {
			let result
			if (bundleType === 'essentials') {
				result = await purchaseEssentialsBundle(user.id)
				if (result.data) {
					setEssentialsTillDate(result.data.essential_till)
				}
			} else {
				result = await purchaseBundle({
					userId: user.id,
					bundleType,
					bundleName
				})
			}

			if (result.error) {
				toast.error(`Error: ${result.error}`)
			} else {
				toast.success(
					<div className='flex flex-col'>
						<span className='font-bold'>{bundleName} Bundle Purchased!</span>
						<span className='text-sm'>{result.message}</span>
					</div>,
					{
						duration: 5000,
						icon: '🎉'
					}
				)
				refreshWalletBalance()
				refreshTokens()
			}
		} catch (error) {
			toast.error('Purchase failed. Please try again.')
		} finally {
			setIsProcessing(false)
			setSelectedTier(null)
		}
	}

	const getBundleIcon = (bundleName: string) => {
		switch (bundleName) {
			case 'EXCEED':
				return <FaCrown className='text-yellow-500 h-8 w-8' />
			case 'ACHIEVE':
				return <FaDumbbell className='text-blue-500 h-8 w-8' />
			case 'BELIEVE':
				return <FaUsers className='text-green-500 h-8 w-8' />
			case 'ESSENTIALS':
				return <FaShieldAlt className='text-purple-500 h-8 w-8' />
			case 'PROTEIN SHAKE PACK':
				return <FaBlender className='text-pink-500 h-8 w-8' />
			default:
				return <FaCoffee className='text-brown-500 h-8 w-8' />
		}
	}

	const renderTierCard = (
		tier: any,
		type: string,
		mainColor: string = 'green'
	) => {
		const isProcessingThis =
			isProcessing && selectedTier === `${type}-${tier.name}`
		const isPopular = tier.mostPopular

		return (
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				whileHover={{ y: -5, transition: { duration: 0.2 } }}
				className={`flex flex-col justify-between rounded-3xl p-8 xl:p-10 h-full transform transition-all duration-300
          ${
						isPopular
							? `bg-${mainColor}-600 text-white ring-${mainColor}-500 shadow-xl`
							: 'bg-gray-800 ring-1 ring-gray-700'
					}`}>
				<div className='flex flex-col items-center text-center space-y-6'>
					{/* Icon & Title */}
					<div className='flex flex-col items-center space-y-4'>
						{getBundleIcon(tier.name)}
						<h3
							className={`text-2xl font-bold ${
								isPopular ? 'text-white' : 'text-gray-100'
							}`}>
							{tier.name}
						</h3>
						{isPopular && (
							<motion.span
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className={`inline-block px-3 py-1 text-sm font-semibold rounded-full bg-${mainColor}-400 text-white`}>
								Most Popular
							</motion.span>
						)}
					</div>

					{/* Price & Description */}
					<div className='space-y-4'>
						<p
							className={`text-3xl font-bold ${
								isPopular ? 'text-white' : `text-${mainColor}-400`
							}`}>
							{tier.priceMonthly || `${tier.price?.monthly} credits`}
						</p>
						<p
							className={`text-xl ${
								isPopular ? 'text-white' : 'text-gray-300'
							}`}>
							{tier.description}
						</p>
					</div>

					{/* Features */}
					<ul className='space-y-3 text-left'>
						{tier.features?.map((feature: string, index: number) => (
							<motion.li
								key={index}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1 }}
								className={`flex items-center space-x-2 ${
									isPopular ? 'text-white' : 'text-gray-300'
								}`}>
								<svg
									className={`h-5 w-5 ${
										isPopular ? 'text-white' : `text-${mainColor}-400`
									}`}
									fill='none'
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth='2'
									viewBox='0 0 24 24'
									stroke='currentColor'>
									<path d='M5 13l4 4L19 7' />
								</svg>
								<span className='text-sm'>{feature}</span>
							</motion.li>
						))}
					</ul>
				</div>

				{/* Purchase Button */}
				<motion.button
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					disabled={isProcessing}
					onClick={() => handlePurchase(type, tier.name)}
					className={`
            mt-8 w-full px-4 py-3 rounded-xl font-semibold text-sm
            transition-all duration-300 transform
            ${
							isPopular
								? `bg-white text-${mainColor}-600 hover:bg-gray-100`
								: `bg-${mainColor}-500 text-white hover:bg-${mainColor}-600`
						}
            ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${mainColor}-500
          `}>
					{isProcessingThis ? (
						<div className='flex items-center justify-center space-x-2'>
							<motion.div
								animate={{ rotate: 360 }}
								transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
								className='w-5 h-5 border-2 border-t-transparent border-white rounded-full'
							/>
							<span>Processing...</span>
						</div>
					) : (
						'Purchase Bundle'
					)}
				</motion.button>
			</motion.div>
		)
	}

	return (
		<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12'>
			{/* Group Classes Section */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='space-y-12'>
				<div className='text-center'>
					<motion.h2
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600'>
						Group Class Experience
					</motion.h2>
					<p className='mt-4 text-lg text-gray-400'>
						Choose the perfect plan for your fitness journey
					</p>
				</div>

				<div className='grid gap-8 lg:grid-cols-3'>
					{classestiers.map(tier => renderTierCard(tier, 'classes'))}
				</div>
			</motion.div>

			{/* Personal Training Section */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.2 }}
				className='mt-32 space-y-12'>
				<div className='text-center'>
					<motion.h2
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600'>
						Personal Training Experience
					</motion.h2>
					<p className='mt-4 text-lg text-gray-400'>
						Get personalized attention and achieve your goals faster
					</p>
				</div>

				<div className='grid gap-8 lg:grid-cols-3'>
					{individualtiers.map(tier =>
						renderTierCard(tier, 'individual', 'blue')
					)}
				</div>
			</motion.div>

			{/* Additional Bundles */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.4 }}
				className='mt-32 grid gap-8 lg:grid-cols-2'>
				{/* Essentials Bundle */}
				<div className='space-y-6'>
					<div>
						<motion.h2
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-600'>
							Essentials Bundle
						</motion.h2>
						{essentialsTillDate && (
							<motion.p
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className='mt-2 text-gray-400'>
								Active until:{' '}
								{new Date(essentialsTillDate).toLocaleDateString()}
							</motion.p>
						)}
					</div>
					{renderTierCard(essentialsTier, 'essentials', 'purple')}
				</div>

				{/* Protein Bundle */}
				<div className='space-y-6'>
					<motion.h2
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-pink-600'>
						Protein Bundle
					</motion.h2>
					{renderTierCard(proteinShakeTier, 'protein', 'red')}
				</div>
			</motion.div>
		</div>
	)
}
