'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaSave, FaExclamationTriangle } from 'react-icons/fa'
import toast from 'react-hot-toast'

type EditActivityModalProps = {
	isOpen: boolean
	activity: any
	onClose: () => void
	onSave: (updatedActivity: any) => void
	buttonLoading: boolean
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({
	isOpen,
	activity,
	onClose,
	onSave,
	buttonLoading
}) => {
	const [formData, setFormData] = useState({
		name: '',
		credits: 0,
		capacity: 0,
		semi_private: false,
		group: false
	})

	const [validationErrors, setValidationErrors] = useState({
		semiPrivateGroup: false
	})

	useEffect(() => {
		if (activity) {
			setFormData({
				name: activity.name || '',
				credits: activity.credits || 0,
				capacity: activity.capacity || 0,
				semi_private: activity.semi_private || false,
				group: activity.group || false
			})
		}
	}, [activity])

	const validateForm = () => {
		const errors = {
			semiPrivateGroup: false
		}

		// Check if trying to make an activity with > 4 capacity semi-private
		if (formData.capacity > 4 && formData.semi_private) {
			errors.semiPrivateGroup = true
		}

		setValidationErrors(errors)
		return !errors.semiPrivateGroup
	}

	const handleInputChange = (field: string, value: any) => {
		const newFormData = { ...formData, [field]: value }

		// Handle semi-private logic
		if (field === 'semi_private' && value === true) {
			// When enabling semi-private, cap capacity at 4 and disable group
			newFormData.capacity = Math.min(newFormData.capacity, 4)
			newFormData.group = false
		}

		// Handle capacity changes
		if (field === 'capacity') {
			// Prevent changing capacity for private training activities
			if (activity?.capacity === 1) {
				toast.error('Private training activities must have capacity of 1')
				return
			}

			// If semi-private is enabled, cap at 4
			if (newFormData.semi_private && value > 4) {
				newFormData.capacity = 4
				toast.error('Semi-private activities are limited to 4 participants')
				return
			}
			
			// Auto-update group status based on capacity
			if (!newFormData.semi_private) {
				newFormData.group = value > 1
			}
			
			// If capacity > 4 and not semi-private, disable semi-private
			if (value > 4) {
				newFormData.semi_private = false
			}
		}

		// If enabling group, disable semi-private
		if (field === 'group' && value === true) {
			newFormData.semi_private = false
		}

		setFormData(newFormData)
	}

	const handleSave = () => {
		if (!validateForm()) {
			toast.error('Please fix the validation errors before saving')
			return
		}

		if (!formData.name.trim()) {
			toast.error('Activity name is required')
			return
		}

		if (formData.credits <= 0) {
			toast.error('Credits must be greater than 0')
			return
		}

		onSave({
			id: activity.id,
			...formData
		})
	}

	if (!isOpen) return null

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
				onClick={onClose}>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					exit={{ scale: 0.9, opacity: 0 }}
					className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-auto shadow-xl"
					onClick={(e) => e.stopPropagation()}>
					
					{/* Header */}
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-2xl font-bold text-green-400">Edit Activity</h3>
						<button
							onClick={onClose}
							className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition duration-200">
							<FaTimes />
						</button>
					</div>

					{/* Form */}
					<div className="space-y-4">
						{/* Activity Name */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Activity Name
							</label>
							<input
								type="text"
								value={formData.name}
								onChange={(e) => handleInputChange('name', e.target.value)}
								className="w-full p-3 bg-gray-700 border-2 border-green-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300"
								placeholder="Enter activity name"
							/>
						</div>

						{/* Credits */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Credits
							</label>
							<input
								type="number"
								value={formData.credits}
								onChange={(e) => handleInputChange('credits', parseInt(e.target.value) || 0)}
								min="1"
								className="w-full p-3 bg-gray-700 border-2 border-green-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300"
								placeholder="Enter credits"
							/>
						</div>

						{/* Capacity */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Capacity
							</label>
							<input
								type="number"
								value={formData.capacity}
								onChange={(e) => handleInputChange('capacity', parseInt(e.target.value) || 0)}
								min="1"
								max={formData.semi_private ? 4 : undefined}
								disabled={activity?.capacity === 1}
								className={`w-full p-3 bg-gray-700 border-2 border-green-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition duration-300 ${
									activity?.capacity === 1 ? 'opacity-50 cursor-not-allowed' : ''
								}`}
								placeholder={formData.semi_private ? "Enter capacity (Max 4)" : "Enter capacity"}
							/>
							<p className="text-xs text-gray-400 mt-1">
								{activity?.capacity === 1 
									? "Private training activities have fixed capacity of 1"
									: formData.semi_private 
										? "Semi-private activities are limited to 4 participants"
										: "Capacity > 4 makes this a group activity"
								}
							</p>
						</div>

						{/* Group Activity Indicator */}
						<div className="flex items-center space-x-3">
							<div className={`px-3 py-1 rounded-full text-sm ${
								formData.group 
									? 'bg-blue-600 text-white' 
									: 'bg-gray-600 text-gray-300'
							}`}>
								{formData.group ? 'Group Activity' : 'Individual Activity'}
							</div>
						</div>

						{/* Semi-Private Toggle - Only show for non-private activities */}
						{formData.capacity !== 1 && (
							<div>
								<label className="flex items-center space-x-3">
									<input
										type="checkbox"
										checked={formData.semi_private}
										onChange={(e) => handleInputChange('semi_private', e.target.checked)}
										disabled={formData.capacity > 4}
										className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
									/>
									<span className={`text-sm ${
										formData.capacity > 4
											? 'text-gray-500' 
											: 'text-gray-300'
									}`}>
										Semi-Private Activity (Max 4 participants)
									</span>
								</label>
								{formData.capacity > 4 && (
									<div className="flex items-center mt-2 text-amber-400 text-xs">
										<FaExclamationTriangle className="mr-1" />
										Activities with more than 4 participants cannot be semi-private
									</div>
								)}
								{formData.semi_private && (
									<div className="flex items-center mt-2 text-green-400 text-xs">
										✓ Semi-private activities are limited to 4 participants maximum
									</div>
								)}
							</div>
						)}

						{/* Private Training Indicator */}
						{formData.capacity === 1 && (
							<div className="bg-blue-900 border border-blue-600 rounded-lg p-3 text-blue-200 text-sm">
								<div className="flex items-center">
									<span className="mr-2">🔒</span>
									This is a Private Training activity (capacity fixed at 1)
								</div>
							</div>
						)}

						{/* Validation Error */}
						{validationErrors.semiPrivateGroup && (
							<div className="bg-red-900 border border-red-600 rounded-lg p-3 text-red-200 text-sm">
								<div className="flex items-center">
									<FaExclamationTriangle className="mr-2" />
									Activities with more than 4 participants cannot be semi-private
								</div>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex justify-end space-x-3 mt-6">
						<button
							onClick={onClose}
							className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 transition duration-200">
							Cancel
						</button>
						<button
							onClick={handleSave}
							disabled={buttonLoading || validationErrors.semiPrivateGroup}
							className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center">
							<FaSave className="mr-2" />
							{buttonLoading ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	)
}

export default EditActivityModal 