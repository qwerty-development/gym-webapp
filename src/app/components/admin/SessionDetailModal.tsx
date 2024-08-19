import React from 'react'
import { motion } from 'framer-motion'

const SessionDetailModal = ({ session, onClose }: any) => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
			onClick={onClose}>
			<motion.div
				initial={{ scale: 0.9 }}
				animate={{ scale: 1 }}
				exit={{ scale: 0.9 }}
				className='bg-gray-800 p-8 rounded-lg max-w-2xl w-full'
				onClick={e => e.stopPropagation()}>
				<h2 className='text-2xl font-bold mb-4'>{session.activity.name}</h2>
				<p>
					<strong>Date:</strong> {new Date(session.date).toLocaleDateString()}
				</p>
				<p>
					<strong>Time:</strong> {session.start_time} - {session.end_time}
				</p>
				<p>
					<strong>Coach:</strong> {session.coach.name}
				</p>
				<p>
					<strong>Type:</strong> {session.user_id ? 'Private' : 'Group'}
				</p>
				{session.additions && session.additions.length > 0 && (
					<div>
						<strong>Additions:</strong>
						<ul className='list-disc list-inside'>
							{session.additions.map(
								(
									addition:
										| string
										| number
										| boolean
										| React.ReactElement<
												any,
												string | React.JSXElementConstructor<any>
										  >
										| Iterable<React.ReactNode>
										| React.ReactPortal
										| Promise<React.AwaitedReactNode>
										| null
										| undefined,
									index: React.Key | null | undefined
								) => (
									<li key={index}>{addition}</li>
								)
							)}
						</ul>
					</div>
				)}
				<button
					className='mt-4 px-4 py-2 bg-green-600 text-white rounded-md'
					onClick={onClose}>
					Close
				</button>
			</motion.div>
		</motion.div>
	)
}

export default SessionDetailModal
