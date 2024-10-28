// components/users/LoyaltyCard.tsx
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import {
	FaCoffee,
	FaInfoCircle,
	FaHistory,
	FaTrophy,
	FaChevronRight,
	FaChevronLeft
} from 'react-icons/fa'
import { format } from 'date-fns'

interface LoyaltyCardProps {
	punches: number
	shake_token: number
	name: string
	createdAt: string
	totalPunchesEarned?: number // Could be calculated from transactions history
}

const LoyaltyCard: React.FC<LoyaltyCardProps> = ({
	punches,
	shake_token,
	name,
	createdAt
}) => {
	const [showInfo, setShowInfo] = useState(false)
	const [isFlipped, setIsFlipped] = useState(false)

	// Calculate various stats
	const cardsCompleted = Math.floor(punches / 10)
	const tokensEarned = cardsCompleted * 2
	const progress = ((punches % 10) / 10) * 100
	const punchesUntilReward = 10 - (punches % 10)

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: { opacity: 1, y: 0 }
	}

	const progressVariants = {
		hidden: { width: 0 },
		visible: { width: `${progress}%` }
	}

	return (
		<motion.div
			variants={containerVariants}
			initial='hidden'
			animate='visible'
			transition={{ duration: 0.5 }}
			className='bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500/30 transition-all duration-300'>
			<div className='relative'>
				{/* Card Front */}
				<motion.div
					animate={{ rotateY: isFlipped ? 180 : 0 }}
					transition={{ duration: 0.6 }}
					style={{ backfaceVisibility: 'hidden' }}
					className={isFlipped ? 'hidden' : 'block'}>
					{/* Header */}
					<div className='flex justify-between items-center mb-6'>
						<div>
							<h3 className='text-xl font-bold text-green-400'>
								Protein Rewards
							</h3>
							<p className='text-sm text-gray-400'>
								Welcome back, {name.split(' ')[0]}!
							</p>
						</div>
						<div className='flex items-center space-x-4'>
							<div className='text-center'>
								<span className='text-xs text-gray-400'>Available Tokens</span>
								<div className='bg-green-500 text-white px-4 py-1 rounded-full text-lg font-bold'>
									{shake_token}
								</div>
							</div>
							<button
								onClick={() => setIsFlipped(true)}
								className='text-gray-400 hover:text-green-400 transition-colors'>
								<FaChevronRight size={20} />
							</button>
						</div>
					</div>

					{/* Punch Progress Bar */}
					<div className='mb-6'>
						<div className='h-3 bg-gray-700 rounded-full overflow-hidden'>
							<motion.div
								variants={progressVariants}
								initial='hidden'
								animate='visible'
								transition={{ duration: 1, ease: 'easeOut' }}
								className='h-full bg-green-500'
							/>
						</div>
						<div className='flex justify-between mt-2'>
							<span className='text-sm text-gray-400'>
								{punches % 10} punches
							</span>
							<span className='text-sm text-gray-400'>10 punches</span>
						</div>
					</div>

					{/* Punch Grid */}
					<div className='grid grid-cols-5 gap-3 mb-6'>
						{[...Array(10)].map((_, index) => (
							<motion.div
								key={index}
								initial={{ scale: 0 }}
								animate={{
									scale: index < punches % 10 ? 1 : 0.5,
									backgroundColor: index < punches % 10 ? '#10B981' : '#374151'
								}}
								transition={{
									type: 'spring',
									stiffness: 260,
									damping: 20,
									delay: index * 0.1
								}}
								className={`aspect-square rounded-full flex items-center justify-center
                  ${index < punches % 10 ? 'bg-green-500' : 'bg-gray-700'}
                  transition-all duration-300 hover:shadow-lg`}>
								<FaCoffee
									className={`text-xl ${
										index < punches % 10 ? 'text-white' : 'text-gray-500'
									}`}
								/>
							</motion.div>
						))}
					</div>

					{/* Status Message */}
					<AnimatePresence mode='wait'>
						<motion.div
							key={punchesUntilReward}
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 20 }}
							className='text-center'>
							{punchesUntilReward === 1 ? (
								<p className='text-green-400 font-bold'>
									🎉 Just one more purchase for 2 free tokens! 🎉
								</p>
							) : (
								<p className='text-gray-300'>
									{punchesUntilReward} more purchases until your next reward
								</p>
							)}
						</motion.div>
					</AnimatePresence>
				</motion.div>

				{/* Card Back */}
				<motion.div
					animate={{ rotateY: isFlipped ? 0 : -180 }}
					transition={{ duration: 0.6 }}
					style={{ backfaceVisibility: 'hidden' }}
					className={!isFlipped ? 'hidden' : 'block'}>
					<div className='flex justify-between items-center mb-6'>
						<h3 className='text-xl font-bold text-green-400'>
							Rewards Guidelines
						</h3>
						<button
							onClick={() => setIsFlipped(false)}
							className='text-gray-400 hover:text-green-400 transition-colors'>
							<FaChevronLeft size={20} />
						</button>
					</div>

					<div className='space-y-4'>
						<div className='bg-gray-700 rounded-lg p-4'>
							<div className='flex justify-between items-center'>
								<span className='text-gray-300'>Member Since</span>
								<span className='text-green-400'>
									{format(new Date(createdAt), 'MMM dd, yyyy')}
								</span>
							</div>
						</div>

						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							onClick={() => setShowInfo(!showInfo)}
							className='w-full bg-gray-700 rounded-lg p-4 text-left'>
							<div className='flex justify-between items-center'>
								<span className='text-gray-300 flex items-center'>
									<FaInfoCircle className='mr-2' />
									How it works
								</span>
								<FaChevronRight
									className={`text-gray-400 transform transition-transform ${
										showInfo ? 'rotate-90' : ''
									}`}
								/>
							</div>
						</motion.button>

						<AnimatePresence>
							{showInfo && (
								<motion.div
									initial={{ opacity: 0, height: 0 }}
									animate={{ opacity: 1, height: 'auto' }}
									exit={{ opacity: 0, height: 0 }}
									className='bg-gray-700 rounded-lg p-4 space-y-2'>
									<p className='text-sm text-gray-300'>
										• Get 1 punch for every protein drink purchase
									</p>
									<p className='text-sm text-gray-300'>
										• Collect 10 punches to earn 2 free protein tokens
									</p>
									<p className='text-sm text-gray-300'>
										• Use tokens for free protein drinks anytime
									</p>
									<p className='text-sm text-gray-300'>• Tokens never expire</p>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</motion.div>
			</div>
		</motion.div>
	)
}

export default LoyaltyCard
