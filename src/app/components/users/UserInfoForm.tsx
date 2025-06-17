// app/users/health-profile/components/UserInfoForm.tsx
import React, { useState } from 'react'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { useUser } from '@clerk/nextjs'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

// Custom styles to hide the header navigation and style disabled dates
const customStyles = `
.custom-datepicker .react-datepicker__header {
	background-color: #374151 !important;
	border-bottom: 1px solid #4B5563 !important;
}
.custom-datepicker .react-datepicker__current-month {
	display: none !important;
}
.custom-datepicker .react-datepicker__navigation {
	display: none !important;
}
.custom-datepicker .react-datepicker {
	background-color: #374151 !important;
	border: 1px solid #4B5563 !important;
	color: #D1D5DB !important;
}
.custom-datepicker .react-datepicker__day {
	color: #D1D5DB !important;
}
.custom-datepicker .react-datepicker__day:hover {
	background-color: #4B5563 !important;
}
.custom-datepicker .react-datepicker__day--selected {
	background-color: #059669 !important;
}
.custom-datepicker .react-datepicker__day-name {
	color: #9CA3AF !important;
}
.custom-datepicker .react-datepicker__day--disabled {
	color: #6B7280 !important;
	background-color: #1F2937 !important;
	cursor: not-allowed !important;
	text-decoration: line-through !important;
	opacity: 0.5 !important;
}
.custom-datepicker .react-datepicker__day--disabled:hover {
	background-color: #1F2937 !important;
	color: #6B7280 !important;
}
.custom-datepicker .react-datepicker__day--today.react-datepicker__day--disabled {
	color: #6B7280 !important;
	background-color: #1F2937 !important;
	font-weight: normal !important;
}
`

