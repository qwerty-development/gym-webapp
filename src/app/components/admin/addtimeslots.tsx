'use client'
import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import 'react-datepicker/dist/react-datepicker.css'
import {
	fetchCoaches,
	fetchActivities,
	addTimeSlot,
	fetchGroupActivities,
	addTimeSlotGroup
} from '../../../../utils/adminRequests'
import MultiDatePicker from 'react-multi-date-picker'
import DatePanel from 'react-multi-date-picker/plugins/date_panel'
import Icon from 'react-multi-date-picker/components/icon'
import Toolbar from 'react-multi-date-picker/plugins/toolbar'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { FaClock, FaPlus, FaTrash } from 'react-icons/fa'
import { RingLoader } from 'react-spinners'
import { DateObject } from 'react-multi-date-picker'

type OptionType = {
	label: string
	value: string
}

type SessionConfig = {
	id: string
	coaches: OptionType[]
	activity: OptionType | null
	startTime: string
	endTime: string
}

const customSelectStyles = {
	control: (provided: any) => ({
		...provided,
		backgroundColor: '#353b35',
		borderColor: '#36783a',
		borderRadius: '9999px',
		padding: '0.5rem',
		boxShadow: 'none',
		'&:hover': {
			borderColor: '#4c6f46'
		}
	}),
	menu: (provided: any) => ({
		...provided,
		backgroundColor: '#353b35'
	}),
	option: (provided: any, state: { isSelected: any }) => ({
		...provided,
		backgroundColor: state.isSelected ? '#36783a' : '#353b35',
		'&:hover': {
			backgroundColor: '#4c6f46',
			color: 'white'
		}
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: 'white'
	}),
	input: (provided: any) => ({
		...provided,
		color: 'white'
	})
}

const createEmptySessionConfig = () => ({
	id: Date.now().toString(),
	coaches: [],
	activity: null,
	startTime: '',
	endTime: ''
})

