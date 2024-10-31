import React from 'react'
import { Menu, Transition } from '@headlessui/react'
import { FaChevronDown } from 'react-icons/fa'

interface ScrollableMenuProps {
	users: Array<{
		first_name: string
		last_name: string
	}>
}

const ScrollableMenu: React.FC<ScrollableMenuProps> = ({ users }) => {
	return (
		<Menu as='div' className='relative inline-block text-center'>
			<div>
				<Menu.Button className='inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500'>
					Clients ({users.length})
					<FaChevronDown className='-mr-1 ml-2 h-5 w-5' aria-hidden='true' />
				</Menu.Button>
			</div>

			<Transition
				as={React.Fragment}
				enter='transition ease-out duration-100'
				enterFrom='transform opacity-0 scale-95'
				enterTo='transform opacity-100 scale-100'
				leave='transition ease-in duration-75'
				leaveFrom='transform opacity-100 scale-100'
				leaveTo='transform opacity-0 scale-95'>
				<Menu.Items className='origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg bg-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-y-auto custom-scrollbar'>
					<div className='py-1'>
						{users.map((user, userIndex) => (
							<Menu.Item key={userIndex}>
								{({ active }) => (
									<div
										className={`${
											active ? 'bg-gray-600 text-gray-100' : 'text-gray-300'
										} block px-4 py-2 text-sm cursor-default`}>
										{`${user.first_name} ${user.last_name}`}
									</div>
								)}
							</Menu.Item>
						))}
					</div>
				</Menu.Items>
			</Transition>
		</Menu>
	)
}

export default ScrollableMenu
