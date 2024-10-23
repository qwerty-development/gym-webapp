'use client'
import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { motion } from 'framer-motion'
import {
	FaSearch,
	FaSort,
	FaUserEdit,
	FaCheckCircle,
	FaTimesCircle,
	FaPlus,
	FaMinus
} from 'react-icons/fa'
import {
	fetchUsers,
	updateUserCredits,
	updateUserisFree
} from '../../../../utils/adminRequests'
import toast from 'react-hot-toast'

interface User {
	id: number
	username: string
	first_name: string
	last_name: string
	email: string
	created_at: string
	gender: string
	height: number
	DOB: string
	weight: any[]
	phone: string
	wallet?: number
	isFree?: boolean
	private_token: number
	semiPrivate_token: number
	public_token: number
	workoutDay_token: number
	shake_token: number
	essential_till: string | null
}

interface TokenUpdates {
	private_token: number
	semiPrivate_token: number
	public_token: number
	workoutDay_token: number
	shake_token: number
}

const ModifyCreditsComponent = () => {
	const [users, setUsers] = useState<User[]>([])
	const [essentialsTill, setEssentialsTill] = useState('')
	const [searchQuery, setSearchQuery] = useState('')
	const [searchTrigger, setSearchTrigger] = useState(0)
	const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
	const [newCredits, setNewCredits] = useState('')
	const [isUpdating, setIsUpdating] = useState(false)
	const [sortOption, setSortOption] = useState('alphabetical')
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(false)
	const [sale, setSale] = useState(0)
	const [tokenUpdates, setTokenUpdates] = useState<TokenUpdates>({
		private_token: 0,
		semiPrivate_token: 0,
		public_token: 0,
		workoutDay_token: 0,
		shake_token: 0
	})

	useEffect(() => {
		setIsLoading(true)
		fetchUsers(searchQuery)
			.then((data: any) => {
				if (data) {
					let sortedUsers = data as User[]
					if (sortOption === 'alphabetical') {
						sortedUsers = sortedUsers.sort((a, b) =>
							a.first_name.localeCompare(b.first_name)
						)
					} else if (sortOption === 'newest') {
						sortedUsers = sortedUsers.sort(
							(a, b) =>
								new Date(b.created_at).getTime() -
								new Date(a.created_at).getTime()
						)
					}
					setUsers(sortedUsers)
				}
			})
			.catch((error: any) => {
				console.error('Error fetching users:', error)
			})
			.finally(() => {
				setIsLoading(false)
			})
	}, [searchTrigger, sortOption])

	const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSortOption(e.target.value)
	}

	const renderEssentialsTill = (essentialTill: string | null) => {
		if (!essentialTill) {
			return <span className='text-red-500'>X</span>
		}

		const tillDate = new Date(essentialTill)
		const now = new Date()

		if (tillDate < now) {
			return <span className='text-red-500'>X</span>
		}

		return tillDate.toLocaleDateString()
	}

	const handleToggleFree = async (userId: number, currentIsFree: boolean) => {
		setIsUpdating(true)
		try {
			const { error } = await updateUserisFree(userId, !currentIsFree)
			if (!error) {
				setUsers(prevUsers =>
					prevUsers.map(user => {
						if (user.id === userId) {
							return { ...user, isFree: !currentIsFree }
						}
						return user
					})
				)
				toast.success('User free status updated successfully')
			} else {
				toast.error('Failed to update user free status.')
			}
		} catch (error) {
			console.error('Update failed:', error)
			toast.error('Failed to update user free status.')
		} finally {
			setIsUpdating(false)
		}
	}

	const handleTokenChange = (tokenType: keyof TokenUpdates, value: number) => {
		setTokenUpdates(prev => ({
			...prev,
			[tokenType]: prev[tokenType] + value
		}))
	}

	const handleTokenInput = (tokenType: keyof TokenUpdates, value: string) => {
		const numValue = parseInt(value, 10)
		setTokenUpdates(prev => ({
			...prev,
			[tokenType]: isNaN(numValue) ? 0 : numValue
		}))
	}

	const handleUpdateCredits = async () => {
		if (selectedUserId !== null) {
			setIsUpdating(true)
			try {
				let creditChange = parseInt(newCredits, 10) || 0
				creditChange = creditChange * (1 + sale / 100)
				const currentUser = users.find(user => user.id === selectedUserId)
				if (currentUser) {
					const updatedCredits = (currentUser.wallet || 0) + creditChange
					const { error } = await updateUserCredits(
						selectedUserId,
						updatedCredits,
						sale,
						newCredits,
						tokenUpdates,
						essentialsTill
					)
					if (!error) {
						setUsers(prevUsers =>
							prevUsers.map(user => {
								if (user.id === selectedUserId) {
									return {
										...user,
										wallet: updatedCredits,
										private_token: Math.max(
											0,
											user.private_token + tokenUpdates.private_token
										),
										semiPrivate_token: Math.max(
											0,
											user.semiPrivate_token + tokenUpdates.semiPrivate_token
										),
										public_token: Math.max(
											0,
											user.public_token + tokenUpdates.public_token
										),
										workoutDay_token: Math.max(
											0,
											user.workoutDay_token + tokenUpdates.workoutDay_token
										),
										shake_token: Math.max(
											0,
											user.shake_token + tokenUpdates.shake_token
										),
										essential_till: essentialsTill
									}
								}
								return user
							})
						)
						toast.success('User credits and tokens updated successfully')
					} else {
						toast.error('Failed to update user credits and tokens.')
					}
				} else {
					console.error('User not found:', selectedUserId)
					toast.error('User not found. Please try again.')
				}
			} catch (error) {
				console.error('Update failed:', error)
				toast.error('Failed to update user credits and tokens.')
			} finally {
				setIsUpdating(false)
				setSelectedUserId(null)
				setNewCredits('')
				setTokenUpdates({
					private_token: 0,
					semiPrivate_token: 0,
					public_token: 0,
					workoutDay_token: 0,
					shake_token: 0
				})
				setEssentialsTill('')
				setModalIsOpen(false)
			}
		}
	}

	const openModal = (userId: number) => {
		setSelectedUserId(userId)
		setModalIsOpen(true)
		setTokenUpdates({
			private_token: 0,
			semiPrivate_token: 0,
			public_token: 0,
			workoutDay_token: 0,
			shake_token: 0
		})
		const user = users.find(u => u.id === userId)
		setEssentialsTill(user?.essential_till || '')
	}

	const tokenNames = {
		private_token: 'PT',
		semiPrivate_token: 'SPT',
		public_token: 'Class Tokens',
		workoutDay_token: 'WOD Pass',
		shake_token: 'Shake Tokens'
	}

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
	}

	const handleSearch = () => {
		setSearchTrigger(prev => prev + 1)
	}

	const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			handleSearch()
		}
	}

	const calcualateAge = (dob: string) => {
		if (!dob) {
			return 'N/A'
		}
		const today = new Date()
		const birthDate = new Date(dob)
		let age = today.getFullYear() - birthDate.getFullYear()
		const m = today.getMonth() - birthDate.getMonth()
		if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
			age--
		}
		return age
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='container mx-auto px-4 py-6 bg-gray-900 text-white'>
			<div className='mb-6 flex flex-col lg:flex-row gap-5'>
				<div className='flex-grow flex'>
					<input
						type='text'
						placeholder='Search by username, first name, or last name'
						value={searchQuery}
						onChange={handleSearchChange}
						onKeyPress={handleKeyPress}
						disabled={isUpdating || isLoading}
						className='w-full p-3 bg-gray-800 border-2 border-green-500 rounded-l-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					<motion.button
						onClick={handleSearch}
						disabled={isUpdating || isLoading}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='px-6 py-3 bg-green-500 text-white rounded-r-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
						<FaSearch />
					</motion.button>
				</div>

				<motion.select
					value={sortOption}
					onChange={handleSortChange}
					disabled={isUpdating || isLoading}
					whileHover={{ scale: 1.05 }}
					className='w-fit p-3 bg-gray-800 text-white border-2 border-green-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'>
					<option value='alphabetical'>Sort Alphabetically</option>
					<option value='newest'>Sort by Newest</option>
				</motion.select>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
				className='overflow-x-auto relative shadow-md sm:rounded-2xl'>
				<table className='w-full text-sm text-left text-gray-300'>
					<thead className='text-xs uppercase bg-gray-800'>
						<tr>
							<th scope='col' className='py-4 px-6 text-left'>
								Username
							</th>
							<th scope='col' className='py-4 px-6 text-left text-nowrap'>
								First Name
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Last Name
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Wallet
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Gender
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Email
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Phone
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								DOB
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								age
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Height
							</th>
							<th scope='col' className='py-4 px-6 text-left'>
								Weight
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								is Free
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Private Sessions
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Semi-Private Sessions
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Class Sessions
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Workout of the Day
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Shake Tokens
							</th>
							<th scope='col' className='py-4 px-6 text-center'>
								Essentials
							</th>
							<th scope='col' className='py-4 px-6 text-right'>
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{users.map(user => (
							<motion.tr
								key={user.id}
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ duration: 0.3 }}
								className='bg-gray-700 border-b border-gray-600 hover:bg-gray-600'>
								<td className='py-4 px-6'>{user.username}</td>
								<td className='py-4 px-6'>{user.first_name}</td>
								<td className='py-4 px-6'>{user.last_name}</td>
								<td className='py-4 px-6'>{user.wallet}</td>
								<td className='py-4 px-6'>{user.gender}</td>
								<td className='py-4 px-6'>{user.email}</td>
								<td className='py-4 px-6'>{user.phone}</td>
								<td className='py-4 px-6'>{user.DOB}</td>
								<td className='py-4 px-6'>{calcualateAge(user.DOB)}</td>
								<td className='py-4 px-6'>{user.height}</td>
								<td className='py-4 px-6'>
									{user.weight.length > 0
										? user.weight[user.weight.length - 1].value
										: ''}
								</td>
								<td className='py-4 px-6 text-center'>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.9 }}
										onClick={() =>
											handleToggleFree(user.id, user.isFree || false)
										}
										disabled={isUpdating || isLoading}
										className={`p-2 rounded-full ${
											user.isFree ? 'bg-green-500' : 'bg-red-700'
										}`}>
										{user.isFree ? <FaCheckCircle /> : <FaTimesCircle />}
									</motion.button>
								</td>
								<td className='py-4 px-6 text-center'>{user.private_token}</td>
								<td className='py-4 px-6 text-center'>
									{user.semiPrivate_token}
								</td>
								<td className='py-4 px-6 text-center'>{user.public_token}</td>
								<td className='py-4 px-6 text-center'>
									{user.workoutDay_token}
								</td>
								<td className='py-4 px-6 text-center'>{user.shake_token}</td>
								<td className='py-4 px-6 text-center'>
									{renderEssentialsTill(user.essential_till)}
								</td>
								<td className='py-4 px-6 text-right'>
									<motion.button
										onClick={() => openModal(user.id)}
										disabled={isUpdating || isLoading}
										whileHover={{ scale: 1.05 }}
										whileTap={{ scale: 0.95 }}
										className='px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
										<FaUserEdit />
									</motion.button>
								</td>
							</motion.tr>
						))}
					</tbody>
				</table>
			</motion.div>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => setModalIsOpen(false)}
				contentLabel='Update Credits and Tokens'
				className='modal bg-gray-800 p-8 rounded-3xl shadow-lg'
				overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
				<h2 className='text-2xl font-bold mb-6 text-green-400'>
					Update Credits and Tokens
				</h2>
				<div className='flex flex-col items-center space-y-4'>
					<input
						type='number'
						placeholder='New Credits'
						value={newCredits}
						onChange={e => setNewCredits(e.target.value)}
						className='p-3 w-full bg-gray-700 text-white border-2 border-green-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
					/>
					<div className='flex flex-row justify-center items-center gap-2 w-full'>
						<label className='text-green-400' htmlFor='sales'>
							Sale %
						</label>
						<input
							id='sales'
							type='number'
							placeholder='Sale %'
							value={sale}
							min={0}
							max={100}
							onChange={e => setSale(parseInt(e.target.value))}
							className='p-3 flex-grow bg-gray-700 text-white border-2 border-green-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
					</div>
					{Object.entries(tokenUpdates).map(([tokenType, value]) => (
						<div
							key={tokenType}
							className='flex flex-row items-center gap-2 w-full'>
							<label className='text-green-400 w-1/3'>
								{tokenNames[tokenType as keyof typeof tokenNames]}:
							</label>
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={() =>
									handleTokenChange(tokenType as keyof TokenUpdates, -1)
								}
								className='p-2 bg-red-500 text-white rounded-full'>
								<FaMinus />
							</motion.button>
							<input
								type='number'
								value={value}
								onChange={e =>
									handleTokenInput(
										tokenType as keyof TokenUpdates,
										e.target.value
									)
								}
								className='p-2 w-1/3 bg-gray-700 text-white border-2 border-green-500 rounded-full text-center'
							/>
							<motion.button
								whileHover={{ scale: 1.1 }}
								whileTap={{ scale: 0.9 }}
								onClick={() =>
									handleTokenChange(tokenType as keyof TokenUpdates, 1)
								}
								className='p-2 bg-green-500 text-white rounded-full'>
								<FaPlus />
							</motion.button>
						</div>
					))}
					<div className='flex flex-row justify-center items-center gap-2 w-full'>
						<label className='text-green-400' htmlFor='essentialsTill'>
							Essentials Till
						</label>
						<input
							id='essentialsTill'
							type='date'
							value={essentialsTill}
							onChange={e => setEssentialsTill(e.target.value)}
							className='p-3 flex-grow bg-gray-700 text-white border-2 border-green-500 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300'
						/>
					</div>
					<div className='flex flex-row justify-between gap-5 w-full'>
						<motion.button
							onClick={handleUpdateCredits}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='px-6 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-300'>
							Update
						</motion.button>
						<motion.button
							onClick={() => setModalIsOpen(false)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='px-6 py-3 bg-red-700 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-gray-800 transition duration-300'>
							Close
						</motion.button>
					</div>
				</div>
			</Modal>
		</motion.div>
	)
}

export default ModifyCreditsComponent
