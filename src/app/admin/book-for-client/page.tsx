import AdminNavbarComponent from '@/app/components/admin/adminnavbar'
import { checkRoleAdmin } from '../../../../utils/roles'
import { redirect } from 'next/navigation'
import BookForClient from '@/app/components/admin/bookforclient'

export default function bookforclient() {
	if (!checkRoleAdmin('admin')) {
		redirect('/')
	}
	return (
		<div>
			<AdminNavbarComponent />
			<section className=''>
				<BookForClient />
			</section>
		</div>
	)
}
