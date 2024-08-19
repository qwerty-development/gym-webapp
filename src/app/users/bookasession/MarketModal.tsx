'use client'
import { motion } from 'framer-motion'
import Modal from 'react-modal'

const MarketModal = ({
	isOpen,
	onClose,
	market,
	selectedItems,
	handleItemSelect,
	totalPrice,
	handlePay,
	loading
}: any) => {
	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={onClose}
			contentLabel='Market Items'
			className='modal rounded-3xl p-4 sm:p-6 md:p-8 mx-auto mt-10 sm:mt-20 w-11/12 md:max-w-4xl'
			style={{
				content: {
					backgroundColor: 'rgba(53, 59, 53, 0.9)',
					backdropFilter: 'blur(16px)'
				}
			}}
			overlayClassName='overlay fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center'>
			<h2 className='text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-800'>
				Enhance Your Session
			</h2>
			<div className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8'>
				{market?.map((item: any) => (
					<motion.div
						key={item.id}
						className='bg-gray-700 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-green-400 hover:shadow-lg transition-all duration-300'>
						<div className='flex flex-col h-full'>
							{item.image && (
								<img
									src={item.image}
									alt={item.name}
									className='w-full h-32 object-cover mb-3 rounded-lg'
								/>
							)}
							<div className='flex justify-between items-center text-gray-300 mb-3 sm:mb-4'>
								<span className='font-semibold text-sm sm:text-lg'>
									{item.name}
								</span>
								<span className='text-lg sm:text-xl font-bold text-green-400'>
									{item.price} Credits
								</span>
							</div>
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className={`mt-auto w-full py-2 sm:py-3 rounded-full text-white font-semibold text-sm sm:text-base transition-all duration-300 ${
									selectedItems.find(
										(selectedItem: { id: any }) => selectedItem.id === item.id
									)
										? 'bg-red-700 hover:bg-red-600'
										: 'bg-green-500 hover:bg-green-600'
								}`}
								onClick={() => handleItemSelect(item)}>
								{selectedItems.find(
									(selectedItem: { id: any }) => selectedItem.id === item.id
								)
									? 'Remove'
									: 'Add'}
							</motion.button>
						</div>
					</motion.div>
				))}
			</div>
			<div className='text-right'>
				<p className='text-lg sm:text-xl md:text-2xl font-bold text-green-400 mb-3 sm:mb-4 md:mb-6'>
					Total Price: {totalPrice} Credits
				</p>
				<div className='flex flex-col sm:flex-row sm:justify-end space-y-3 sm:space-y-0 sm:space-x-6'>
					<motion.button
						whileHover={{
							scale: 1.05,
							boxShadow: '0 0 30px rgba(74, 222, 128, 0.7)'
						}}
						whileTap={{ scale: 0.95 }}
						className='bg-green-500 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-green-600 disabled:opacity-50'
						onClick={handlePay}
						disabled={loading}>
						{loading ? 'Processing...' : 'Complete Purchase'}
					</motion.button>
					<motion.button
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='bg-red-700 text-white py-2 sm:py-3 px-5 sm:px-6 md:px-8 rounded-full text-base sm:text-lg md:text-xl font-bold transition-all duration-300 hover:bg-red-600'
						onClick={onClose}>
						Close
					</motion.button>
				</div>
			</div>
		</Modal>
	)
}

export default MarketModal
