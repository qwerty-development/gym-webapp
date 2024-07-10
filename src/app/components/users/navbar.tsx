'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import { useWallet } from './WalletContext'
import Image from 'next/image'
import { FaBars, FaTimes, FaUser, FaCalendarAlt, FaCog } from 'react-icons/fa'
import Link from 'next/link'

export default function NavbarComponent() {
	const { walletBalance } = useWallet()
	const [currentPage, setCurrentPage] = useState('')
	const { user } = useUser()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	useEffect(() => {
		setCurrentPage(window.location.pathname)
	}, [])

	const navItems = [
		{ href: '/users/dashboard', label: 'Dashboard', icon: FaUser },
		{
			href: '/users/bookasession',
			label: 'Book a session',
			icon: FaCalendarAlt
		},
		...(user?.publicMetadata?.role === 'admin'
			? [{ href: '/admin/manage-users', label: 'Admin', icon: FaCog }]
			: [])
	]

	return (
		<nav className='bg-gray-900 text-white border-b-2 border-green-500'>
			<div className='mx-auto max-w-7xl px-4 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<div className='md:hidden flex justify-start w-1/3'>
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
					<div className='flex justify-center md:justify-start w-1/3'>
						<Link href='/' className='flex-shrink-0'>
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
					<div className='hidden md:flex justify-end items-center space-x-4'>
						{navItems.map(item => (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
									currentPage === item.href
										? 'bg-green-500 text-white'
										: 'text-gray-300 hover:bg-green-400 hover:text-white'
								}`}>
								<item.icon className='mr-2' />
								{item.label}
							</Link>
						))}
					</div>
					<div className='flex items-center justify-end w-1/3  '>
						{walletBalance !== null && (
							<div className='bg-gray-800 text-green-400 px-3 py-1 rounded-full mr-3 text-sm border text-nowrap border-green-500'>
								{walletBalance} credits
							</div>
						)}
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
						className='md:hidden'>
						<div className='px-2 pt-2 pb-3 space-y-1 sm:px-3'>
							{navItems.map(item => (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
										currentPage === item.href
											? 'bg-green-500 text-white'
											: 'text-gray-300 hover:bg-green-400 hover:text-white'
									}`}
									onClick={() => setIsMenuOpen(false)}>
									<item.icon className='mr-2' />
									{item.label}
								</Link>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</nav>
	)
}
