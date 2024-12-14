// app/admin/manage-bundles/page.tsx
'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Select from 'react-select'
import { useUser } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'
import { FaUserPlus, FaShoppingBag } from 'react-icons/fa'
import {
	purchaseBundle,
	purchaseEssentialsBundle
} from '../../../../utils/userRequests'
import { fetchUsers } from '../../../../utils/adminRequests'
import { supabaseClient } from '../../../../utils/supabaseClient'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import SearchableSelect from '@/app/components/admin/SearchableSelect'
import {
	vistaFinaleBundle,
	classestiers,
	essentialsTier,
	individualtiers,
	proteinShakeTier
} from '../../../../utils/bundles'

interface User {
	id: string
	user_id: string
	first_name: string
	last_name: string
	email: string
	wallet: number
}

export default function ManageBundles() {
	const [users, setUsers] = useState<User[]>([])
	const [selectedUser, setSelectedUser] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [isProcessing, setIsProcessing] = useState(false)
	const [selectedBundle, setSelectedBundle] = useState<string | null>(null)
	const { user: adminUser } = useUser()

	useEffect(() => {
		const loadUsers = async () => {
			const fetchedUsers = await fetchUsers(searchQuery)
			setUsers(fetchedUsers)
		}
		loadUsers()
	}, [searchQuery])

	const handlePurchaseForUser = async (
		userId: string,
		bundleType: string,
		bundleName: string
	) => {
		if (!userId) {
			toast.error('Please select a user first')
			return
		}

		setIsProcessing(true)
		setSelectedBundle(`${bundleType}-${bundleName}`)

		try {
			let result
			if (bundleType === 'essentials') {
				result = await purchaseEssentialsBundle(userId)
			} else {
				result = await purchaseBundle({
					userId,
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
						<span className='text-sm'>Successfully purchased for user</span>
					</div>,
					{ duration: 5000, icon: '🎉' }
				)

				// Record admin action
				await recordAdminAction(userId, bundleType, bundleName)
			}
		} catch (error) {
			toast.error('Purchase failed. Please try again.')
		} finally {
			setIsProcessing(false)
			setSelectedBundle(null)
		}
	}

	const recordAdminAction = async (
		userId: string,
		bundleType: string,
		bundleName: string
	) => {
		const supabase = await supabaseClient()
		await supabase.from('admin_actions').insert({
			admin_id: adminUser?.id,
			user_id: userId,
			action_type: 'bundle_purchase',
			action_details: {
				bundle_type: bundleType,
				bundle_name: bundleName
			},
			timestamp: new Date()
		})
	}

	return (
		<div className='min-h-screen bg-gray-900 text-white '>
			<AdminNavbarComponent />
			<div className='max-w-7xl mx-auto'>
				<h1 className='text-4xl font-bold text-green-400 mb-8 mt-5'>
					Manage Bundle Purchases
				</h1>

				{/* User Selection */}
				<div className='mb-8'>
					<SearchableSelect
						options={users.map(user => ({
							value: user.user_id,
							label: `${user.first_name} ${user.last_name} (${user.email})`
						}))}
						value={
							selectedUser
								? {
										value: selectedUser,
										label:
											users.find(u => u.user_id === selectedUser)?.first_name +
											' ' +
											users.find(u => u.user_id === selectedUser)?.last_name
								  }
								: null
						}
						onChange={option => setSelectedUser(option?.value || null)}
						placeholder='Select a user...'
					/>
				</div>

				{/* Bundle Sections */}
				{selectedUser && (
					<div className='space-y-12'>
						{/* Vista Finale Bundle */}
						<div className='bg-gray-800 rounded-3xl p-6'>
							<div className='flex justify-between items-center mb-6'>
								<h2 className='text-3xl font-bold text-green-400'>
									{vistaFinaleBundle.name}
								</h2>
								<span className='bg-green-500 text-white px-4 py-2 rounded-full text-sm'>
									{vistaFinaleBundle.discount}
								</span>
							</div>
							<div className='grid md:grid-cols-2 gap-6'>
								<div>
									<p className='line-through text-gray-500'>
										{vistaFinaleBundle.priceOriginal}
									</p>
									<p className='text-2xl font-bold text-green-400'>
										{vistaFinaleBundle.priceMonthly}
									</p>
									<p className='text-sm text-gray-300 mb-4'>
										{vistaFinaleBundle.description}
									</p>
									<ul className='space-y-2 mb-6'>
										{vistaFinaleBundle.features.map((feature, index) => (
											<li
												key={index}
												className='flex items-center text-gray-300'>
												<svg
													className='w-4 h-4 mr-2 text-green-500'
													fill='currentColor'
													viewBox='0 0 20 20'>
													<path
														fillRule='evenodd'
														d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
														clipRule='evenodd'
													/>
												</svg>
												{feature}
											</li>
										))}
									</ul>
									<motion.button
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										onClick={() =>
											handlePurchaseForUser(
												selectedUser,
												'finale',
												vistaFinaleBundle.name
											)
										}
										disabled={
											isProcessing &&
											selectedBundle === `finale-${vistaFinaleBundle.name}`
										}
										className='w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition-colors'>
										{isProcessing &&
										selectedBundle === `finale-${vistaFinaleBundle.name}`
											? 'Processing...'
											: 'Purchase Bundle'}
									</motion.button>
								</div>
								<div className='hidden md:block'>
									<div className='bg-gray-700 rounded-xl p-4 h-full flex flex-col justify-center items-center'>
										<FaShoppingBag className='text-6xl text-green-400 mb-4' />
										<p className='text-center text-gray-300'>
											A comprehensive 8-week transformation package designed to
											elevate your fitness journey.
										</p>
									</div>
								</div>
							</div>
						</div>

						{/* Classes Bundles */}
						<div>
							<h2 className='text-3xl font-bold text-green-400 mb-6'>
								Group Class Bundles
							</h2>
							<div className='grid md:grid-cols-3 gap-6'>
								{classestiers.map(tier => (
									<div
										key={tier.id}
										className='bg-gray-800 rounded-xl p-6 flex flex-col'>
										<div className='flex justify-between items-center mb-4'>
											<h3 className='text-2xl font-bold text-green-400'>
												{tier.name}
											</h3>
											{tier.mostPopular && (
												<span className='bg-green-500 text-white px-3 py-1 rounded-full text-xs'>
													Most Popular
												</span>
											)}
										</div>
										<p className='text-xl font-semibold mb-2'>
											{tier.priceMonthly}
										</p>
										<p className='text-gray-300 mb-4'>{tier.description}</p>
										<ul className='flex-grow mb-4 space-y-2'>
											{tier.features.map((feature, index) => (
												<li
													key={index}
													className='flex items-center text-gray-300'>
													<svg
														className='w-4 h-4 mr-2 text-green-500'
														fill='currentColor'
														viewBox='0 0 20 20'>
														<path
															fillRule='evenodd'
															d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
															clipRule='evenodd'
														/>
													</svg>
													{feature}
												</li>
											))}
										</ul>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() =>
												handlePurchaseForUser(
													selectedUser,
													'classes',
													tier.name
												)
											}
											disabled={
												isProcessing &&
												selectedBundle === `classes-${tier.name}`
											}
											className='w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition-colors'>
											{isProcessing && selectedBundle === `classes-${tier.name}`
												? 'Processing...'
												: 'Purchase Bundle'}
										</motion.button>
									</div>
								))}
							</div>
						</div>

						{/* Individual Training Bundles */}
						<div>
							<h2 className='text-3xl font-bold text-green-400 mb-6'>
								Individual Training Bundles
							</h2>
							<div className='grid md:grid-cols-3 gap-6'>
								{individualtiers.map(tier => (
									<div
										key={tier.id}
										className='bg-gray-800 rounded-xl p-6 flex flex-col'>
										<h3 className='text-2xl font-bold text-green-400 mb-4'>
											{tier.name}
										</h3>
										<p className='text-xl font-semibold mb-2'>
											{tier.price.monthly} Credits
										</p>
										<p className='text-gray-300 mb-4'>{tier.description}</p>
										<ul className='flex-grow mb-4 space-y-2'>
											{tier.features.map((feature, index) => (
												<li
													key={index}
													className='flex items-center text-gray-300'>
													<svg
														className='w-4 h-4 mr-2 text-green-500'
														fill='currentColor'
														viewBox='0 0 20 20'>
														<path
															fillRule='evenodd'
															d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
															clipRule='evenodd'
														/>
													</svg>
													{feature}
												</li>
											))}
										</ul>
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() =>
												handlePurchaseForUser(
													selectedUser,
													'individual',
													tier.name
												)
											}
											disabled={
												isProcessing &&
												selectedBundle === `individual-${tier.name}`
											}
											className='w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition-colors'>
											{isProcessing &&
											selectedBundle === `individual-${tier.name}`
												? 'Processing...'
												: 'Purchase Bundle'}
										</motion.button>
									</div>
								))}
							</div>
						</div>

						{/* Additional Bundles */}
						<div className='grid md:grid-cols-2 gap-6'>
							{/* Essentials Bundle */}
							<div className='bg-gray-800 rounded-xl p-6 flex flex-col'>
								<h3 className='text-2xl font-bold text-green-400 mb-4'>
									{essentialsTier.name}
								</h3>
								<p className='text-xl font-semibold mb-2'>
									{essentialsTier.priceMonthly}
								</p>
								<p className='text-gray-300 mb-4'>
									{essentialsTier.description}
								</p>
								<ul className='flex-grow mb-4 space-y-2'>
									{essentialsTier.features.map((feature, index) => (
										<li key={index} className='flex items-center text-gray-300'>
											<svg
												className='w-4 h-4 mr-2 text-green-500'
												fill='currentColor'
												viewBox='0 0 20 20'>
												<path
													fillRule='evenodd'
													d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
													clipRule='evenodd'
												/>
											</svg>
											{feature}
										</li>
									))}
								</ul>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() =>
										handlePurchaseForUser(
											selectedUser,
											'essentials',
											essentialsTier.name
										)
									}
									disabled={
										isProcessing &&
										selectedBundle === `essentials-${essentialsTier.name}`
									}
									className='w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition-colors'>
									{isProcessing &&
									selectedBundle === `essentials-${essentialsTier.name}`
										? 'Processing...'
										: 'Purchase Bundle'}
								</motion.button>
							</div>

							{/* Protein Shake Bundle */}
							<div className='bg-gray-800 rounded-xl p-6 flex flex-col'>
								<h3 className='text-2xl font-bold text-green-400 mb-4'>
									{proteinShakeTier.name}
								</h3>
								<p className='text-xl font-semibold mb-2'>
									{proteinShakeTier.priceMonthly}
								</p>
								<p className='text-gray-300 mb-4'>
									{proteinShakeTier.description}
								</p>
								<ul className='flex-grow mb-4 space-y-2'>
									{proteinShakeTier.features.map((feature, index) => (
										<li key={index} className='flex items-center text-gray-300'>
											<svg
												className='w-4 h-4 mr-2 text-green-500'
												fill='currentColor'
												viewBox='0 0 20 20'>
												<path
													fillRule='evenodd'
													d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
													clipRule='evenodd'
												/>
											</svg>
											{feature}
										</li>
									))}
								</ul>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() =>
										handlePurchaseForUser(
											selectedUser,
											'protein',
											proteinShakeTier.name
										)
									}
									disabled={
										isProcessing &&
										selectedBundle === `protein-${proteinShakeTier.name}`
									}
									className='w-full bg-green-500 text-white py-3 rounded-full hover:bg-green-600 transition-colors'>
									{isProcessing &&
									selectedBundle === `protein-${proteinShakeTier.name}`
										? 'Processing...'
										: 'Purchase Bundle'}
								</motion.button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
