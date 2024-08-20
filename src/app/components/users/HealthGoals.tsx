// app/users/health-profile/components/HealthGoals.tsx
import React, { useState } from 'react'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'

interface HealthGoalsProps {
	userData: any
	onUpdate: () => void
}

const HealthGoals: React.FC<HealthGoalsProps> = ({ userData, onUpdate }) => {
	const { user } = useUser()
	const [newGoal, setNewGoal] = useState('')

	const handleAddGoal = async (e: React.FormEvent) => {
		e.preventDefault()
		const supabase = await supabaseClient()

		const updatedGoals = [
			...(userData.health_goals || []),
			{
				description: newGoal,
				created_at: new Date().toISOString(),
				completed: false
			}
		]

		const { error } = await supabase
			.from('users')
			.update({ health_goals: updatedGoals })
			.eq('user_id', user?.id)

		if (error) {
			console.error('Error adding goal:', error)
		} else {
			setNewGoal('')
			onUpdate()
		}
	}

	const handleRemoveGoal = async (index: number) => {
		const supabase = await supabaseClient()

		const updatedGoals = userData.health_goals.filter(
			(_: any, i: number) => i !== index
		)

		const { error } = await supabase
			.from('users')
			.update({ health_goals: updatedGoals })
			.eq('user_id', user?.id)

		if (error) {
			console.error('Error removing goal:', error)
		} else {
			onUpdate()
		}
	}

	const handleToggleGoal = async (index: number) => {
		const supabase = await supabaseClient()

		const updatedGoals = userData.health_goals.map((goal: any, i: number) =>
			i === index ? { ...goal, completed: !goal.completed } : goal
		)

		const { error } = await supabase
			.from('users')
			.update({ health_goals: updatedGoals })
			.eq('user_id', user?.id)

		if (error) {
			console.error('Error toggling goal:', error)
		} else {
			onUpdate()
		}
	}

	return (
		<div className='bg-gray-800 rounded-lg shadow-lg p-6 text-white'>
			<h3 className='text-2xl font-bold mb-6 text-green-400'>Health Goals</h3>
			<form onSubmit={handleAddGoal} className='mb-6'>
				<div className='flex'>
					<input
						type='text'
						value={newGoal}
						onChange={e => setNewGoal(e.target.value)}
						placeholder='Enter a new health goal'
						className='flex-grow mr-2 px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400'
					/>
					<button
						type='submit'
						className='px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300'>
						Add Goal
					</button>
				</div>
			</form>
			<ul className='space-y-4'>
				{userData.health_goals?.map((goal: any, index: number) => (
					<motion.li
						key={index}
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						className='flex items-center justify-between bg-gray-700 rounded-lg p-4'>
						<div className='flex items-center'>
							<input
								type='checkbox'
								checked={goal.completed}
								onChange={() => handleToggleGoal(index)}
								className='mr-3 form-checkbox h-5 w-5 text-green-400 rounded focus:ring-green-400'
							/>
							<span
								className={`text-lg ${
									goal.completed ? 'line-through text-gray-400' : 'text-white'
								}`}>
								{goal.description}
							</span>
						</div>
						<div className='flex items-center'>
							<span className='text-sm text-gray-400 mr-4'>
								Added: {new Date(goal.created_at).toLocaleDateString()}
							</span>
							<button
								onClick={() => handleRemoveGoal(index)}
								className='text-red-400 hover:text-red-600 transition-colors duration-300'>
								<svg
									className='w-5 h-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
									/>
								</svg>
							</button>
						</div>
					</motion.li>
				))}
			</ul>
		</div>
	)
}

export default HealthGoals
