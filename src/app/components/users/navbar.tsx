'use client'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import { UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

import { useWallet } from './WalletContext'
import Image from 'next/image'
export default function NavbarComponent() {
	const { walletBalance } = useWallet()
	const [currentPage, setCurrentPage] = useState('')

	const user = useUser()
	useEffect(() => {
		setCurrentPage(window.location.pathname) // Set the current page when component mounts
	}, [])

	return (
		<Disclosure as='nav' className='bg-black'>
			{({ open }) => (
				<>
					<div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
						<div className='relative flex h-20  justify-between'>
							<div className='absolute inset-y-0 text-white left-0 flex items-center sm:hidden'>
								<Disclosure.Button className='relative inline-flex items-center justify-center rounded-md p-2  '>
									<span className='absolute -inset-0.5' />
									<span className='sr-only'>Open main menu</span>
									{open ? (
										<XMarkIcon className='block h-6 w-6' aria-hidden='true' />
									) : (
										<Bars3Icon className='block h-6 w-6' aria-hidden='true' />
									)}
								</Disclosure.Button>
							</div>
							<div className='flex flex-1 items-center justify-center sm:items-stretch sm:justify-start'>
								<div className='flex lg:hidden md:hidden items-center justify-center sm:items-stretch sm:justify-start flex-1'>
									{' '}
									{/* Centering logo horizontally */}
									<a href='/' className='flex items-center'>
										<Image
											src='/images/logoinverted.png'
											alt='Logo'
											className='h-10 w-auto'
											width={100}
											height={100}
										/>
									</a>
								</div>

								<div className='hidden sm:ml-6 sm:flex sm:space-x-8'>
									<div className='flex items-center justify-center sm:items-stretch sm:justify-start flex-1'>
										{' '}
										{/* Centering logo horizontally */}
										<a href='/' className='flex items-center'>
											<Image
												src='/images/logoinverted.png'
												alt='Logo'
												className='h-10 w-auto'
												width={100}
												height={100}
											/>
										</a>
									</div>
									<a
										href='/users/dashboard'
										className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
											currentPage === '/users/dashboard'
												? 'text-white border-indigo-500'
												: 'text-gray-500 border-transparent'
										} `}>
										Dashboard
									</a>
									<a
										href='/users/bookasession'
										className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
											currentPage === '/users/bookasession'
												? 'text-white border-indigo-500'
												: 'text-gray-500 border-transparent'
										} `}>
										Book a session
									</a>
									{user?.user?.publicMetadata?.role === 'admin' && (
										<a
											href='/admin/manage-users'
											className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
												currentPage === '/admin/manage-users'
													? 'text-white border-indigo-500'
													: 'text-gray-500 border-transparent'
											} `}>
											Admin
										</a>
									)}
								</div>
							</div>
							<div className='absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0'>
								{walletBalance !== null && (
									<div className='text-white mr-4'>{walletBalance} credits</div>
								)}
								<UserButton afterSignOutUrl='/' />
							</div>
						</div>
					</div>
					<Disclosure.Panel className='sm:hidden'>
						<div className='space-y-1 pb-4 pt-2'>
							<a
								href='/users/dashboard'
								className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${
									currentPage === '/users/dashboard'
										? 'text-white bg-indigo-500 border-indigo-500'
										: 'text-gray-500 border-transparent'
								} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}>
								Dashboard
							</a>
							<a
								href='/users/bookasession'
								className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${
									currentPage === '/users/bookasession'
										? 'text-white bg-indigo-500 border-indigo-500'
										: 'text-gray-500 border-transparent'
								} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}>
								Book a session
							</a>
							<a
								href='/admin/manage-users'
								className={`block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 ${
									currentPage === '/admin/manage-users'
										? 'text-white bg-indigo-500 border-indigo-500'
										: 'text-gray-500 border-transparent'
								} hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700`}>
								Admin
							</a>
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	)
}
