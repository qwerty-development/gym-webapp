'use client'
import React, { useState, useEffect, useMemo } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	RiShoppingCartLine,
	RiCloseLine,
	RiSearchLine,
	RiFilterLine
} from 'react-icons/ri'
import { FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa'
import NavbarComponent from '../../components/users/navbar'
import Bundles from '@/app/components/users/bundles'
import ClotheShop from '@/app/components/users/ClothesShop'
import toast from 'react-hot-toast'
import { useWallet } from '@/app/components/users/WalletContext'
import {
	fetchMarketItems,
	handlePurchase,
	fetchClothe
} from '../../../../utils/userRequests'

interface MarketItem {
	id: string
	name: string
	price: number
	image: string
	description?: string
	category?: string
	stock?: number
}

interface CartItem extends MarketItem {
	quantity: number
}

const Shop = () => {
	const { refreshWalletBalance, refreshTokens } = useWallet()
	const [activeShop, setActiveShop] = useState<
		'general' | 'clothes' | 'bundles'
	>('general')
	const [items, setItems] = useState<MarketItem[]>([])
	const [clothes, setClothes] = useState<MarketItem[]>([])
	const [cart, setCart] = useState<CartItem[]>([])
	const [isCartOpen, setIsCartOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
	const [sortBy, setSortBy] = useState<'price' | 'name' | null>(null)
	const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
	const [loading, setLoading] = useState(false)
	const { user } = useUser()

	// Fetch data
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true)
			try {
				const [marketItems, clotheItems] = await Promise.all([
					fetchMarketItems(),
					fetchClothe()
				])
				setItems(marketItems)
				setClothes(clotheItems)
			} catch (error) {
				toast.error('Failed to load shop items')
			}
			setLoading(false)
		}
		fetchData()
	}, [])

	// Filter and sort items
	const filteredItems = useMemo(() => {
		let filtered = items

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				item =>
					item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
					item.description?.toLowerCase().includes(searchQuery.toLowerCase())
			)
		}

		// Category filter
		if (selectedCategory) {
			filtered = filtered.filter(item => item.category === selectedCategory)
		}

		// Sort
		if (sortBy) {
			filtered = [...filtered].sort((a, b) => {
				const compareValue = sortOrder === 'asc' ? 1 : -1
				if (sortBy === 'price') {
					return (a.price - b.price) * compareValue
				}
				return a.name.localeCompare(b.name) * compareValue
			})
		}

		return filtered
	}, [items, searchQuery, selectedCategory, sortBy, sortOrder])

	const categories = useMemo(() => {
		return Array.from(new Set(items.map(item => item.category).filter(Boolean)))
	}, [items])

	// Cart functions
	const addToCart = (item: MarketItem) => {
		setCart(prevCart => {
			const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
			if (existingItem) {
				if (item.stock && existingItem.quantity >= item.stock) {
					toast.error('Maximum stock reached')
					return prevCart
				}
				return prevCart.map(cartItem =>
					cartItem.id === item.id
						? { ...cartItem, quantity: cartItem.quantity + 1 }
						: cartItem
				)
			}
			return [...prevCart, { ...item, quantity: 1 }]
		})
	}

	const removeFromCart = (item: MarketItem) => {
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

	const updateCartItemQuantity = (itemId: string, quantity: number) => {
		setCart(prevCart =>
			prevCart
				.map(item =>
					item.id === itemId
						? {
								...item,
								quantity: Math.max(
									0,
									Math.min(quantity, item.stock || Infinity)
								)
						  }
						: item
				)
				.filter(item => item.quantity > 0)
		)
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

		setLoading(true)
		try {
			const result = await handlePurchase(
				user.id,
				cart,
				parseFloat(getTotalPrice())
			)
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
				refreshTokens()

				// Refresh items to update stock
				const [marketItems, clotheItems] = await Promise.all([
					fetchMarketItems(),
					fetchClothe()
				])
				setItems(marketItems)
				setClothes(clotheItems)
			} else {
				toast.error(result.error || 'Purchase failed')
			}
		} catch (error) {
			toast.error('An error occurred during purchase')
		}
		setLoading(false)
	}

	// Shop content renderer
	const renderShopContent = () => {
		switch (activeShop) {
			case 'general':
				return (
					<div className='space-y-6'>
						{/* Search and filters */}
						<div className='flex flex-col md:flex-row gap-4'>
							<div className='relative flex-grow'>
								<RiSearchLine className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
								<input
									type='text'
									placeholder='Search items...'
									value={searchQuery}
									onChange={e => setSearchQuery(e.target.value)}
									className='w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500'
								/>
							</div>

							<select
								value={sortBy || ''}
								onChange={e => {
									setSortBy(e.target.value as 'price' | 'name' | null)
									setSortOrder('asc')
								}}
								className='bg-gray-700 border border-gray-600 rounded-lg px-4 py-2'>
								<option value=''>Sort By</option>
								<option value='price'>Price</option>
								<option value='name'>Name</option>
							</select>
							{sortBy && (
								<button
									onClick={() =>
										setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'))
									}
									className='p-2 bg-gray-700 border border-gray-600 rounded-lg'>
									{sortOrder === 'asc' ? '↑' : '↓'}
								</button>
							)}
						</div>

						{/* Items grid */}
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
							{loading ? (
								Array(6)
									.fill(0)
									.map((_, i) => (
										<div
											key={i}
											className='animate-pulse bg-gray-800 rounded-lg h-96'></div>
									))
							) : filteredItems.length === 0 ? (
								<div className='col-span-full text-center text-gray-400'>
									No items found
								</div>
							) : (
								filteredItems.map(item => {
									const cartItem = cart.find(ci => ci.id === item.id)
									return (
										<motion.div
											key={item.id}
											layout
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											exit={{ opacity: 0 }}
											className={`bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col ${
												cartItem ? 'ring-2 ring-green-500' : ''
											}`}>
											{item.image && (
												<div className='relative h-48 mb-4'>
													<img
														src={item.image}
														alt={item.name}
														className='absolute inset-0 w-full h-full object-cover rounded-lg'
													/>
													{cartItem && (
														<div className='absolute top-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center'>
															{cartItem.quantity}
														</div>
													)}
												</div>
											)}
											<h2 className='text-xl font-bold text-white mb-2'>
												{item.name}
											</h2>
											{item.description && (
												<p className='text-gray-400 mb-4 flex-grow'>
													{item.description}
												</p>
											)}
											<div className='flex items-center justify-between mb-4'>
												<p className='text-lg text-green-400'>
													{item.price.toFixed(2)} credits
												</p>
												{item.stock && (
													<p className='text-sm text-gray-400'>
														Stock: {item.stock}
													</p>
												)}
											</div>
											{cartItem ? (
												<div className='flex items-center justify-between'>
													<button
														onClick={() => removeFromCart(item)}
														className='p-2 text-red-500 hover:bg-red-500/20 rounded-lg'>
														<FaMinus />
													</button>
													<span className='text-white'>
														{cartItem.quantity}
													</span>
													<button
														onClick={() => addToCart(item)}
														className='p-2 text-green-500 hover:bg-green-500/20 rounded-lg'>
														<FaPlus />
													</button>
												</div>
											) : (
												<button
													onClick={() => addToCart(item)}
													className='w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'>
													Add to cart
												</button>
											)}
										</motion.div>
									)
								})
							)}
						</div>
					</div>
				)
			case 'clothes':
				return <ClotheShop />
			case 'bundles':
				return <Bundles />
			default:
				return null
		}
	}

	return (
		<div className='min-h-screen bg-gradient-to-br from-gray-900 to-gray-800'>
			<NavbarComponent />

			<div className='max-w-7xl mx-auto lg:ml-52 2xl:mx-auto px-4 sm:px-6 lg:px-8 py-12'>
				<motion.h1
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					className='text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-800 mb-8 sm:mb-12 text-center'>
					Shop
				</motion.h1>

				{/* Desktop Sidebar */}
				<div className='hidden lg:block fixed left-0 top-0 h-full bg-gray-800 z-30 transform transition-transform duration-300 ease-in-out w-48'>
					<h2 className='text-xl font-bold mb-4 mt-16 md:mt-4 ml-4 text-green-500'>
						Menu
					</h2>
					<ul className='space-y-2'>
						<li
							className={`text-white p-2 px-4 transition-colors duration-200 ${
								activeShop === 'general' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setActiveShop('general')}>
								<img
									src='https://www.svgrepo.com/show/307607/food-and-drink-food-edible-healthy.svg'
									className='mr-2 h-6 w-6 filter invert'
									alt='Items Icon'
								/>
								<span className='text-sm'>Items</span>
							</button>
						</li>
						<li
							className={`text-white p-2 px-4 transition-colors duration-200 ${
								activeShop === 'clothes' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left'
								onClick={() => setActiveShop('clothes')}>
								<img
									src='https://www.svgrepo.com/show/506321/shirt.svg'
									className='mr-2 h-6 w-6 filter invert'
									alt='Clothe Icon'
								/>
								<span className='text-sm'>Clothes</span>
							</button>
						</li>
						<li
							className={`text-white p-2 px-4 transition-colors duration-200 ${
								activeShop === 'bundles' ? 'bg-green-500' : ''
							}`}>
							<button
								className='flex items-center w-full text-left hover:text-green-400'
								onClick={() => setActiveShop('bundles')}>
								<img
									src='https://www.svgrepo.com/show/371744/bundle.svg'
									className='mr-2 h-6 w-6 filter invert'
									alt='Bundles Icon'
								/>
								<span className='text-sm'>Bundles</span>
							</button>
						</li>
					</ul>
				</div>

				{/* Mobile/Tablet Navigation */}
				<div className='lg:hidden sticky top-0 z-20 bg-gray-800 py-4 mb-6'>
					<div className='flex justify-center space-x-2'>
						{['general', 'clothes', 'bundles'].map(shop => (
							<button
								key={shop}
								onClick={() => setActiveShop(shop as typeof activeShop)}
								className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
									activeShop === shop
										? 'bg-green-500 text-white'
										: 'bg-gray-700 text-gray-300 hover:bg-gray-600'
								}`}>
								{shop.charAt(0).toUpperCase() + shop.slice(1)}
							</button>
						))}
					</div>
				</div>

				{/* Main Content */}
				<div className='relative mt-4'>
					{/* Cart Toggle Button */}
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={() => setIsCartOpen(true)}
						className='fixed right-4 bottom-4 z-50 flex items-center bg-green-500 text-white p-4 rounded-full hover:bg-green-600 shadow-lg'>
						<FaShoppingCart className='h-6 w-6' />
						{cart.length > 0 && (
							<motion.span
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold'>
								{cart.reduce((total, item) => total + item.quantity, 0)}
							</motion.span>
						)}
					</motion.button>

					{/* Main Shop Content */}
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeShop}
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.3 }}>
							{renderShopContent()}
						</motion.div>
					</AnimatePresence>

					{/* Cart Slide-over Panel */}
					<AnimatePresence>
						{isCartOpen && (
							<>
								{/* Backdrop */}
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className='fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40'
									onClick={() => setIsCartOpen(false)}
								/>

								{/* Cart Panel */}
								<motion.div
									initial={{ x: '100%' }}
									animate={{ x: 0 }}
									exit={{ x: '100%' }}
									transition={{ type: 'tween', duration: 0.3 }}
									className='fixed top-0 right-0 w-full md:w-96 h-full bg-gray-900 p-6 overflow-auto z-50 shadow-xl'>
									{/* Cart Header */}
									<div className='flex justify-between items-center mb-6'>
										<h2 className='text-2xl font-bold text-white flex items-center'>
											<FaShoppingCart className='mr-3' />
											Your Cart
											<span className='ml-2 text-sm text-gray-400'>
												(
												{cart.reduce((total, item) => total + item.quantity, 0)}{' '}
												items)
											</span>
										</h2>
										<button
											onClick={() => setIsCartOpen(false)}
											className='p-2 hover:bg-gray-800 rounded-full transition-colors'>
											<RiCloseLine className='h-6 w-6 text-gray-400' />
										</button>
									</div>

									{/* Cart Items */}
									{cart.length === 0 ? (
										<div className='flex flex-col items-center justify-center h-64 text-gray-400'>
											<RiShoppingCartLine className='h-16 w-16 mb-4' />
											<p>Your cart is empty</p>
										</div>
									) : (
										<div className='space-y-4'>
											{cart.map(item => (
												<motion.div
													key={item.id}
													layout
													className='flex items-center space-x-4 bg-gray-800 p-4 rounded-lg'>
													{item.image && (
														<img
															src={item.image}
															alt={item.name}
															className='w-16 h-16 object-cover rounded-lg'
														/>
													)}
													<div className='flex-grow'>
														<h3 className='text-white font-medium'>
															{item.name}
														</h3>
														<p className='text-green-400'>
															{(item.price * item.quantity).toFixed(2)} credits
														</p>
													</div>
													<div className='flex items-center space-x-2'>
														<button
															onClick={() => removeFromCart(item)}
															className='p-1 hover:bg-gray-700 rounded'>
															<FaMinus className='text-red-500' />
														</button>
														<input
															type='number'
															min='1'
															max={item.stock || 99}
															value={item.quantity}
															onChange={e =>
																updateCartItemQuantity(
																	item.id,
																	parseInt(e.target.value)
																)
															}
															className='w-12 bg-gray-700 text-center rounded p-1 text-white'
														/>
														<button
															onClick={() => addToCart(item)}
															className='p-1 hover:bg-gray-700 rounded'>
															<FaPlus className='text-green-500' />
														</button>
													</div>
												</motion.div>
											))}
										</div>
									)}

									{/* Cart Footer */}
									{cart.length > 0 && (
										<div className='mt-6 space-y-4'>
											<div className='border-t border-gray-800 pt-4'>
												<div className='flex justify-between text-lg font-bold text-white'>
													<span>Total:</span>
													<span>{getTotalPrice()} credits</span>
												</div>
											</div>
											<motion.button
												whileHover={{ scale: 1.02 }}
												whileTap={{ scale: 0.98 }}
												onClick={handlePurchaseClick}
												disabled={loading}
												className='w-full py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'>
												{loading ? 'Processing...' : 'Complete Purchase'}
											</motion.button>
											<button
												onClick={() => setCart([])}
												className='w-full py-3 bg-gray-800 text-gray-400 rounded-lg font-medium hover:bg-gray-700 transition-colors'>
												Clear Cart
											</button>
										</div>
									)}
								</motion.div>
							</>
						)}
					</AnimatePresence>
				</div>
			</div>
		</div>
	)
}

export default Shop
