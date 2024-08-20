'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { useAuth } from '@clerk/nextjs'
import { getWalletBalance } from '../../../../utils/userRequests'
import Image from 'next/image'
import {
	FaBars,
	FaTimes,
	FaUsers,
	FaCalendarPlus,
	FaClipboardList,
	FaClock,
	FaStore,
	FaUserPlus,
	FaHome,
	FaDollarSign,
	FaChevronDown,
	FaChevronUp,
	FaRegEdit,
	FaRegCaretSquareDown,
	FaTv,
	FaHistory
} from 'react-icons/fa'
import Link from 'next/link'

type NavItem = {
	label: string
	icon: React.ComponentType<{ className?: string }>
	href?: string
	submenu?: NavItem[]
}

export default function AdminNavbarComponent() {
	const [currentPage, setCurrentPage] = useState<string>('')
	const [walletBalance, setWalletBalance] = useState<number | null>(null)
	const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false)
	const [openSubMenu, setOpenSubMenu] = useState<{ [key: string]: boolean }>({})

	const { userId, getToken, isSignedIn } = useAuth()

	useEffect(() => {
		setCurrentPage(window.location.pathname)
	}, [])

	useEffect(() => {
		const fetchWallet = async () => {
			try {
				if (isSignedIn) {
					const balance = await getWalletBalance({ userId })
					setWalletBalance(balance)
				} else {
					setWalletBalance(null)
				}
			} catch (error) {
				console.error('Error fetching wallet balance:', error)
				setWalletBalance(null)
			}
		}

		fetchWallet()
	}, [isSignedIn, getToken, userId])

	const toggleSubMenu = (menu: string) => {
		setOpenSubMenu(prev => ({
			...prev,
			[menu]: !prev[menu]
		}))
	}

	const navItems: NavItem[] = [
		{
			label: 'Accounting',
			icon: FaDollarSign,
			submenu: [
				{ href: '/admin/accounting/dashboard', label: 'Dashboard', icon: FaTv },
				{
					href: '/admin/accounting/transactions',
					label: 'Transactions',
					icon: FaRegCaretSquareDown
				}
			]
		},
		{
			label: 'Manage',
			icon: FaRegEdit,
			submenu: [
				{
					href: '/admin/add-activities-and-coaches',
					label: 'Coaches & Activities',
					icon: FaCalendarPlus
				},
				{ href: '/admin/add-timeslots', label: 'Time Slots', icon: FaClock },
				{ href: '/admin/add-market-items', label: 'Shop', icon: FaStore }
			]
		},
		{
			href: '/admin/view-reservations',
			label: 'Reservations',
			icon: FaClipboardList
		},
		{
			href: '/admin/manage-users',
			label: 'Users',
			icon: FaUsers
		},
		{
			href: '/admin/book-for-client',
			label: 'Book for Client',
			icon: FaUserPlus
		},
		{
			href: '/admin/completed-sessions',
			label: 'History',
			icon: FaHistory
		}
	]

	return (
		<nav className='bg-gray-900 text-white border-b-2 border-green-500'>
			<div className='mx-auto max-w-7xl px-4 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<div className='lg:hidden flex justify-start w-1/3'>
						<button
							onClick={() => setIsMenuOpen(!isMenuOpen)}
							className='inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500'
							aria-label='Toggle menu'>
							{isMenuOpen ? (
								<FaTimes className='text-red-500' />
							) : (
								<FaBars className='text-green-500' />
							)}
						</button>
					</div>
					<div className='flex justify-center lg:justify-start w-1/3'>
						<Link href='/users/dashboard' className='flex-shrink-0'>
							<Image
								src='/images/logoinverted.png'
								alt='Logo'
								width={40}
								height={40}
								className='h-10 w-auto'
								priority
							/>
						</Link>
					</div>
					<div className='hidden lg:flex justify-end items-center space-x-4'>
						{navItems.map((item, index) => (
							<div key={index} className='relative'>
								{item.submenu ? (
									<div>
										<button
											onClick={() => toggleSubMenu(item.label)}
											className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
												openSubMenu[item.label]
													? 'bg-green-500 text-white'
													: 'text-gray-300 hover:bg-green-300 hover:text-white'
											}`}>
											<item.icon className='mr-2 text-lg' />
											<span>{item.label}</span>
											{openSubMenu[item.label] ? (
												<FaChevronUp className='ml-2' />
											) : (
												<FaChevronDown className='ml-2' />
											)}
										</button>
										{openSubMenu[item.label] && (
											<div className='absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5'>
												{item.submenu.map((subItem, subIndex) => (
													<Link
														key={subIndex}
														href={subItem.href!}
														className={` px-4 py-2 flex items-center text-sm text-gray-700 hover:bg-green-300 hover:text-white ${
															currentPage === subItem.href
																? 'bg-green-500 text-white'
																: ''
														}`}>
														<subItem.icon className='mr-2 text-lg' />
														{subItem.label}
													</Link>
												))}
											</div>
										)}
									</div>
								) : (
									<Link
										href={item.href!}
										className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
											currentPage === item.href
												? 'bg-green-500 text-white'
												: 'text-gray-300 hover:bg-green-300 hover:text-white'
										}`}>
										<item.icon className='mr-2 text-lg' />
										<span className='whitespace-nowrap'>{item.label}</span>
									</Link>
								)}
							</div>
						))}
					</div>
					<div className='flex items-center justify-end w-1/3'>
						<Link
							href={'/users/dashboard'}
							className={`flex items-center px-3 py-2 mr-2 rounded-md text-sm font-medium transition-colors duration-200 `}>
							<FaHome className='mr-2 text-lg hover:text-green-400' size={25} />
						</Link>
						<UserButton
							afterSignOutUrl='/'
							appearance={{
								elements: {
									avatarBox: 'border-2 border-green-500'
								}
							}}
						/>
					</div>
				</div>
			</div>

			<AnimatePresence>
				{isMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className='lg:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
							{navItems.map((item, index) => (
								<div key={index} className='relative'>
									{item.submenu ? (
										<div>
											<button
												onClick={() => toggleSubMenu(item.label)}
												className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
													openSubMenu[item.label]
														? 'bg-green-500 text-white'
														: 'text-gray-300 hover:bg-green-300 hover:text-white'
												}`}>
												<item.icon className='mr-2 text-lg' />
												<span>{item.label}</span>
												{openSubMenu[item.label] ? (
													<FaChevronUp className='ml-2' />
												) : (
													<FaChevronDown className='ml-2' />
												)}
											</button>
											{openSubMenu[item.label] && (
												<div className='mt-2 ml-6 space-y-1'>
													{item.submenu.map((subItem, subIndex) => (
														<Link
															key={subIndex}
															href={subItem.href!}
															className={`block px-3 py-2 text-base font-medium text-gray-300 hover:bg-green-300 hover:text-white ${
																currentPage === subItem.href
																	? 'bg-green-500 text-white'
																	: ''
															}`}
															onClick={() => setIsMenuOpen(false)}>
															<subItem.icon className='mr-2 text-lg' />
															{subItem.label}
														</Link>
													))}
												</div>
											)}
										</div>
									) : (
										<Link
											href={item.href!}
											className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
												currentPage === item.href
													? 'bg-green-500 text-white'
													: 'text-gray-300 hover:bg-green-300 hover:text-white'
											}`}
											onClick={() => setIsMenuOpen(false)}>
											<item.icon className='mr-2 text-lg' />
											<span className='whitespace-nowrap'>{item.label}</span>
										</Link>
									)}
								</div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
