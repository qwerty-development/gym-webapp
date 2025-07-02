'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
	addCoach,
	deleteCoach,
	addActivity,
	deleteActivity,
	fetchCoaches,
	fetchActivities,
	updateActivity,
	updateCoach,
	fetchGroupActivities
} from '../../../../../utils/adminRequests'
import toast from 'react-hot-toast'
import CoachesSection from './CoachesSection'
import ActivitiesSection from './ActivitiesSection'
import EditActivityModal from './EditActivityModal'

const CoachesandActivitiesAdminPage = () => {
	const [coaches, setCoaches] = useState<any[]>([])
	const [activities, setActivities] = useState<any[]>([])
	const [groupactivities, setGroupActivities] = useState<any[]>([])
	const [loading, setLoading] = useState(true)
	const [buttonLoading, setButtonLoading] = useState(false)

	// Coaches state
	const [newCoachName, setNewCoachName] = useState('')
	const [newCoachEmail, setNewCoachEmail] = useState('')
	const [newCoachPicture, setNewCoachPicture] = useState<File | null>(null)
	const [showUpdateForm, setShowUpdateForm] = useState(false)
	const [updateCoachId, setUpdateCoachId] = useState<number | null>(null)
	const [updatedCoachName, setUpdatedCoachName] = useState('')
	const [updatedCoachEmail, setUpdatedCoachEmail] = useState('')
	const [updatedCoachPicture, setUpdatedCoachPicture] = useState<File | null>(
		null
	)

	// Activities state
	const [newActivityName, setNewActivityName] = useState('')
	const [newActivityCredits, setNewActivityCredits] = useState('')
	const [newActvityCapacity, setNewActivityCapacity] = useState('')
	const [newActivitySemiPrivate, setNewActivitySemiPrivate] = useState(false)
	const [isPrivateTraining, setIsPrivateTraining] = useState<boolean>(true)

	// Edit modal state
	const [editModalOpen, setEditModalOpen] = useState(false)
	const [selectedActivity, setSelectedActivity] = useState<any>(null)

	useEffect(() => {
		const loadInitialData = async () => {
			setLoading(true)
			const loadedCoaches = await fetchCoaches()
			const loadedActivities = await fetchActivities()
			const loadedGroupActivities = await fetchGroupActivities()
			setCoaches(loadedCoaches || [])
			setActivities(loadedActivities || [])
			setGroupActivities(loadedGroupActivities || [])
			setLoading(false)
		}
		loadInitialData()
	}, [])

	// Effect to handle semi-private validation when capacity changes
	useEffect(() => {
		const capacity = parseInt(newActvityCapacity, 10) || 0
		// If capacity > 4 and semi-private is selected, disable semi-private
		if (capacity > 4 && newActivitySemiPrivate) {
			setNewActivitySemiPrivate(false)
		}
	}, [newActvityCapacity, newActivitySemiPrivate])

	const refreshData = async () => {
		const loadedCoaches = await fetchCoaches()
		const loadedActivities = await fetchActivities()
		const loadedGroupActivities = await fetchGroupActivities()
		setCoaches(loadedCoaches || [])
		setActivities(loadedActivities || [])
		setGroupActivities(loadedGroupActivities || [])
	}

	// Coach handlers
	const handleAddCoach = async () => {
		setButtonLoading(true)
		if (newCoachName.trim() && newCoachEmail.trim()) {
			await addCoach(
				{ name: newCoachName, email: newCoachEmail },
				newCoachPicture
			)
			setNewCoachName('')
			setNewCoachEmail('')
			setNewCoachPicture(null)
			refreshData()
			toast.success('Coach added successfully')
		} else {
			toast.error('Please provide a valid name and email for the coach')
		}
		setButtonLoading(false)
	}

	const handleSubmitUpdate = async () => {
		setButtonLoading(true)
		if (updatedCoachName.trim() !== '' && updatedCoachEmail.trim() !== '') {
			await updateCoach(
				updateCoachId!,
				{ name: updatedCoachName, email: updatedCoachEmail },
				updatedCoachPicture
			)
			setShowUpdateForm(false)
			refreshData()
			toast.success('Coach updated successfully')
		} else {
			toast.error('Please provide a valid name and email for the coach')
		}
		setButtonLoading(false)
	}

	const handleDeleteCoach = async (coachId: number) => {
		setButtonLoading(true)
		const success = await deleteCoach(coachId)
		if (success) {
			setCoaches(coaches.filter(coach => coach.id !== coachId))
			refreshData()
			toast.success('Coach deleted successfully')
		} else {
			toast.error(
				'Error deleting coach. Check activities and time slots related'
			)
		}
		setButtonLoading(false)
	}

	const handleToggleForm = (id: number) => {
		if (updateCoachId === id) {
			setShowUpdateForm(false)
			setUpdateCoachId(null)
			setUpdatedCoachName('')
			setUpdatedCoachEmail('')
			setUpdatedCoachPicture(null)
		} else {
			setShowUpdateForm(true)
			setUpdateCoachId(id)
			const coach = coaches.find(coach => coach.id === id)
			setUpdatedCoachName(coach?.name || '')
			setUpdatedCoachEmail(coach?.email || '')
			setUpdatedCoachPicture(null)
		}
	}

	const handleFileChange = (file: File) => {
		if (file) {
			if (showUpdateForm) {
				setUpdatedCoachPicture(file)
			} else {
				setNewCoachPicture(file)
			}
		}
	}

	// Activity handlers
	const handleAddActivity = async () => {
		setButtonLoading(true)
		
		let finalCapacity, finalSemiPrivate, finalGroup
		
		if (isPrivateTraining) {
			// Private training activities are always individual with capacity 1
			finalCapacity = 1
			finalSemiPrivate = false
			finalGroup = false
		} else {
			// Classes section - can be group or semi-private
			const capacity = parseInt(newActvityCapacity, 10) || 0
			
			if (newActivitySemiPrivate) {
				// Semi-private activities are capped at 4
				finalCapacity = Math.min(capacity, 4)
				finalSemiPrivate = true
				finalGroup = false
			} else {
				// Regular group activities
				finalCapacity = capacity
				finalSemiPrivate = false
				finalGroup = capacity > 1
			}
			
			// Validation: prevent group activities from being semi-private
			if (finalGroup && finalSemiPrivate) {
				toast.error('Group activities cannot be semi-private')
				setButtonLoading(false)
				return
			}
		}

		const activityData = {
			name: newActivityName,
			credits: parseInt(newActivityCredits, 10),
			capacity: finalCapacity,
			semi_private: finalSemiPrivate,
			group: finalGroup
		}
		
		const activity = await addActivity(activityData)
		if (activity) setActivities([...activities, activity])
		setNewActivityName('')
		setNewActivityCredits('')
		setNewActivityCapacity('')
		setNewActivitySemiPrivate(false)
		refreshData()
		toast.success('Activity added successfully')
		setButtonLoading(false)
	}

	const handleDeleteActivity = async (activityId: number) => {
		setButtonLoading(true)
		const success = await deleteActivity(activityId)
		if (success) {
			setActivities(activities.filter(activity => activity.id !== activityId))
			refreshData()
			toast.success('Activity deleted successfully')
		} else {
			toast.error('Error deleting activity. Check time slots first')
		}
		setButtonLoading(false)
	}

	const handleUpdateActivity = async (activityId: number) => {
		const activity = [...activities, ...groupactivities].find(a => a.id === activityId)
		if (activity) {
			setSelectedActivity(activity)
			setEditModalOpen(true)
		}
	}

	const handleSaveActivity = async (updatedActivity: any) => {
		setButtonLoading(true)
		try {
			const result = await updateActivity(updatedActivity)
			if (result) {
				refreshData()
				setEditModalOpen(false)
				setSelectedActivity(null)
				toast.success('Activity updated successfully')
			} else {
				toast.error('Error updating activity')
			}
		} catch (error) {
			console.error('Error updating activity:', error)
			toast.error('Error updating activity')
		}
		setButtonLoading(false)
	}

	const handleCloseModal = () => {
		setEditModalOpen(false)
		setSelectedActivity(null)
	}

	const handleToggle = () => {
		setIsPrivateTraining(!isPrivateTraining)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gray-900 text-white font-sans p-8'>
			<CoachesSection
				coaches={coaches}
				loading={loading}
				buttonLoading={buttonLoading}
				newCoachName={newCoachName}
				setNewCoachName={setNewCoachName}
				newCoachEmail={newCoachEmail}
				setNewCoachEmail={setNewCoachEmail}
				handleAddCoach={handleAddCoach}
				handleDeleteCoach={handleDeleteCoach}
				handleToggleForm={handleToggleForm}
				handleFileChange={handleFileChange}
				showUpdateForm={showUpdateForm}
				updateCoachId={updateCoachId}
				updatedCoachName={updatedCoachName}
				setUpdatedCoachName={setUpdatedCoachName}
				updatedCoachEmail={updatedCoachEmail}
				setUpdatedCoachEmail={setUpdatedCoachEmail}
				handleSubmitUpdate={handleSubmitUpdate}
			/>

			<hr className='border-gray-700 my-12' />

			<ActivitiesSection
				activities={activities}
				groupactivities={groupactivities}
				loading={loading}
				buttonLoading={buttonLoading}
				isPrivateTraining={isPrivateTraining}
				handleToggle={handleToggle}
				newActivityName={newActivityName}
				setNewActivityName={setNewActivityName}
				newActivityCredits={newActivityCredits}
				setNewActivityCredits={setNewActivityCredits}
				newActvityCapacity={newActvityCapacity}
				setNewActivityCapacity={(capacity) => {
					// If semi-private is selected and capacity > 4, cap at 4
					if (newActivitySemiPrivate && parseInt(capacity, 10) > 4) {
						setNewActivityCapacity('4')
					} else {
						setNewActivityCapacity(capacity)
						// Auto-disable semi-private if capacity > 4
						if (parseInt(capacity, 10) > 4) {
							setNewActivitySemiPrivate(false)
						}
					}
				}}
				newActivitySemiPrivate={newActivitySemiPrivate}
				setNewActivitySemiPrivate={setNewActivitySemiPrivate}
				handleAddActivity={handleAddActivity}
				handleUpdateActivity={handleUpdateActivity}
				handleDeleteActivity={handleDeleteActivity}
			/>

			<EditActivityModal
				isOpen={editModalOpen}
				activity={selectedActivity}
				onClose={handleCloseModal}
				onSave={handleSaveActivity}
				buttonLoading={buttonLoading}
			/>
		</motion.div>
	)
}

export default CoachesandActivitiesAdminPage
