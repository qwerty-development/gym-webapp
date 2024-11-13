import React, { useState } from 'react'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { motion } from 'framer-motion'
import { RingLoader } from 'react-spinners'
import toast from 'react-hot-toast'
import {
	FaUserCircle,
	FaCalendarAlt,
	FaRuler,
	FaWeight,
	FaVenusMars,
	FaPhone
} from 'react-icons/fa'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface UserInfoVerificationProps {
	userId: string
	requiredFields: string[]
	onVerificationComplete: () => void
}

interface FormData {
	phone: string
	DOB: Date | null
	height: string
	weight: string
	gender: string
}

const UserInfoVerification: React.FC<UserInfoVerificationProps> = ({
	userId,
	requiredFields,
	onVerificationComplete
}) => {
	const [formData, setFormData]: any = useState<FormData>({
		phone: '',
		DOB: null,
		height: '',
		weight: '',
		gender: ''
	})
	const [isLoading, setIsLoading] = useState(false)

	const genderOptions = [
		{ value: 'male', label: 'Male' },
		{ value: 'female', label: 'Female' },
		{ value: 'other', label: 'Other' }
	]

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const supabase = await supabaseClient()
			let updateData: any = {}

			requiredFields.forEach((field: any) => {
				if (field === 'DOB') {
					updateData[field] = formData[field]?.toISOString().split('T')[0]
				} else if (field === 'weight' && formData[field]) {
					updateData[field] = [
						{
							date: new Date().toISOString(),
							value: parseFloat(formData[field])
						}
					]
				} else {
					updateData[field] = formData[field]
				}
			})

			const { error } = await supabase
				.from('users')
				.update(updateData)
				.eq('user_id', userId)

			if (error) throw error

			toast.success('Profile updated successfully!')
			onVerificationComplete()
		} catch (error) {
			console.error('Error updating user information:', error)
			toast.error('Failed to save information. Please try again.')
		} finally {
			setIsLoading(false)
		}
	}

	const handleInputChange = (field: keyof FormData, value: any) => {
		setFormData((prev: any) => ({
			...prev,
			[field]: value
		}))
	}

	const isFormValid = () => {
		return requiredFields.every(field => {
			if (field === 'DOB') return formData[field as keyof FormData] !== null
			if (field === 'weight' || field === 'height') {
				const value = formData[field as keyof FormData]
				return value !== '' && !isNaN(Number(value))
			}
			return formData[field as keyof FormData] !== ''
		})
	}

	const getFieldIcon = (field: string) => {
		const icons = {
			phone: <FaPhone className='text-green-400' />,
			DOB: <FaCalendarAlt className='text-green-400' />,
			height: <FaRuler className='text-green-400' />,
			weight: <FaWeight className='text-green-400' />,
			gender: <FaVenusMars className='text-green-400' />
		}
		return icons[field as keyof typeof icons]
	}

	const getFieldLabel = (field: string) => {
		const labels = {
			phone: 'Phone Number',
			DOB: 'Date of Birth',
			height: 'Height (cm)',
			weight: 'Weight (kg)',
			gender: 'Gender'
		}
		return labels[field as keyof typeof labels]
	}

	const renderField = (field: string) => {
		switch (field) {
			case 'phone':
				return (
					<div className='relative'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							{getFieldIcon(field)}
						</div>
						<input
							type='tel'
							value={formData.phone}
							onChange={e => handleInputChange('phone', e.target.value)}
							placeholder='Enter phone number'
							className='w-full p-4 pl-12 bg-gray-700 border-2 border-green-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300'
						/>
					</div>
				)

			case 'DOB':
				return (
					<div className='relative'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							{getFieldIcon(field)}
						</div>
						<DatePicker
							selected={formData.DOB}
							onChange={date => handleInputChange('DOB', date)}
							dateFormat='yyyy-MM-dd'
							maxDate={new Date()}
							yearDropdownItemNumber={100}
							scrollableYearDropdown
							showYearDropdown
							placeholderText='Select your date of birth'
							className='w-full p-4 pl-12 bg-gray-700 border-2 border-green-400 rounded-xl text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300'
							wrapperClassName='w-full'
							popperClassName='date-picker-popper'
							calendarClassName='custom-calendar'
							dropdownMode='select'
						/>
					</div>
				)

			case 'height':
				return (
					<div className='relative'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							{getFieldIcon(field)}
						</div>
						<input
							type='number'
							value={formData.height}
							onChange={e => handleInputChange('height', e.target.value)}
							placeholder='Enter height in cm'
							className='w-full p-4 pl-12 bg-gray-700 border-2 border-green-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300'
						/>
					</div>
				)

			case 'weight':
				return (
					<div className='relative'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							{getFieldIcon(field)}
						</div>
						<input
							type='number'
							value={formData.weight}
							onChange={e => handleInputChange('weight', e.target.value)}
							placeholder='Enter weight in kg'
							className='w-full p-4 pl-12 bg-gray-700 border-2 border-green-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-300'
						/>
					</div>
				)

			case 'gender':
				return (
					<div className='relative'>
						<div className='absolute inset-y-0 left-4 flex items-center pointer-events-none'>
							{getFieldIcon(field)}
						</div>
						<select
							value={formData.gender}
							onChange={e => handleInputChange('gender', e.target.value)}
							className='w-full p-4 pl-12 bg-gray-700 border-2 border-green-500 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent appearance-none transition-all duration-300'>
							<option value=''>Select gender</option>
							{genderOptions.map(option => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</div>
				)

			default:
				return null
		}
	}

	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4'>
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				className='bg-gray-800 p-8 rounded-2xl shadow-lg max-w-md w-full'>
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					transition={{ type: 'spring', stiffness: 200, damping: 15 }}
					className='flex justify-center mb-8'>
					<div className='bg-gradient-to-r from-green-400 to-green-600 p-4 rounded-full shadow-xl'>
						<FaUserCircle className='text-white text-4xl' />
					</div>
				</motion.div>

				<h2 className='text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-4'>
					Complete Your Profile
				</h2>

				<p className='text-gray-300 text-center mb-8'>
					Please provide the following information to continue to the dashboard.
				</p>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<motion.div
						className='space-y-6'
						initial='hidden'
						animate='visible'
						variants={{
							visible: {
								transition: {
									staggerChildren: 0.1
								}
							}
						}}>
						{requiredFields.map(field => (
							<motion.div
								key={field}
								variants={{
									hidden: { opacity: 0, y: 20 },
									visible: { opacity: 1, y: 0 }
								}}
								className='space-y-2'>
								<label className='text-gray-300 text-sm font-medium pl-4'>
									{getFieldLabel(field)}
								</label>
								{renderField(field)}
							</motion.div>
						))}
					</motion.div>

					<motion.button
						type='submit'
						disabled={isLoading || !isFormValid()}
						whileHover={!isLoading && isFormValid() ? { scale: 1.02 } : {}}
						whileTap={!isLoading && isFormValid() ? { scale: 0.98 } : {}}
						className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all duration-300 ${
							isLoading || !isFormValid()
								? 'bg-gray-600 cursor-not-allowed'
								: 'bg-gradient-to-r from-green-400 to-green-600 hover:shadow-green-500/50'
						}`}>
						{isLoading ? (
							<div className='flex items-center justify-center'>
								<RingLoader color='#ffffff' size={24} />
							</div>
						) : (
							'Continue to Dashboard'
						)}
					</motion.button>
				</form>
			</motion.div>

			<style jsx global>{`
  .date-picker-popper {
    z-index: 9999 !important;
  }

  .custom-calendar {
    background-color: #353b35 !important; /* gray-800 */
    border: 2px solid #36783a !important; /* green-400 */
    border-radius: 1rem !important;
    font-family: inherit !important;
    overflow: hidden !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
    height: auto !important;
  }

  .custom-calendar .react-datepicker__header {
    background-color: #454c45 !important; /* gray-700 */
    border-bottom: 1px solid #6d726d !important; /* gray-600 */
    padding: 1rem !important;
  }

  .custom-calendar .react-datepicker__current-month,
  .custom-calendar .react-datepicker__day-name {
    color: #d1d4d1 !important; /* gray-200 */
    font-weight: 600 !important;
  }

  .custom-calendar .react-datepicker__day {
    color: #b8bcb8 !important; /* gray-300 */
    border-radius: 0.5rem !important;
    margin: 0.2rem !important;
    padding: 0.3rem !important;
    width: 2rem !important;
    height: 2rem !important;
    line-height: 1.4rem !important;
  }

  .custom-calendar .react-datepicker__day:hover {
    background-color: #4c6f46 !important; /* green-500 */
    color: #d1d4d1 !important; /* gray-200 */
  }

  .custom-calendar .react-datepicker__day--selected {
    background-color: #36783a !important; /* green-400 */
    color: #d1d4d1 !important; /* gray-200 */
  }

  .custom-calendar .react-datepicker__day--keyboard-selected {
    background-color: #4c6f46 !important; /* green-500 */
    color: #d1d4d1 !important; /* gray-200 */
  }

  .custom-calendar .react-datepicker__day--disabled {
    color: #6d726d !important; /* gray-600 */
  }

  .custom-calendar .react-datepicker__year-dropdown,
  .custom-calendar .react-datepicker__month-dropdown {
    background-color: #353b35 !important; /* gray-800 */
    border: 1px solid #36783a !important; /* green-400 */
  }

  .custom-calendar .react-datepicker__year-option:hover,
  .custom-calendar .react-datepicker__month-option:hover {
    background-color: #4c6f46 !important; /* green-500 */
  }

  .custom-calendar .react-datepicker__year-option,
  .custom-calendar .react-datepicker__month-option {
    color: #d1d4d1 !important; /* gray-200 */
    padding: 0.5rem !important;
  }

  .custom-calendar .react-datepicker__navigation {
    top: 1rem !important;
  }

  .custom-calendar .react-datepicker__navigation-icon::before {
    border-color: #36783a !important; /* green-400 */
    border-width: 2px 2px 0 0 !important;
  }

  .custom-calendar .react-datepicker__day--today {
    font-weight: bold !important;
    border: 1px solid #36783a !important; /* green-400 */
  }

  .custom-calendar .react-datepicker__triangle {
    display: none !important;
  }
`}</style>
		</div>
	)
}

export default UserInfoVerification
