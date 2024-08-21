// app/users/health-profile/components/UserInfoForm.tsx
import React, { useState } from 'react'
import { supabaseClient } from '../../../../utils/supabaseClient'
import { useUser } from '@clerk/nextjs'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

interface UserInfoFormProps {
	userData: any
	onUpdate: () => void
}

const UserInfoForm: React.FC<UserInfoFormProps> = ({ userData, onUpdate }) => {
	const { user } = useUser()
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

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleDateChange = (date: Date | null) => {
		setFormData(prev => ({ ...prev, DOB: date }))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
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
		<form
			onSubmit={handleSubmit}
			className='border border-green-800 shadow-md rounded px-8 pt-6 pb-8 mb-4'>
			<div className='mb-4'>
				<label
					className='block text-gray-300 text-sm font-bold mb-2'
					htmlFor='phone'>
					Phone
				</label>
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
				<DatePicker
					selected={formData.DOB}
					onChange={handleDateChange}
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
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
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='weight'
					type='number'
					name='weight'
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
				<input
					className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-300 bg-gray-700 leading-tight focus:outline-none focus:shadow-outline'
					id='waist_circumference'
					type='number'
					name='waist_circumference'
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
	)
}

export default UserInfoForm
