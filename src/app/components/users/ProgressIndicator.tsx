// app/users/health-profile/components/ProgressIndicator.tsx
import React from 'react'
import { motion } from 'framer-motion'

interface ProgressIndicatorProps {
	label: string
	current: number
	target: number
	unit: string
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
	label,
	current,
	target,
	unit
}) => {
	const percentage = Math.min(Math.max((current / target) * 100, 0), 100)

	return (
		<div className='mb-4'>
			<div className='flex justify-between mb-1'>
				<span className='text-base font-medium text-blue-700 dark:text-white'>
					{label}
				</span>
				<span className='text-sm font-medium text-blue-700 dark:text-white'>
					{current}/{target} {unit}
				</span>
			</div>
			<div className='w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700'>
				<motion.div
					className='bg-blue-600 h-2.5 rounded-full'
					initial={{ width: 0 }}
					animate={{ width: `${percentage}%` }}
					transition={{ duration: 0.5 }}
				/>
			</div>
		</div>
	)
}

export default ProgressIndicator
