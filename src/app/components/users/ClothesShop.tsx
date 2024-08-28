import React, { useState, useEffect } from 'react'
import { fetchClothe, handlePurchase } from '../../../../utils/userRequests'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { useWallet } from './WalletContext'

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

const ClotheShop: React.FC = () => {
    const { refreshWalletBalance } = useWallet()
    const [clothes, setClothes] = useState<ClotheItem[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [isCartOpen, setIsCartOpen] = useState(false)
    const { user } = useUser()

    useEffect(() => {
        const getClothes = async () => {
            const clotheItems = await fetchClothe()
            setClothes(clotheItems)
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
            } else {
                return [...prevCart, { ...item, quantity: 1 }]
            }
        })
    }

    const removeFromCart = (item: ClotheItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id)
            if (existingItem) {
                if (existingItem.quantity === 1) {
                    return prevCart.filter(cartItem => cartItem.id !== item.id)
                } else {
                    return prevCart.map(cartItem =>
                        cartItem.id === item.id
                            ? { ...cartItem, quantity: cartItem.quantity - 1 }
                            : cartItem
                    )
                }
            }
            return prevCart
        })
    }

    const getTotalPrice = () => {
        return cart
            .reduce((total, item) => total + item.price * item.quantity, 0)
            .toFixed(2)
    }

    const toggleCart = () => {
        setIsCartOpen(!isCartOpen)
    }

    const handlePurchaseClick = async () => {
        if (!user) {
            toast.error('Please log in to make a purchase.')
            return
        }

        const userId = user.id
        const totalPrice = parseFloat(getTotalPrice())
        const result = await handlePurchase(userId, cart, totalPrice)

        if (result.success) {
            setCart([])
            toast.success('Purchase successful!')
            refreshWalletBalance()
            const clotheItems = await fetchClothe()
            setClothes(clotheItems)
        } else {
            toast.error(result.error || 'Purchase failed. Please try again.')
        }
    }

    return (
        <div className='relative mt-4'>
            <button
                onClick={toggleCart}
                className='fixed right-4 bottom-4 z-50 flex items-center bg-white text-green-500 p-2 rounded-full hover:bg-gray-200'
            >
                <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='feather feather-shopping-cart h-6 w-6'
                >
                    <circle cx='9' cy='21' r='1'></circle>
                    <circle cx='20' cy='21' r='1'></circle>
                    <path d='M1 1h4l1.68 8.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'></path>
                </svg>
                {cart.length > 0 && (
                    <span className='ml-2 text-sm bg-green-500 text-white rounded-full px-2 py-1'>
                        {cart.length}
                    </span>
                )}
            </button>

            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                {clothes.length !== 0 &&
                    clothes.map(item => (
                        <div
                            key={item.id}
                            className='bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-center'
                        >
                            {item.image && (
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className='w-full h-48 object-cover mb-4 rounded-lg'
                                />
                            )}
                            <h2 className='text-2xl font-bold text-white mb-4'>
                                {item.name}
                            </h2>
                            <p className='text-lg text-green-400 mb-4'>
                                {item.price.toFixed(2)} credits
                            </p>
                            <button
                                className='mt-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600'
                                onClick={() => addToCart(item)}
                            >
                                Add to cart
                            </button>
                        </div>
                    ))}
            </div>
            {clothes.length == 0 && (
                <div className='flex justify-center items-center'>
                    <p className='text-white text-2xl'>No clothes available</p>
                </div>
            )}

            {isCartOpen && (
                <div className='fixed top-0 right-0 w-full md:w-1/3 h-full bg-gray-900 p-6 overflow-auto z-40'>
                    <h2 className='text-2xl font-bold text-white mb-6'>Your Cart</h2>
                    {cart.map(cartItem => (
                        <div
                            key={cartItem.id}
                            className='flex justify-between items-center mb-4'
                        >
                            <span className='text-white'>
                                {cartItem.name} (x{cartItem.quantity})
                            </span>
                            <div className='flex items-center'>
                                <span className='text-green-400 mr-4'>
                                    {(cartItem.price * cartItem.quantity).toFixed(2)} credits
                                </span>
                                <button
                                    className='text-red-500 hover:text-red-700'
                                    onClick={() => removeFromCart(cartItem)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className='border-t border-gray-700 pt-4'>
                        <h3 className='text-xl font-bold text-white'>
                            Total: {getTotalPrice()} credits
                        </h3>
                    </div>
                    <button
                        onClick={handlePurchaseClick}
                        className='mt-6 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600'
                    >
                        Buy
                    </button>
                    <button
                        onClick={toggleCart}
                        className='mt-6 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600'
                    >
                        Close
                    </button>
                </div>
            )}
        </div>
    )
}

export default ClotheShop