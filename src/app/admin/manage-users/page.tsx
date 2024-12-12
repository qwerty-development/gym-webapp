import { redirect } from 'next/navigation'
import { checkRoleAdmin } from '../../../../utils/roles'
import { SearchUsers } from './_search-users'
import { clerkClient } from '@clerk/nextjs'
import { setRole, removeAdmin, deleteUser } from './_action'
import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import ModifyCreditsComponent from '@/app/components/admin/modifycredits'
import { FaUserShield, FaUserMinus, FaUserTimes } from 'react-icons/fa'

export default async function AdminDashboard(params: {
	searchParams: { search?: string }
}) {
	if (!checkRoleAdmin('admin')) {
		redirect('/')
	}

	let query = params.searchParams.search
	let users = query ? await clerkClient.users.getUserList({ query }) : []

	const makeAdmin = async (formData: FormData) => {
		'use server'
		await setRole(formData)
		redirect('/admin/manage-users')
	}

	const DeleteUser = async (formData: FormData) => {
		'use server'
		await deleteUser(formData)
		redirect('/admin/manage-users')
	}

	const RemoveAdmin = async (formData: FormData) => {
		'use server'
		await removeAdmin(formData)
		redirect('/admin/manage-users')
	}

	return (
		<div className='min-h-screen bg-gray-900 text-white font-sans'>
			<AdminNavbarComponent />
			<div className='container mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				<h1 className='text-4xl mt-4 text-center font-bold text-green-400 mb-12'>
					User Roles Management
				</h1>

				<SearchUsers />

				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12'>
					{users.map((user, index) => (
						<div
							key={user.id}
							className='bg-gray-800 shadow-lg rounded-2xl p-6 hover:shadow-green-500/30 transition-all duration-300'>
							<div className='flex items-center space-x-6 mb-4'>
								<div className='flex-1'>
									<h3 className='text-xl font-semibold text-green-400'>
										{user.firstName} {user.lastName}
									</h3>
									<p className='text-gray-400 mt-1'>
										{
											user.emailAddresses.find(
												email => email.id === user.primaryEmailAddressId
											)?.emailAddress
										}
									</p>
									<span className='inline-block bg-green-500 text-gray-900 text-xs px-3 py-1 rounded-full uppercase font-semibold tracking-wide mt-2'>
										{user.publicMetadata.role === 'admin' ? 'Admin' : 'User'}
									</span>
								</div>
							</div>

							<div className='flex space-x-3 mt-6'>
								{user.publicMetadata.role !== 'admin' && (
									<form action={makeAdmin} className='flex-1'>
										<input type='hidden' value={user.id} name='id' />
										<input type='hidden' value='admin' name='role' />

										<button className='w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center'>
											<FaUserShield className='mr-2' /> Make Admin
										</button>
									</form>
								)}

								{user.publicMetadata.role === 'admin' && (
									<form action={RemoveAdmin} className='flex-1'>
										<input type='hidden' value={user.id} name='id' />
										<input type='hidden' value='moderator' name='role' />
										<button className='w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center'>
											<FaUserMinus className='mr-2' /> Remove Admin
										</button>
									</form>
								)}
								{user.publicMetadata.role !== 'admin' && (
									<form action={DeleteUser} className='flex-1'>
										<input type='hidden' value={user.id} name='id' />
										<button className='w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-full transition-all duration-300 flex items-center justify-center'>
											<FaUserTimes className='mr-2' /> Delete User
										</button>
									</form>
								)}
							</div>
						</div>
					))}
				</div>

				<div className='mt-16'>
					<h2 className='text-3xl text-center font-bold text-green-400 mb-8'>
						Modify Credits
					</h2>
					<ModifyCreditsComponent />
				</div>
			</div>
		</div>
	)
}
