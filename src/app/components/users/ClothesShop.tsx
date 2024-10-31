import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchClothe, handlePurchase } from '../../../../utils/userRequests'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useWallet } from './WalletContext'
import { FaShoppingCart, FaTimes, FaPlus, FaMinus } from 'react-icons/fa'

interface ClotheItem {
	id: string
	name: string
	price: number
	image: string
	quantity: number
}

interface CartItem extends ClotheItem {
	quantity: number
}

const ClotheShop = () => {
	const { refreshWalletBalance } = useWallet()
	const [clothes, setClothes] = useState<ClotheItem[]>([])
	const [cart, setCart] = useState<CartItem[]>([])
	const [isCartOpen, setIsCartOpen] = useState(false)
	const { user } = useUser()
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		const getClothes = async () => {
			setIsLoading(true)
			try {
				const clotheItems = await fetchClothe()
				setClothes(clotheItems)
			} catch (error) {
				toast.error('Failed to load clothes')
			} finally {
				setIsLoading(false)
			}
		}

		getClothes()
	}, [])

	const addToCart = (item: ClotheItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem) {
				return prevCart.map(cartItem =>
					cartItem.id === item.id
						? { ...cartItem, quantity: cartItem.quantity + 1 }
						: cartItem
				)
			}
			return [...prevCart, { ...item, quantity: 1 }]
		})
		toast.success(`Added ${item.name} to cart`)
	}

	const removeFromCart = (item: ClotheItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem) {
				if (existingItem.quantity === 1) {
					return prevCart.filter(cartItem => cartItem.id !== item.id)
				}
				return prevCart.map(cartItem =>
					cartItem.id === item.id
						? { ...cartItem, quantity: cartItem.quantity - 1 }
						: cartItem
				)
			}
			return prevCart
		})
	}

	const getTotalPrice = () => {
		return cart
			.reduce((total, item) => total + item.price * item.quantity, 0)
			.toFixed(2)
	}

	const handlePurchaseClick = async () => {
		if (!user) {
			toast.error('Please log in to make a purchase.')
			return
		}

		try {
			const totalPrice = parseFloat(getTotalPrice())
			const result = await handlePurchase(user.id, cart, totalPrice)

			if (result.success) {
				setCart([])
				toast.success('Purchase successful!')
				refreshWalletBalance()
				const clotheItems = await fetchClothe()
				setClothes(clotheItems)
				setIsCartOpen(false)
			} else {
				toast.error(result.error || 'Purchase failed. Please try again.')
			}
		} catch (error) {
			toast.error('An error occurred during purchase')
		}
	}

	if (isLoading) {
		return (
			<div className='flex justify-center items-center min-h-screen'>
				<div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500'></div>
			</div>
		)
	}

	return (
		<div className='relative px-4 py-8 mx-auto max-w-7xl'>
			{/* Cart Button */}
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => setIsCartOpen(true)}
				className='fixed right-4 bottom-4 z-50 flex items-center bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600'>
				<FaShoppingCart className='h-6 w-6' />
				{cart.length > 0 && (
					<span className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>
						{cart.length}
					</span>
				)}
			</motion.button>

			{/* Clothes Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
				{clothes.length > 0 ? (
					clothes.map(item => (
						<motion.div
							key={item.id}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.3 }}
							className='bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-green-500/30 transition-all duration-300'>
							{item.image && (
								<div className='relative h-48 w-full'>
									<img
										src={item.image}
										alt={item.name}
										className='w-full h-full object-cover'
									/>
								</div>
							)}
							<div className='p-4'>
								<h2 className='text-xl font-bold text-white mb-2'>
									{item.name}
								</h2>
								<p className='text-lg text-green-400 mb-4'>
									{item.price.toFixed(2)} credits
								</p>
								<motion.button
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									onClick={() => addToCart(item)}
									className='w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300'>
									Add to cart
								</motion.button>
							</div>
						</motion.div>
					))
				) : (
					<div className='col-span-full flex justify-center items-center py-12'>
						<p className='text-white text-xl'>No clothes available</p>
					</div>
				)}
			</div>

			{/* Cart Sidebar */}
			<AnimatePresence>
				{isCartOpen && (
					<motion.div
						initial={{ x: '100%' }}
						animate={{ x: 0 }}
						exit={{ x: '100%' }}
						transition={{ type: 'tween', duration: 0.3 }}
						className='fixed top-0 right-0 w-full md:w-96 h-full bg-gray-900 shadow-xl z-50 overflow-y-auto'>
						<div className='p-6'>
							<div className='flex justify-between items-center mb-6'>
								<h2 className='text-2xl font-bold text-white'>Your Cart</h2>
								<button
									onClick={() => setIsCartOpen(false)}
									className='p-2 hover:bg-gray-800 rounded-full transition-colors duration-200'>
									<FaTimes className='text-white text-xl' />
								</button>
							</div>

							{cart.length > 0 ? (
								<>
									<div className='space-y-4 mb-6'>
										{cart.map(cartItem => (
											<div
												key={cartItem.id}
												className='flex justify-between items-center bg-gray-800 p-4 rounded-lg'>
												<div className='flex-1'>
													<h3 className='text-white font-medium'>
														{cartItem.name}
													</h3>
													<p className='text-green-400'>
														{(cartItem.price * cartItem.quantity).toFixed(2)}{' '}
														credits
													</p>
												</div>
												<div className='flex items-center space-x-3'>
													<button
														onClick={() => removeFromCart(cartItem)}
														className='p-1 hover:bg-gray-700 rounded-full'>
														<FaMinus className='text-red-500' />
													</button>
													<span className='text-white'>
														{cartItem.quantity}
													</span>
													<button
														onClick={() => addToCart(cartItem)}
														className='p-1 hover:bg-gray-700 rounded-full'>
														<FaPlus className='text-green-500' />
													</button>
												</div>
											</div>
										))}
									</div>

									<div className='border-t border-gray-800 pt-4 mb-6'>
										<div className='flex justify-between items-center mb-6'>
											<span className='text-white font-medium'>Total:</span>
											<span className='text-2xl font-bold text-green-400'>
												{getTotalPrice()} credits
											</span>
										</div>

										<motion.button
											whileHover={{ scale: 1.02 }}
											whileTap={{ scale: 0.98 }}
											onClick={handlePurchaseClick}
											className='w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-300 font-medium'>
											Complete Purchase
										</motion.button>
									</div>
								</>
							) : (
								<div className='flex flex-col items-center justify-center py-12'>
									<FaShoppingCart className='text-4xl text-gray-600 mb-4' />
									<p className='text-gray-400 text-center'>
										Your cart is empty
									</p>
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default ClotheShop
