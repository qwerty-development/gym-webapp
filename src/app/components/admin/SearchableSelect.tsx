import React, { useState, useRef, useEffect } from 'react'
import { Combobox } from '@headlessui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { RiUserSearchLine, RiCheckLine } from 'react-icons/ri'

interface Option {
	value: string
	label: string
}

interface SearchableSelectProps {
	options: Option[]
	value: Option | null
	onChange: (option: Option | null) => void
	placeholder: string
}

export default function SearchableSelect({
	options,
	value,
	onChange,
	placeholder
}: SearchableSelectProps) {
	const [query, setQuery] = useState('')
	const [isOpen, setIsOpen] = useState(false)
	const comboboxRef = useRef<HTMLDivElement>(null)

	const filteredOptions =
		query === ''
			? options
			: options.filter(option =>
					option.label
						.toLowerCase()
						.replace(/\s+/g, '')
						.includes(query.toLowerCase().replace(/\s+/g, ''))
			  )

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				comboboxRef.current &&
				!comboboxRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	return (
		<div className='relative w-full max-w-md mx-auto' ref={comboboxRef}>
			<Combobox value={value} onChange={onChange} nullable>
				{({ open }) => (
					<>
						<div className='relative mt-1'>
							<motion.div
								initial={false}
								transition={{ duration: 0.2 }}
								className='relative w-full cursor-default rounded-lg bg-gray-800 text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:text-sm'>
								<Combobox.Input
									className='w-full border-none py-4 pl-12 pr-10 text-sm leading-5 text-gray-200 bg-gray-800 focus:ring-0 placeholder-gray-500'
									displayValue={(option: Option) => option?.label}
									onChange={event => {
										setQuery(event.target.value)
										setIsOpen(true)
									}}
									placeholder={placeholder}
								/>
								<Combobox.Button className='absolute inset-y-0 left-0 flex items-center pl-3'>
									<RiUserSearchLine
										className='h-5 w-5 text-gray-400'
										aria-hidden='true'
									/>
								</Combobox.Button>
							</motion.div>
							<AnimatePresence>
								{open && (
									<motion.div
										initial={{ opacity: 0, y: -10 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -10 }}
										transition={{ duration: 0.2 }}
										className='absolute mt-1 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10'>
										<Combobox.Options static className='max-h-60'>
											{filteredOptions.length === 0 && query !== '' ? (
												<div className='relative cursor-default select-none py-2 px-4 text-gray-400'>
													Nothing found.
												</div>
											) : (
												filteredOptions.map(option => (
													<Combobox.Option
														key={option.value}
														className={({ active }) =>
															`relative cursor-default select-none py-3 pl-10 pr-4 ${
																active
																	? 'bg-green-500 text-gray-200'
																	: 'text-gray-300'
															}`
														}
														value={option}>
														{({ selected, active }) => (
															<>
																<span
																	className={`block truncate ${
																		selected ? 'font-medium' : 'font-normal'
																	}`}>
																	{option.label}
																</span>
																{selected ? (
																	<span
																		className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
																			active
																				? 'text-gray-200'
																				: 'text-green-400'
																		}`}>
																		<RiCheckLine
																			className='h-5 w-5'
																			aria-hidden='true'
																		/>
																	</span>
																) : null}
															</>
														)}
													</Combobox.Option>
												))
											)}
										</Combobox.Options>
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</>
				)}
			</Combobox>
		</div>
	)
}