export default function AddTimeSlotComponent() {
	// States for private sessions
	const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()])
	const [sessionConfigs, setSessionConfigs] = useState<SessionConfig[]>([
		createEmptySessionConfig()
	])
	const [isPrivate, setIsPrivate] = useState(true)

	// Shared states
	const [coaches, setCoaches] = useState<OptionType[]>([])
	const [activities, setActivities] = useState<OptionType[]>([])
	const [groupActivities, setGroupActivities] = useState<OptionType[]>([])
	const [buttonLoading, setButtonLoading] = useState(false)

	useEffect(() => {
		async function loadCoachesAndActivities() {
			const fetchedCoaches = await fetchCoaches()
			setCoaches(
				fetchedCoaches.map((coach: any) => ({
					label: coach.name,
					value: coach.id
				}))
			)
			const fetchedActivities = await fetchActivities()
			setActivities(
				fetchedActivities.map(activity => ({
					label: activity.name,
					value: activity.id
				}))
			)
			const fetchedGroupActivities = await fetchGroupActivities()
			setGroupActivities(
				fetchedGroupActivities.map(activity => ({
					label: activity.name,
					value: activity.id
				}))
			)
		}

		loadCoachesAndActivities()
	}, [])

	const handleDateChange = (dates: DateObject | DateObject[] | null) => {
		if (Array.isArray(dates)) {
			setSelectedDates(dates.map(date => date.toDate()))
		}
	}

	const addSessionConfig = () => {
		setSessionConfigs([...sessionConfigs, createEmptySessionConfig()])
	}

	const removeSessionConfig = (id: string) => {
		setSessionConfigs(sessionConfigs.filter(config => config.id !== id))
	}

	const updateSessionConfig = (
		id: string,
		field: keyof SessionConfig,
		value: any
	) => {
		setSessionConfigs(
			sessionConfigs.map(config =>
				config.id === id ? { ...config, [field]: value } : config
			)
		)
	}

	const handleSessionTypeChange = (newIsPrivate: boolean) => {
		setIsPrivate(newIsPrivate)
		// Reset session configs when switching types
		setSessionConfigs([createEmptySessionConfig()])
	}

	const validateSessionConfigs = () => {
		for (const config of sessionConfigs) {
			if (!config.coaches.length || !config.activity || !config.startTime || !config.endTime) {
				toast.error('Please fill in all fields for each session')
				return false
			}

			const start = new Date(`2000-01-01T${config.startTime}`)
			const end = new Date(`2000-01-01T${config.endTime}`)

			if (end <= start) {
				toast.error('End time must be after start time')
				return false
			}

			const duration = (end.getTime() - start.getTime()) / (1000 * 60)
			if (duration < 30) {
				toast.error('Session must be at least 30 minutes long')
				return false
			}
		}
		return true
	}

	const handleAddSessions = async () => {
		setButtonLoading(true)
		if (!validateSessionConfigs()) {
			setButtonLoading(false)
			return
		}

		let successCount = 0
		let duplicateCount = 0
		let errorCount = 0

		for (const date of selectedDates) {
			for (const config of sessionConfigs) {
				// Create a time slot for each selected coach
				for (const coach of config.coaches) {
					const newTimeSlot = {
						coach_id: coach.value,
						activity_id: config.activity?.value,
						date: date.toISOString().substring(0, 10),
						start_time: config.startTime,
						end_time: config.endTime,
						booked: false,
						additions: [],
						user_id: null
					}

					const result = isPrivate
						? await addTimeSlot(newTimeSlot)
						: await addTimeSlotGroup({
								...newTimeSlot,
								user_id: [],
								count: 0
						  })

					if (result.success) {
						successCount++
					} else if (
						result.error === 'Time slot already exists' ||
						result.error === 'Group time slot already exists'
					) {
						duplicateCount++
					} else {
						errorCount++
					}
				}
			}
		}

		if (successCount > 0) {
			toast.success(
				`Successfully added ${successCount} ${
					isPrivate ? 'private' : 'group'
				} time slot(s)`
			)
			// Reset form after successful submission
			setSessionConfigs([createEmptySessionConfig()])
			setSelectedDates([new Date()])
		}
		if (duplicateCount > 0) {
			toast.error(
				`${duplicateCount} ${
					isPrivate ? 'private' : 'group'
				} time slot(s) already existed`
			)
		}
		if (errorCount > 0) {
			toast.error(
				`Failed to add ${errorCount} ${
					isPrivate ? 'private' : 'group'
				} time slot(s)`
			)
		}

		setButtonLoading(false)
	}

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='min-h-screen bg-gray-900 text-white font-sans p-8'>
			<div className='flex justify-between items-center mb-8'>
				<h1 className='text-4xl font-bold text-green-400'>
					Add {isPrivate ? 'Private' : 'Group'} Time Slots
				</h1>
				<button
					onClick={() => handleSessionTypeChange(!isPrivate)}
					className='px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors'>
					Switch to {isPrivate ? 'Group' : 'Private'} Sessions
				</button>
			</div>

			<motion.div className='bg-gray-800 rounded-xl p-6 mb-8 shadow-lg hover:shadow-green-500/30 transition duration-300'>
				<div className='mb-6'>
					<h3 className='text-lg font-semibold mb-3 text-green-400'>
						Select Dates
					</h3>
					<MultiDatePicker
						value={selectedDates}
						onChange={handleDateChange}
						format='YYYY-MM-DD'
						plugins={[
							<DatePanel key='date-panel' sort='date' />,
							<Toolbar
								key='toolbar'
								position='bottom'
								sort={['deselect', 'close', 'today']}
							/>
						]}
						render={<Icon />}
						className='custom-date-picker w-full bg-gray-700 border-2 border-green-400 rounded-full text-white'
						containerClassName='custom-date-picker-container'
					/>
				</div>

				<div className='space-y-6'>
					{sessionConfigs.map((config, index) => (
						<div
							key={config.id}
							className='bg-gray-700 p-4 rounded-lg relative'>
							{index > 0 && (
								<button
									onClick={() => removeSessionConfig(config.id)}
									className='absolute top-2 right-2 text-red-500 hover:text-red-400'>
									<FaTrash />
								</button>
							)}
							<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
								<Select
									placeholder='Select Coaches'
									options={coaches}
									onChange={value =>
										updateSessionConfig(config.id, 'coaches', value)
									}
									value={config.coaches}
									isMulti
									styles={customSelectStyles}
								/>
								<Select
									placeholder='Select Activity'
									options={isPrivate ? activities : groupActivities}
									onChange={value =>
										updateSessionConfig(config.id, 'activity', value)
									}
									value={config.activity}
									styles={customSelectStyles}
								/>
								<div className='relative'>
									<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
									<input
										type='time'
										value={config.startTime}
										onChange={e =>
											updateSessionConfig(
												config.id,
												'startTime',
												e.target.value
											)
										}
										className='w-full p-3 pl-10 bg-gray-600 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
									/>
								</div>
								<div className='relative'>
									<FaClock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500' />
									<input
										type='time'
										value={config.endTime}
										onChange={e =>
											updateSessionConfig(
												config.id,
												'endTime',
												e.target.value
											)
										}
										className='w-full p-3 pl-10 bg-gray-600 border-2 border-green-500 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent'
									/>
								</div>
							</div>
						</div>
					))}

					<button
						onClick={addSessionConfig}
						className='w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center gap-2 transition-colors'>
						<FaPlus />
						Add Another Session
					</button>
				</div>

				{/* Preview Section */}
				{selectedDates.length > 0 && sessionConfigs.some(config => config.coaches.length > 0 && config.activity && config.startTime && config.endTime) && (
					<div className='mt-6'>
						<h3 className='text-lg font-semibold mb-3 text-green-400'>
							Preview
						</h3>
						<div className='bg-gray-700 rounded-lg p-4'>
							<p className='text-sm mb-2'>
								You are about to create{' '}
								{selectedDates.length * sessionConfigs.reduce((total, config) => total + config.coaches.length, 0)} time slot(s):
							</p>
							<div className='space-y-2'>
								{selectedDates.map((date, dateIndex) => (
									<div key={dateIndex} className='text-sm'>
										<p className='font-semibold mb-1'>
											{date.toLocaleDateString()}:
										</p>
										<ul className='ml-4 space-y-1'>
											{sessionConfigs.map((config, configIndex) => (
												<>
													{config.coaches.map((coach, coachIndex) => (
														<li
															key={`${configIndex}-${coachIndex}`}
															className='flex justify-between'>
															<span>
																{coach.label} -{' '}
																{config.activity?.label}
															</span>
															<span>
																{config.startTime} -{' '}
																{config.endTime}
															</span>
														</li>
													))}
												</>
											))}
										</ul>
									</div>
								))}
							</div>
						</div>
					</div>
				)}

				<motion.button
					onClick={handleAddSessions}
					disabled={buttonLoading}
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					className='w-full mt-6 px-6 py-3 bg-green-500 disabled:bg-green-700 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition duration-300'>
					{buttonLoading ? (
						<RingLoader color='#ffffff' size={24} />
					) : (
						`Add ${isPrivate ? 'Private' : 'Group'} Time Slots`
					)}
				</motion.button>
			</motion.div>
		</motion.div>
	)
}
