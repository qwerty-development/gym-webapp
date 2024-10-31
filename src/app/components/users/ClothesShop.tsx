import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchClothe, handlePurchase } from '../../../../utils/userRequests'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useWallet } from './WalletContext'
import {
	FaShoppingCart,
	FaTimes,
	FaPlus,
	FaMinus,
	FaSearch,
	FaTshirt
} from 'react-icons/fa'
import { RiShoppingCartLine } from 'react-icons/ri'

interface ClotheItem {
	id: string
	name: string
	price: number
	image: string
	quantity: number
	clothe: boolean
}

interface CartItem extends ClotheItem {
	quantity: number
}

const ClotheShop = () => {
	const { refreshWalletBalance } = useWallet()
	const [clothes, setClothes] = useState<any[]>([])
	const [cart, setCart] = useState<CartItem[]>([])
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | null>(null)
	const { user } = useUser()

	useEffect(() => {
		const loadClothes = async () => {
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
		loadClothes()
	}, [])

	const filteredClothes = useMemo(() => {
		let filtered = clothes

		if (searchQuery) {
			filtered = filtered.filter(item =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		if (sortBy) {
			filtered = [...filtered].sort((a, b) => {
				if (sortBy === 'price-asc') return a.price - b.price
				return b.price - a.price
			})
		}

		return filtered
	}, [clothes, searchQuery, sortBy])

	const getItemQuantityInCart = (itemId: string) => {
		const cartItem = cart.find(item => item.id === itemId)
		return cartItem ? cartItem.quantity : 0
	}

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
	}

	const removeFromCart = (item: CartItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem?.quantity === 1) {
				return prevCart.filter(cartItem => cartItem.id !== item.id)
			}
			return prevCart.map(cartItem =>
				cartItem.id === item.id
					? { ...cartItem, quantity: cartItem.quantity - 1 }
					: cartItem
			)
		})
	}

	const updateCartItemQuantity = (itemId: string, newQuantity: number) => {
		const item = clothes.find(i => i.id === itemId)
		if (!item) return

		if (newQuantity > item.quantity) {
			toast.error('Maximum stock reached')
			return
		}

		setCart(prevCart => {
			if (newQuantity === 0) {
				return prevCart.filter(cartItem => cartItem.id !== itemId)
			}
			return prevCart.map(cartItem =>
				cartItem.id === itemId
					? { ...cartItem, quantity: newQuantity }
					: cartItem
			)
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

		setIsLoading(true)
		try {
			const totalPrice = parseFloat(getTotalPrice())
			const result = await handlePurchase(user.id, cart, totalPrice)

			if (result.success) {
				setCart([])
				toast.success('Purchase successful!')
				if (result.tokensEarned) {
					toast.success(`You earned ${result.tokensEarned} tokens!`, {
						duration: 5000,
						icon: '🎉'
					})
				}
				refreshWalletBalance()
				const clotheItems = await fetchClothe()
				setClothes(clotheItems)
				setIsCartOpen(false)
			} else {
				toast.error(result.error || 'Purchase failed. Please try again.')
			}
		} catch (error) {
			toast.error('An error occurred during purchase')
		} finally {
			setIsLoading(false)
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
			{/* Filters and Search Section */}
			<div className='mb-8 space-y-4'>
				<div className='flex flex-col md:flex-row gap-4'>
					<div className='relative flex-grow'>
						<FaSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
						<input
							type='text'
							placeholder='Search clothes...'
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							className='w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 text-white'
						/>
					</div>
					<select
						value={sortBy || ''}
						onChange={e => setSortBy(e.target.value as any)}
						className='p-2 bg-gray-800 border border-gray-700 rounded-lg text-white'>
						<option value=''>Sort By</option>
						<option value='price-asc'>Price: Low to High</option>
						<option value='price-desc'>Price: High to Low</option>
					</select>
				</div>
			</div>

			{/* Cart Button */}
			<motion.button
				whileHover={{ scale: 1.05 }}
				whileTap={{ scale: 0.95 }}
				onClick={() => setIsCartOpen(true)}
				className='fixed right-4 bottom-4 z-50 flex items-center bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600'>
				<FaShoppingCart className='h-6 w-6' />
				{cart.length > 0 && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm'>
						{cart.reduce((total, item) => total + item.quantity, 0)}
					</motion.span>
				)}
			</motion.button>

			{/* Clothes Grid */}
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
				{filteredClothes.length > 0 ? (
					filteredClothes.map(item => {
						const itemQuantityInCart = getItemQuantityInCart(item.id)
						return (
							<motion.div
								key={item.id}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.3 }}
								className='bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-green-500/30 transition-all duration-300'>
								<div className='relative'>
									{item.image && (
										<img
											src={item.image}
											alt={item.name}
											className='w-full h-64 object-cover'
										/>
									)}
									{itemQuantityInCart > 0 && (
										<div className='absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm'>
											{itemQuantityInCart} in cart
										</div>
									)}
								</div>

								<div className='p-4'>
									<div className='flex justify-between items-start mb-4'>
										<h2 className='text-xl font-bold text-white'>
											{item.name}
										</h2>
										<span className='text-lg text-green-400'>
											{item.price.toFixed(2)} credits
										</span>
									</div>
									{itemQuantityInCart > 0 ? (
										<div className='flex items-center justify-between'>
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={() => removeFromCart({ ...item, quantity: 1 })}
												className='p-2 text-red-500 hover:bg-red-500/20 rounded-lg'>
												<FaMinus />
											</motion.button>
											<span className='text-white'>{itemQuantityInCart}</span>
											<motion.button
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.9 }}
												onClick={() => addToCart(item)}
												className='p-2 text-green-500 hover:bg-green-500/20 rounded-lg'>
												<FaPlus />
											</motion.button>
										</div>
									) : (
										<motion.button
											whileHover={{ scale: 1.05 }}
											whileTap={{ scale: 0.95 }}
											onClick={() => addToCart(item)}
											className='w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
											Add to cart
										</motion.button>
									)}
								</div>
							</motion.div>
						)
					})
				) : (
					<div className='col-span-full flex flex-col items-center justify-center py-12'>
						<FaTshirt className='text-6xl text-gray-600 mb-4' />
						<p className='text-gray-400 text-xl text-center'>
							No clothes found matching your criteria
						</p>
					</div>
				)}
			</div>

			{/* Cart Sidebar */}
			<AnimatePresence>
				{isCartOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
							onClick={() => setIsCartOpen(false)}
						/>
						<motion.div
							initial={{ x: '100%' }}
							animate={{ x: 0 }}
							exit={{ x: '100%' }}
							transition={{ type: 'tween', duration: 0.3 }}
							className='fixed top-0 right-0 w-full md:w-96 h-full bg-gray-900 shadow-xl z-50 overflow-y-auto'>
							<div className='p-6'>
								<div className='flex justify-between items-center mb-6'>
									<h2 className='text-2xl font-bold text-white flex items-center'>
										<FaShoppingCart className='mr-3' />
										Shopping Cart
										<span className='ml-2 text-sm text-gray-400'>
											({cart.reduce((total, item) => total + item.quantity, 0)}{' '}
											items)
										</span>
									</h2>
									<button
										onClick={() => setIsCartOpen(false)}
										className='p-2 hover:bg-gray-800 rounded-full transition-colors'>
										<FaTimes className='text-white' />
									</button>
								</div>

								{cart.length > 0 ? (
									<>
										<div className='space-y-4 mb-6'>
											{cart.map((cartItem, index) => (
												<motion.div
													key={`${cartItem.id}-${index}`}
													layout
													initial={{ opacity: 0, y: 20 }}
													animate={{ opacity: 1, y: 0 }}
													exit={{ opacity: 0, y: -20 }}
													className='flex items-center space-x-4 bg-gray-800 p-4 rounded-lg'>
													{cartItem.image && (
														<img
															src={cartItem.image}
															alt={cartItem.name}
															className='w-16 h-16 object-cover rounded-lg'
														/>
													)}
													<div className='flex-1'>
														<h3 className='text-white font-medium'>
															{cartItem.name}
														</h3>
														<p className='text-green-400'>
															{(cartItem.price * cartItem.quantity).toFixed(2)}{' '}
															credits
														</p>
													</div>
													<div className='flex items-center space-x-2'>
														<motion.button
															whileHover={{ scale: 1.1 }}
															whileTap={{ scale: 0.9 }}
															onClick={() => removeFromCart(cartItem)}
															className='p-1 hover:bg-gray-700 rounded-full'>
															<FaMinus className='text-red-500' />
														</motion.button>
														<span className='text-white w-8 text-center'>
															{cartItem.quantity}
														</span>
														<motion.button
															whileHover={{ scale: 1.1 }}
															whileTap={{ scale: 0.9 }}
															onClick={() => addToCart(cartItem)}
															className='p-1 hover:bg-gray-700 rounded-full'>
															<FaPlus className='text-green-500' />
														</motion.button>
													</div>
												</motion.div>
											))}
										</div>

										<div className='border-t border-gray-800 pt-4 space-y-4'>
											<div className='flex justify-between text-lg font-bold text-white'>
												<span>Total:</span>
												<span>{getTotalPrice()} credits</span>
											</div>
											<motion.button
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={handlePurchaseClick}
												disabled={isLoading}
												className='w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
												{isLoading ? 'Processing...' : 'Complete Purchase'}
											</motion.button>
											<button
												onClick={() => setCart([])}
												className='w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-medium hover:bg-gray-700 transition-colors'>
												Clear Cart
											</button>
										</div>
									</>
								) : (
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										className='flex flex-col items-center justify-center py-12'>
										<RiShoppingCartLine className='text-6xl text-gray-600 mb-4' />
										<p className='text-gray-400 text-center mb-6'>
											Your cart is empty
										</p>
										<button
											onClick={() => setIsCartOpen(false)}
											className='px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
											Continue Shopping
										</button>
									</motion.div>
								)}
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</div>
	)
}

export default ClotheShop
