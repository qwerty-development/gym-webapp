// app/users/health-profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { supabaseClient } from '../../../../utils/supabaseClient'
import NavbarComponent from '@/app/components/users/navbar'
import UserInfoForm from '../../components/users/UserInfoForm'
import EnhancedHealthMetrics from '../../components/users/EnhancedHealthMetrics'
import HealthInsights from '../../components/users/HealthInsights'
import HealthGoals from '../../components/users/HealthGoals'
import { motion } from 'framer-motion'

export default function HealthProfilePage() {
	const { user } = useUser()
	const [userData, setUserData] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('metrics')

	useEffect(() => {
		if (user) {
			fetchUserData()
		}
	}, [user])

	const fetchUserData = async () => {
		setLoading(true)
		const supabase = await supabaseClient()
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('user_id', user?.id)
			.single()


		if (error) {
			console.error('Error fetching user data:', error)
		} else {
			setUserData(data)
		}
		setLoading(false)
	}

	if (loading) {
		return (
			<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex justify-center items-center'>
				<div className='animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-green-500'></div>
			</div>
		)
	}

	return (
		<div
			className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'
			id='__next'>
			<NavbarComponent />

			{/* Toggle for Medium Screens */}
			<div className='hidden md:block lg:hidden sticky top-0 z-20 bg-gray-800 py-2 mb-4'>
				<div className='flex justify-center space-x-2'>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'metrics'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('metrics')}>
						Metrics
					</button>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'insights'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('insights')}>
						Insights
					</button>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'goals'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('goals')}>
						Goals
					</button>
				</div>
			</div>

			{/* Toggle for Small Screens */}
			<div className='md:hidden sticky top-0 z-20 bg-gray-800 py-2 mb-4'>
				<div className='flex justify-center space-x-2'>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'metrics'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('metrics')}>
						Metrics
					</button>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'insights'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('insights')}>
						Insights
					</button>
					<button
						className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
							activeTab === 'goals'
								? 'bg-green-500 text-white'
								: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
						}`}
						onClick={() => setActiveTab('goals')}>
						Goals
					</button>
				</div>
			</div>

			<div className='max-w-7xl lg:ml-32 mx-auto 2xl:mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<h1 className='text-4xl mx-auto  sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-800 mb-8 sm:mb-12 text-center'>
					Health Profile
				</h1>

				{/* Sidebar for Large Screens */}
				<div className='hidden lg:block fixed left-0 top-0 h-full bg-gray-800 z-30 transform transition-transform duration-300 ease-in-out'>
					<h2 className='text-2xl font-bold mb-4 mt-16 md:mt-4 ml-1 text-green-500'>
						Menu
					</h2>
					<ul>
						<li
							className={`mb-5 text-white p-2 px-6 ${
								activeTab === 'metrics' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setActiveTab('metrics')}>
								<svg
									className='w-6 h-6 mr-2'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
									/>
								</svg>
								Metrics
							</button>
						</li>
						<li
							className={`mb-5 text-white p-2 px-6 ${
								activeTab === 'insights' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setActiveTab('insights')}>
								<svg
									className='w-6 h-6 mr-2'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
									/>
								</svg>
								Insights
							</button>
						</li>
						<li
							className={`mb-5 text-white p-2 px-6 ${
								activeTab === 'goals' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setActiveTab('goals')}>
								<svg
									className='w-6 h-6 mr-2'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'
									xmlns='http://www.w3.org/2000/svg'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
									/>
								</svg>
								Goals
							</button>
						</li>
					</ul>
				</div>

				{/* Main Content */}
				<div className=''>
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -20 }}
						transition={{ duration: 0.3 }}>
						{activeTab === 'metrics' && (
							<div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
								<UserInfoForm userData={userData} onUpdate={fetchUserData} />
								<EnhancedHealthMetrics userData={userData} />
							</div>
						)}
						{activeTab === 'insights' && <HealthInsights userData={userData} />}
						{activeTab === 'goals' && (
							<HealthGoals userData={userData} onUpdate={fetchUserData} />
						)}
					</motion.div>
				</div>
			</div>
		</div>
	)
}
