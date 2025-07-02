'use client'
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaPlus, FaEdit, FaTrash, FaUser, FaUserFriends } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'

type ActivitiesSectionProps = {
	activities: any[]
	groupactivities: any[]
	loading: boolean
	buttonLoading: boolean
	isPrivateTraining: boolean
	handleToggle: () => void
	newActivityName: string
	setNewActivityName: (name: string) => void
	newActivityCredits: string
	setNewActivityCredits: (credits: string) => void
	newActvityCapacity: string
	setNewActivityCapacity: (capacity: string) => void
	newActivitySemiPrivate: boolean
	setNewActivitySemiPrivate: (semiPrivate: boolean) => void
	handleAddActivity: () => void
	handleUpdateActivity: (id: number) => void
	handleDeleteActivity: (id: number) => void
}

const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
	activities,
	groupactivities,
	loading,
	buttonLoading,
	isPrivateTraining,
	handleToggle,
	newActivityName,
	setNewActivityName,
	newActivityCredits,
	setNewActivityCredits,
	newActvityCapacity,
	setNewActivityCapacity,
	newActivitySemiPrivate,
	setNewActivitySemiPrivate,
	handleAddActivity,
	handleUpdateActivity,
	handleDeleteActivity
}) => {
	return (
		<section className='mt-16'>
			<h2 className='text-3xl font-bold mb-8 text-green-400'>Activities</h2>
			<div className='flex justify-center mb-8'>
				<motion.button
					disabled={buttonLoading}
					onClick={handleToggle}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className={`px-6 py-3 rounded-l-full ${
						isPrivateTraining
							? 'bg-green-500 text-white'
							: 'bg-gray-700 text-gray-300'
					} focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300`}>
					<FaUser className='inline mr-2' /> Private Training
				</motion.button>
				<motion.button
					disabled={buttonLoading}
					onClick={handleToggle}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className={`px-6 py-3 rounded-r-full ${
						!isPrivateTraining
							? 'bg-green-500 text-white'
							: 'bg-gray-700 text-gray-300'
					} focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300`}>
					<FaUserFriends className='inline mr-2' /> Classes
				</motion.button>
			</div>

			<motion.div
				className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'
				whileHover={{ scale: 1.02 }}>
				<div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4'>
					<input
						type='text'
						value={newActivityName}
						onChange={e => setNewActivityName(e.target.value)}
						placeholder='New Activity Name'
						className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					<input
						type='number'
						value={newActivityCredits}
						onChange={e => setNewActivityCredits(e.target.value)}
						placeholder='Credits'
						className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					{!isPrivateTraining && (
						<>
							<input
								type='number'
								value={newActvityCapacity}
								onChange={e => setNewActivityCapacity(e.target.value)}
								placeholder='Capacity'
								className='w-full sm:w-1/4 p-3 bg-gray-700 border-2 border-green-500 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
							/>
							<div className='flex flex-col items-start'>
								<div className='flex items-center'>
									<input
										type='checkbox'
										id='semi-private'
										checked={newActivitySemiPrivate}
										onChange={e => setNewActivitySemiPrivate(e.target.checked)}
										disabled={parseInt(newActvityCapacity) > 1}
										className='mr-2 disabled:opacity-50 disabled:cursor-not-allowed'
									/>
									<label htmlFor='semi-private' className={`text-nowrap ${
										parseInt(newActvityCapacity) > 1 ? 'text-gray-500' : 'text-white'
									}`}>
										Semi-Private
									</label>
								</div>
								{parseInt(newActvityCapacity) > 1 && (
									<span className='text-xs text-amber-400 mt-1'>
										Group activities cannot be semi-private
									</span>
								)}
							</div>
						</>
					)}

					<motion.button
						disabled={buttonLoading}
						onClick={handleAddActivity}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='w-full sm:w-auto px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus: outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
						<FaPlus className='inline mr-2' /> Add Activity
					</motion.button>
				</div>
			</motion.div>

			{loading ? (
				<div className='flex justify-center items-center'>
					<RingLoader color='#10B981' size={60} />
				</div>
			) : (
				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
					<AnimatePresence>
						{(isPrivateTraining ? activities : groupactivities).map(
							activity => (
								<motion.div
									key={activity.id}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									transition={{ duration: 0.3 }}
									className='bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-green-500/30 transition duration-300 flex flex-col justify-between'>
									<div>
										<h3 className='text-xl font-semibold mb-2 text-green-400'>
											{activity.name}
										</h3>
										<p className='text-gray-300 mb-2'>
											Credits: {activity.credits}
										</p>

										{!isPrivateTraining && (
											<>
												<p className='text-gray-300'>
													Capacity: {activity.capacity}
												</p>
												<p className='text-gray-300'>
													Semi-Private: {activity.semi_private ? 'Yes' : 'No'}
												</p>
											</>
										)}
									</div>
									<div className='flex justify-end space-x-2 mt-4'>
										<motion.button
											disabled={buttonLoading}
											onClick={() => handleUpdateActivity(activity.id)}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className='p-2 bg-yellow-700 disabled:bg-yellow-300 text-white rounded-full hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
											<FaEdit />
										</motion.button>
										<motion.button
											disabled={buttonLoading}
											onClick={() => handleDeleteActivity(activity.id)}
											whileHover={{ scale: 1.1 }}
											whileTap={{ scale: 0.9 }}
											className='p-2 bg-red-700 disabled:bg-red-300 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
											<FaTrash />
										</motion.button>
									</div>
								</motion.div>
							)
						)}
					</AnimatePresence>
				</div>
			)}
		</section>
	)
}

export default ActivitiesSection