interface UserInfoFormProps {
	userData: any
	onUpdate: () => void
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ userData, onUpdate }) => {
	const { user } = useUser()
	const [weightError, setWeightError] = useState('')
	const [waistError, setWaistError] = useState('')
	const [phoneError, setPhoneError] = useState('')
	const [dobError, setDobError] = useState('')
	const [formData, setFormData] = useState({
		DOB: userData.DOB ? new Date(userData.DOB) : null,
		phone: userData.phone || '',
		height: userData.height || '',
		weight: '',
		gender: userData.gender || '',
		activity_level: userData.activity_level || '',
		waist_circumference: userData.waist_circumference
			? userData.waist_circumference[userData.waist_circumference.length - 1]
					?.value 
					
			: '',
		new_goal: ''
	})

	// Function to filter out dates that are today or in the future
	const filterPassedTime = (time: Date) => {
		const today = new Date()
		today.setHours(0, 0, 0, 0) // Set to start of today
		return time < today
	}

	// Generate year range (from 1900 to current year)
	const currentYear = new Date().getFullYear()
	const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i)

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		if (name === 'weight') {
			if (parseFloat(value) < 0) {
				setWeightError('Weight cannot be negative')
			} else {
				setWeightError('')
			}
		}
		if (name === 'waist_circumference') {
			if (parseFloat(value) < 0) {
				setWaistError('Waist circumference cannot be negative')
			} else {
				setWaistError('')
			}
		}
		if (name === 'phone') {
			const phoneRegex = /^[\d\s\-()+]+$/
			if (value && !phoneRegex.test(value)) {
				setPhoneError('Phone number format is not valid')
			} else {
				setPhoneError('')
			}
		}
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleDateChange = (date: Date | null) => {
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		
		if (date && date >= today) {
			setDobError('Date of birth cannot be today or in the future')
			return
		} else {
			setDobError('')
		}
		setFormData(prev => ({ ...prev, DOB: date }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		// Validate date of birth
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		
		if (formData.DOB && formData.DOB >= today) {
			setDobError('Date of birth cannot be today or in the future')
			return
		}
		
		if (parseFloat(formData.weight) < 0) {
			setWeightError('Weight cannot be negative')
			return
		}
		if (parseFloat(formData.waist_circumference) < 0) {
			setWaistError('Waist circumference cannot be negative')
			return
		}
		
		const supabase = await supabaseClient()

		const updates = {
			DOB: formData.DOB,
			phone: formData.phone,
			height: formData.height ? parseInt(formData.height) : null,
			weight: formData.weight
				? [
						...(userData.weight || []),
						{
							date: new Date().toISOString(),
							value: parseFloat(formData.weight)
						}
				  ]
				: userData.weight,
			gender: formData.gender,
			activity_level: formData.activity_level,
			waist_circumference: formData.waist_circumference
				? [
						...(userData.waist_circumference || []),
						{
							date: new Date().toISOString(),
							value: parseFloat(formData.waist_circumference)
						}
				  ]
				: userData.waist_circumference,
			health_goals: formData.new_goal
				? [
						...(userData.health_goals || []),
						{
							description: formData.new_goal,
							created_at: new Date().toISOString(),
							completed: false
						}
				  ]
				: userData.health_goals
		}

		const { error } = await supabase
			.from('users')
			.update(updates)
			.eq('user_id', user?.id)

		if (error) {
			console.error('Error updating user data:', error)
		} else {
			onUpdate()
			setFormData(prev => ({
				...prev,
				weight: '',
				waist_circumference: '',
				new_goal: ''
			}))
		}
	}

	return (
		<>
			<style>{customStyles}</style>
			<form
				onSubmit={handleSubmit}
				className='border border-green-800 shadow-md rounded px-8 pt-6 pb-8 mb-4'>
			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='phone'>
					Phone
				</label>
				{phoneError && (
					<p className="text-red-500 text-sm mb-2">{phoneError}</p>
				)}
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='phone'
					type='text'
					name='phone'
					value={formData.phone}
					onChange={handleInputChange}
				/>
			</div>
			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='DOB'>
					Date of Birth
				</label>
				{dobError && (
					<p className="text-red-500 text-sm mb-2">{dobError}</p>
				)}
				<DatePicker
					selected={formData.DOB}
					onChange={handleDateChange}
					maxDate={new Date()} // Prevent future dates
					filterDate={filterPassedTime} // Filter out today and future dates
					showYearDropdown
					showMonthDropdown
					scrollableYearDropdown
					yearDropdownItemNumber={years.length}
					dropdownMode="select"
					dateFormat="dd/MM/yyyy"
					showPopperArrow={false}
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					placeholderText="Select date of birth"
					calendarClassName="custom-datepicker"
				/>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='height'>
					Height (cm)
				</label>
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='height'
					type='number'
					name='height'
					value={formData.height}
					onChange={handleInputChange}
				/>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='weight'>
					Weight (kg)
				</label>
				{weightError && (
					<p className="text-red-500 text-sm mb-2">{weightError}</p>
				)}
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='weight'
					type='number'
					name='weight'
					min="0"
					value={formData.weight}
					onChange={handleInputChange}
				/>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='gender'>
					Gender
				</label>
				<select
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='gender'
					name='gender'
					value={formData.gender}
					onChange={handleInputChange}>
					<option value=''>Select Gender</option>
					<option value='male'>Male</option>
					<option value='female'>Female</option>
					<option value='other'>Other</option>
				</select>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='activity_level'>
					Activity Level
				</label>
				<select
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='activity_level'
					name='activity_level'
					value={formData.activity_level}
					onChange={handleInputChange}>
					<option value=''>Select Activity Level</option>
					<option value='sedentary'>Sedentary</option>
					<option value='lightly_active'>Lightly Active</option>
					<option value='moderately_active'>Moderately Active</option>
					<option value='very_active'>Very Active</option>
					<option value='extra_active'>Extra Active</option>
				</select>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='waist_circumference'>
					Waist Circumference (cm)
				</label>
				{waistError && (
					<p className="text-red-500 text-sm mb-2">{waistError}</p>
				)}
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='waist_circumference'
					type='number'
					name='waist_circumference'
					min="0"
					value={formData.waist_circumference}
					onChange={handleInputChange}
				/>
			</div>

			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='new_goal'>
					Add New Health Goal
				</label>
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='new_goal'
					type='text'
					name='new_goal'
					value={formData.new_goal}
					onChange={handleInputChange}
					placeholder='Enter a new health goal'
				/>
			</div>

			<div className='flex items-center justify-center mt-5'>
				<button
					className='bg-green-900 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
					type='submit'>
					Update
				</button>
			</div>
		</form>
		</>
	)
}

export default UserInfoForm