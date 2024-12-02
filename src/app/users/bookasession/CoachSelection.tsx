'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { RotateLoader } from 'react-spinners'

const CoachSelection = ({
	coaches,
	selectedCoach,
	handleCoachSelect,
	isLoading
}: any) => {
	if (isLoading) {
		return (
			<div className='flex justify-center items-center h-40'>
				<RotateLoader color={'#4ADE80'} loading={true} size={20} />
			</div>
		)
	}

	if (!coaches?.length) {
		return (
			<div className='text-center text-gray-300 py-8'>
				No coaches available for this activity at the moment.
			</div>
		)
	}

	return (
		<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
			<AnimatePresence>
				{coaches.map((coach: any) => (
					<motion.button
						key={coach.id}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						whileHover={{
							scale: 1.05,
							boxShadow: '0 0 30px rgba(54, 120, 58, 0.7)'
						}}
						whileTap={{ scale: 0.95 }}
						className={`p-3 sm:p-6 rounded-2xl transition-all duration-300 ${
							selectedCoach === coach.id
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-green-300 hover:text-white'
						}`}
						onClick={() => handleCoachSelect(coach.id)}>
						<img
							src={coach.profile_picture}
							alt={`${coach.name}`}
							className='w-24 h-24 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 object-cover border-4 border-green-400'
						/>
						<p className='text-lg sm:text-xl font-semibold'>{coach.name}</p>
					</motion.button>
				))}
			</AnimatePresence>
		</div>
	)
}

export default CoachSelection
